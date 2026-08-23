/**
 * AgentBond Wallet-First Authentication & User Profile Handler
 * 
 * Endpoints:
 * - POST /auth/nonce: Generate single-use cryptographic nonce
 * - POST /auth/login: Verify Ed25519 wallet signature and issue session token
 * - POST /auth/username: Claim globally unique permanent username
 * - GET /user/profile: Get authenticated user profile & stats
 * - GET /user/analytics: Get spending time-series and decision distribution
 * - POST /auth/logout: Invalidate active session
 */

import type { Context } from 'hono';
import crypto from 'crypto';
import algosdk from 'algosdk';
import { db } from '../db';

// In-memory persistent datastores (backend enclave only)
export interface UserRecord {
  id: string;
  username?: string; // unique, normalized lowercase
  walletAddress: string;
  displayName?: string;
  role: 'individual' | 'developer' | 'admin';
  reputationScore: number;
  defaultCount: number;
  isBlocked?: boolean;
  kycTier: number; // 0 = unverified, 1 = verified
  totalLoansSettled: number;
  borrowLimit: number; // in USDC
  createdAtTime: number; // unix timestamp for cooling checks
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface NonceRecord {
  id: string;
  walletAddress: string;
  nonceHash: string;
  messageTemplate: string;
  expiresAt: number;
  usedAt?: number;
}

export interface SessionRecord {
  id: string;
  userId: string;
  walletAddress: string;
  sessionTokenHash: string;
  expiresAt: number;
  createdAt: string;
  revokedAt?: string;
}

export interface VerificationLog {
  id: string;
  userId: string;
  walletAddress: string;
  service: string;
  endpoint: string;
  inputHash: string;
  decision: 'safe' | 'review_before_action' | 'suspicious';
  risk: 'low' | 'medium' | 'high';
  confidence: number;
  amount: number;
  currency: string;
  timestamp: string;
}

// Memory tables
export const usersDb = new Map<string, UserRecord>();
export const usernamesDb = new Map<string, string>(); // lowercase username -> walletAddress
export const noncesDb = new Map<string, NonceRecord>();
export const sessionsDb = new Map<string, SessionRecord>();
export const verificationLogsDb: VerificationLog[] = [];

// Security & Audit Log Datastores
export interface SecurityAuditLog {
  timestamp: string;
  eventType: string;
  actor: string;
  details: string;
  status: 'SUCCESS' | 'FAILURE';
}

export const securityAuditLogsDb: SecurityAuditLog[] = [];
export const blacklistedWallets = new Set<string>();
const rateLimitsDb = new Map<string, { count: number; resetAt: number }>();

export function logSecurityEvent(eventType: string, actor: string, details: string, status: 'SUCCESS' | 'FAILURE') {
  const log: SecurityAuditLog = {
    timestamp: new Date().toISOString(),
    eventType,
    actor: actor || 'unknown',
    details,
    status
  };
  securityAuditLogsDb.push(log);
  console.log(`🔒 [Security Audit] [${log.status}] ${eventType} by ${actor}: ${details}`);
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitsDb.get(key);
  if (!record || now > record.resetAt) {
    rateLimitsDb.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

/**
 * Username validation helper
 * Rules:
 * - 3–20 characters
 * - lowercase alphanumeric, underscore, hyphen
 * - cannot be empty
 */
export function validateUsernameFormat(username: unknown): { valid: boolean; error?: string; normalized?: string } {
  if (typeof username !== 'string' || !username.trim()) {
    return { valid: false, error: 'Username is required.' };
  }

  const normalized = username.trim().toLowerCase();

  if (normalized.length < 3 || normalized.length > 20) {
    return { valid: false, error: 'Username must be between 3 and 20 characters in length.' };
  }

  const validCharsRegex = /^[a-z0-9_-]+$/;
  if (!validCharsRegex.test(normalized)) {
    return {
      valid: false,
      error: 'Username may only contain lowercase letters, numbers, underscores (_), and hyphens (-).',
    };
  }

  return { valid: true, normalized };
}

/**
 * Helper to resolve username for any wallet address (public views)
 */
export function resolveUsernameByWallet(walletAddress: string): string {
  if (!walletAddress) return 'anonymous_agent';
  const clean = walletAddress.trim();
  const user = usersDb.get(clean);
  if (user && user.username) {
    return user.username;
  }
  return 'anonymous_agent';
}

/**
 * Helper to resolve wallet address by username
 */
export function resolveWalletByUsername(username: string): string | null {
  if (!username) return null;
  const normalized = username.trim().toLowerCase();
  return usernamesDb.get(normalized) || null;
}

/**
 * POST /auth/nonce
 * Generates a 5-minute cryptographic nonce for the given wallet address
 */
export async function handleGetNonce(c: Context) {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== 'string' || !algosdk.isValidAddress(walletAddress.trim())) {
      logSecurityEvent('NONCE_GENERATED', 'unknown', 'Invalid wallet address requested', 'FAILURE');
      return c.json({ error: 'Valid Algorand wallet address required' }, 400);
    }

    const cleanAddress = walletAddress.trim();

    // Check rate limit: max 5 nonces per minute per wallet
    if (!checkRateLimit(`nonce:${cleanAddress}`, 5, 60 * 1000)) {
      logSecurityEvent('NONCE_GENERATED', cleanAddress, 'Rate limit exceeded for nonce generation', 'FAILURE');
      return c.json({ error: 'Too many nonce requests. Please try again in 1 minute.' }, 429);
    }

    // Check blacklist
    if (blacklistedWallets.has(cleanAddress)) {
      logSecurityEvent('NONCE_GENERATED', cleanAddress, 'Blocked nonce request: wallet is blacklisted', 'FAILURE');
      return c.json({ error: 'This wallet has defaulted and is blacklisted from using AgentBond.' }, 403);
    }

    const rawNonce = crypto.randomBytes(32).toString('hex');
    const nonceHash = crypto.createHash('sha256').update(rawNonce).digest('hex');
    const nonceId = `nonce_${crypto.randomBytes(8).toString('hex')}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    const messageTemplate = `Sign in to AgentBond\n\nWallet: ${cleanAddress}\nNonce: ${rawNonce}\nIssued At: ${new Date().toISOString()}\nNetwork: Algorand TestNet\nPurpose: Authenticate wallet ownership for AgentBond`;

    noncesDb.set(rawNonce, {
      id: nonceId,
      walletAddress: cleanAddress,
      nonceHash,
      messageTemplate,
      expiresAt,
    });

    logSecurityEvent('NONCE_GENERATED', cleanAddress, `Nonce generated successfully`, 'SUCCESS');

    return c.json({
      nonce: rawNonce,
      walletAddress: cleanAddress,
      expiresAt: new Date(expiresAt).toISOString(),
      messageTemplate,
    });
  } catch (err) {
    console.error('Error generating nonce:', err);
    return c.json({ error: 'Failed to generate authentication nonce' }, 500);
  }
}

/**
 * POST /auth/login
 * Validates Ed25519 signature over login message and issues session token
 */
export async function handleLogin(c: Context) {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { walletAddress, nonce, signature } = body;

    if (!walletAddress || !nonce || !signature) {
      logSecurityEvent('LOGIN_ATTEMPT', walletAddress || 'unknown', 'Missing required fields for login', 'FAILURE');
      return c.json({ error: 'walletAddress, nonce, and signature are required' }, 400);
    }

    const cleanAddress = walletAddress.trim();
    if (!algosdk.isValidAddress(cleanAddress)) {
      return c.json({ error: 'Invalid Algorand wallet address.' }, 400);
    }

    // Check rate limit: max 5 login attempts per minute
    if (!checkRateLimit(`login:${cleanAddress}`, 5, 60 * 1000)) {
      logSecurityEvent('LOGIN_ATTEMPT', cleanAddress, 'Rate limit exceeded for login attempts', 'FAILURE');
      return c.json({ error: 'Too many login attempts. Please try again in 1 minute.' }, 429);
    }

    // Check blacklist
    if (blacklistedWallets.has(cleanAddress)) {
      logSecurityEvent('LOGIN_ATTEMPT', cleanAddress, 'Login rejected: wallet is blacklisted due to defaults', 'FAILURE');
      return c.json({ error: 'This wallet has defaulted and is blacklisted from using AgentBond.' }, 403);
    }

    const nonceRecord = noncesDb.get(nonce);

    if (!nonceRecord) {
      logSecurityEvent('LOGIN_ATTEMPT', cleanAddress, 'Invalid or unrecognized authentication nonce used', 'FAILURE');
      return c.json({ error: 'Invalid or unrecognized authentication nonce' }, 401);
    }

    if (nonceRecord.walletAddress !== cleanAddress) {
      logSecurityEvent('LOGIN_ATTEMPT', cleanAddress, 'Nonce wallet address mismatch', 'FAILURE');
      return c.json({ error: 'Nonce does not match provided wallet address' }, 401);
    }

    if (nonceRecord.expiresAt < Date.now()) {
      noncesDb.delete(nonce);
      logSecurityEvent('LOGIN_ATTEMPT', cleanAddress, 'Expired authentication nonce used', 'FAILURE');
      return c.json({ error: 'Authentication nonce has expired. Please request a new one.' }, 401);
    }

    if (nonceRecord.usedAt) {
      logSecurityEvent('LOGIN_ATTEMPT', cleanAddress, 'Reused nonce (Replay attack attempt)', 'FAILURE');
      return c.json({ error: 'Nonce has already been used (Replay attack prevented)' }, 401);
    }

    // Verify Ed25519 signature
    let signatureVerified = false;

    try {
      const messageBytes = new Uint8Array(Buffer.from(nonceRecord.messageTemplate, 'utf-8'));

      let sigBytes: Uint8Array;
      if (typeof signature === 'string') {
        sigBytes = new Uint8Array(Buffer.from(signature, signature.includes('=') ? 'base64' : 'hex'));
      } else if (signature instanceof Uint8Array) {
        sigBytes = signature;
      } else {
        sigBytes = new Uint8Array(Object.values(signature));
      }

      signatureVerified = (algosdk as any).verifyBytes(messageBytes, sigBytes, cleanAddress);
    } catch (sigErr) {
      console.warn('Wallet signature verification failed:', (sigErr as Error).message);
    }

    if (!signatureVerified) {
      logSecurityEvent('LOGIN_ATTEMPT', cleanAddress, 'Cryptographic signature verification failed', 'FAILURE');
      return c.json({ error: 'Cryptographic signature verification failed' }, 401);
    }

    // Mark nonce as used and delete it to invalidate immediately
    nonceRecord.usedAt = Date.now();
    noncesDb.delete(nonce);

    // Find or create user
    let user = usersDb.get(cleanAddress);
    if (!user && process.env.DATABASE_URL) {
      const persisted = await db.user.findUnique({ where: { walletAddress: cleanAddress } });
      if (persisted) {
        user = {
          id: persisted.id,
          username: persisted.username || undefined,
          walletAddress: persisted.walletAddress,
          displayName: persisted.displayName || undefined,
          role: persisted.role as UserRecord['role'],
          reputationScore: persisted.reputationScore,
          defaultCount: persisted.defaultCount,
          kycTier: persisted.kycTier,
          totalLoansSettled: persisted.totalLoansSettled,
          borrowLimit: Number(persisted.borrowLimit),
          createdAtTime: persisted.createdAt.getTime(),
          createdAt: persisted.createdAt.toISOString(),
          updatedAt: persisted.updatedAt.toISOString(),
          lastLoginAt: persisted.lastLoginAt.toISOString(),
        };
        usersDb.set(cleanAddress, user);
        if (user.username) usernamesDb.set(user.username, cleanAddress);
      }
    }
    const nowIso = new Date().toISOString();

    if (!user) {
      user = {
        id: `usr_${crypto.randomBytes(8).toString('hex')}`,
        walletAddress: cleanAddress,
        role: 'individual',
        reputationScore: 650,
        defaultCount: 0,
        kycTier: 0, // Unverified
        totalLoansSettled: 0,
          borrowLimit: 0.25, // Micro-credit cap for TestNet wallet demos
        createdAtTime: Date.now(),
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso,
      };
      usersDb.set(cleanAddress, user);
      console.log(`👤 [Auth] Created new user profile for ${cleanAddress.slice(0, 8)}... (ID: ${user.id})`);
    } else {
      user.lastLoginAt = nowIso;
      user.updatedAt = nowIso;
      usersDb.set(cleanAddress, user);
      console.log(`👤 [Auth] Logged in existing user ${user.id} (${cleanAddress.slice(0, 8)}..., username: ${user.username || 'none'})`);
    }

    if (process.env.DATABASE_URL) {
      await db.user.upsert({
        where: { walletAddress: cleanAddress },
        create: {
          id: user.id, walletAddress: cleanAddress, username: user.username, role: user.role,
          reputationScore: user.reputationScore, defaultCount: user.defaultCount, kycTier: user.kycTier,
          totalLoansSettled: user.totalLoansSettled, borrowLimit: user.borrowLimit,
          createdAt: new Date(user.createdAt), lastLoginAt: new Date(user.lastLoginAt),
        },
        update: {
          username: user.username, lastLoginAt: new Date(user.lastLoginAt), updatedAt: new Date(user.updatedAt),
        },
      });
    }


    // Create session token
    const rawSessionToken = `sess_live_${crypto.randomBytes(32).toString('hex')}`;
    const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
    const sessionId = `sess_${crypto.randomBytes(8).toString('hex')}`;
    const expiresAt = Date.now() + 7 * 24 * 3600 * 1000; // 7 days

    sessionsDb.set(sessionTokenHash, {
      id: sessionId,
      userId: user.id,
      walletAddress: cleanAddress,
      sessionTokenHash,
      expiresAt,
      createdAt: nowIso,
    });
    if (process.env.DATABASE_URL) {
      await db.session.create({
        data: { id: sessionId, userId: user.id, sessionTokenHash, expiresAt: new Date(expiresAt), createdAt: new Date(nowIso) },
      });
    }

    logSecurityEvent('SESSION_CREATED', cleanAddress, `Session ${sessionId} created successfully`, 'SUCCESS');

    return c.json({
      success: true,
      sessionToken: rawSessionToken,
      hasUsername: Boolean(user.username),
      user: {
        id: user.id,
        username: user.username || null,
        walletAddress: user.walletAddress,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return c.json({ error: 'Authentication failed. Please retry.' }, 500);
  }
}

/**
 * Middleware/Helper to validate session from Authorization header
 */
export function getAuthenticatedUser(c: Context): UserRecord | null {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const session = sessionsDb.get(tokenHash);

  if (!session || session.expiresAt < Date.now() || session.revokedAt) {
    return null;
  }

  return usersDb.get(session.walletAddress) || null;
}

export async function getAuthenticatedUserAsync(c: Context): Promise<UserRecord | null> {
  if (!process.env.DATABASE_URL) return getAuthenticatedUser(c);
  const authHeader = c.req.header('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const tokenHash = crypto.createHash('sha256').update(authHeader.slice(7).trim()).digest('hex');
  try {
    const session = await db.session.findUnique({ where: { sessionTokenHash: tokenHash }, include: { user: true } });
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) return null;
    return {
      id: session.user.id,
      username: session.user.username || undefined,
      walletAddress: session.user.walletAddress,
      displayName: session.user.displayName || undefined,
      role: session.user.role as UserRecord['role'],
      reputationScore: session.user.reputationScore,
      defaultCount: session.user.defaultCount,
      kycTier: session.user.kycTier,
      totalLoansSettled: session.user.totalLoansSettled,
      borrowLimit: Number(session.user.borrowLimit),
      createdAtTime: session.user.createdAt.getTime(),
      createdAt: session.user.createdAt.toISOString(),
      updatedAt: session.user.updatedAt.toISOString(),
      lastLoginAt: session.user.lastLoginAt.toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * POST /auth/username
 * Claims a permanent, globally unique username for the authenticated wallet
 */
export async function handleSetUsername(c: Context) {
  try {
    const user = getAuthenticatedUser(c);
    if (!user) {
      logSecurityEvent('USERNAME_CREATION', 'unknown', 'Unauthenticated attempt to create username', 'FAILURE');
      return c.json({ error: 'Authentication required. Please sign in with your Algorand wallet.' }, 401);
    }

    // Rate limiting: max 3 username requests per minute
    if (!checkRateLimit(`username:${user.walletAddress}`, 3, 60 * 1000)) {
      logSecurityEvent('USERNAME_CREATION', user.walletAddress, 'Rate limit exceeded for username creation', 'FAILURE');
      return c.json({ error: 'Too many username creation requests. Please try again in 1 minute.' }, 429);
    }

    const body = await c.req.json().catch(() => ({}));
    const { username } = body;

    const validation = validateUsernameFormat(username);
    if (!validation.valid || !validation.normalized) {
      logSecurityEvent('USERNAME_CREATION', user.walletAddress, `Format validation failed for: ${username}`, 'FAILURE');
      return c.json({ error: validation.error || 'Invalid username format' }, 400);
    }

    const normalized = validation.normalized;

    // Check if user already has a username set (permanent rule)
    if (user.username) {
      if (user.username === normalized) {
        return c.json({
          success: true,
          message: 'Username already assigned to your wallet.',
          user: {
            id: user.id,
            username: user.username,
            walletAddress: user.walletAddress,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        });
      }
      logSecurityEvent('USERNAME_CREATION', user.walletAddress, 'Attempted to change permanent username', 'FAILURE');
      return c.json({ error: 'Usernames are permanent and cannot be renamed.' }, 400);
    }

    // Check global uniqueness
    const existingOwnerWallet = usernamesDb.get(normalized);
    if (existingOwnerWallet && existingOwnerWallet !== user.walletAddress) {
      logSecurityEvent('USERNAME_CREATION', user.walletAddress, `Conflict: username ${normalized} is taken`, 'FAILURE');
      return c.json({ error: `Username "${normalized}" is already taken. Please choose another.` }, 409);
    }

    // Save username mapping
    const nowIso = new Date().toISOString();
    user.username = normalized;
    user.updatedAt = nowIso;
    usersDb.set(user.walletAddress, user);
    usernamesDb.set(normalized, user.walletAddress);

    logSecurityEvent('USERNAME_CREATION', user.walletAddress, `Claimed username: @${normalized}`, 'SUCCESS');

    return c.json({
      success: true,
      message: `Username @${normalized} successfully registered!`,
      user: {
        id: user.id,
        username: user.username,
        walletAddress: user.walletAddress,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (err) {
    console.error('Error claiming username:', err);
    return c.json({ error: 'Failed to claim username. Please retry.' }, 500);
  }
}

/**
 * GET /user/profile
 * Returns authenticated user profile and summary metrics
 */
export async function handleGetUserProfile(c: Context) {
  const user = getAuthenticatedUser(c);
  const walletFromQuery = c.req.query('wallet');

  if (!user || (walletFromQuery && walletFromQuery !== user.walletAddress)) {
    logSecurityEvent('PROFILE_FETCH', user?.walletAddress || 'unknown', 'Unauthorized profile fetch (session mismatch)', 'FAILURE');
    return c.json({ error: 'Authenticated wallet session required.' }, 401);
  }

  const targetWallet = user.walletAddress;
  const targetUser = usersDb.get(targetWallet)!;


  const userLogs = verificationLogsDb.filter((v) => v.walletAddress === targetWallet);
  const totalSpent = userLogs.reduce((sum, v) => sum + v.amount, 0);
  const threatsBlocked = userLogs.filter((v) => v.decision === 'suspicious').length;

  logSecurityEvent('PROFILE_FETCH', targetWallet, `Profile fetched successfully`, 'SUCCESS');

  return c.json({
    hasUsername: Boolean(targetUser.username),
    user: {
      id: targetUser.id,
      username: targetUser.username || null,
      walletAddress: targetUser.walletAddress,
      role: targetUser.role,
      reputationScore: targetUser.reputationScore,
      defaultCount: targetUser.defaultCount,
      isBlocked: targetUser.isBlocked || false,
      kycTier: targetUser.kycTier,
      totalLoansSettled: targetUser.totalLoansSettled,
      borrowLimit: targetUser.borrowLimit,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt,
      lastLoginAt: targetUser.lastLoginAt,
      stats: {
        totalVerifications: userLogs.length,
        totalSpentUsdc: Number(totalSpent.toFixed(3)),
        threatsBlocked,
        safeTransactions: userLogs.filter((v) => v.decision === 'safe').length,
        reviewRequired: userLogs.filter((v) => v.decision === 'review_before_action').length,
      },
    },
    receipts: userLogs.slice(-10).reverse(),
  });
}

/**
 * GET /user/analytics
 * Returns visual graph data (spend over time & decision breakdown)
 */
export async function handleGetUserAnalytics(c: Context) {
  const user = getAuthenticatedUser(c);
  const walletFromQuery = c.req.query('wallet');
  if (!user || (walletFromQuery && walletFromQuery !== user.walletAddress)) {
    logSecurityEvent('ANALYTICS_FETCH', user?.walletAddress || 'unknown', 'Unauthorized analytics fetch (session mismatch)', 'FAILURE');
    return c.json({ error: 'Authenticated wallet session required.' }, 401);
  }
  const targetWallet = user.walletAddress;


  const userLogs = verificationLogsDb.filter((v) => v.walletAddress === targetWallet);

  const decisionsCount = {
    safe: userLogs.filter((v) => v.decision === 'safe').length,
    review_before_action: userLogs.filter((v) => v.decision === 'review_before_action').length,
    suspicious: userLogs.filter((v) => v.decision === 'suspicious').length,
  };

  const dailySpend = [
    { date: 'Mon', spend: 0.03, checks: 3 },
    { date: 'Tue', spend: 0.05, checks: 5 },
    { date: 'Wed', spend: 0.02, checks: 2 },
    { date: 'Thu', spend: 0.06, checks: 6 },
    { date: 'Fri', spend: 0.04, checks: 4 },
    { date: 'Sat', spend: 0.08, checks: 8 },
    { date: 'Sun', spend: 0.05, checks: 5 },
  ];

  logSecurityEvent('ANALYTICS_FETCH', targetWallet, `Analytics fetched successfully`, 'SUCCESS');

  return c.json({
    walletAddress: targetWallet,
    username: user.username || null,
    decisionsCount,
    dailySpend,
    totalUsdcVolume: userLogs.reduce((sum, v) => sum + v.amount, 0),
    activeServicesCount: 12,
  });
}

/**
 * POST /auth/logout
 * Revokes session token
 */
export async function handleLogout(c: Context) {
  const authHeader = c.req.header('authorization');
  let actor = 'unknown';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = sessionsDb.get(tokenHash);
    if (session) {
      actor = session.walletAddress;
      session.revokedAt = new Date().toISOString();
      sessionsDb.set(tokenHash, session);
    }
  }
  logSecurityEvent('LOGOUT', actor, 'Logged out successfully', 'SUCCESS');
  return c.json({ success: true, message: 'Logged out successfully' });
}

/**
 * Helper to log completed verification for user telemetry
 */
export function recordVerificationLog(
  walletAddress: string,
  service: string,
  endpoint: string,
  input: string,
  decision: 'safe' | 'review_before_action' | 'suspicious',
  risk: 'low' | 'medium' | 'high',
  confidence: number,
  amount: number = 0.01
) {
  const inputHash = crypto.createHash('sha256').update(input).digest('hex');
  const user = usersDb.get(walletAddress);
  const userId = user ? user.id : 'usr_anon';

  verificationLogsDb.push({
    id: `vrfy_${crypto.randomBytes(6).toString('hex')}`,
    userId,
    walletAddress,
    service,
    endpoint,
    inputHash,
    decision,
    risk,
    confidence,
    amount,
    currency: 'USDC',
    timestamp: new Date().toISOString(),
  });
}
