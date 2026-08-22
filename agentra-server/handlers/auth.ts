/**
 * Agentra Wallet-First Authentication & User Profile Handler
 * 
 * Endpoints:
 * - POST /auth/nonce: Generate single-use cryptographic nonce
 * - POST /auth/login: Verify Ed25519 wallet signature and issue session token
 * - GET /user/profile: Get authenticated user profile & stats
 * - GET /user/analytics: Get spending time-series and decision distribution
 * - POST /auth/logout: Invalidate active session
 */

import type { Context } from 'hono';
import crypto from 'crypto';
import algosdk from 'algosdk';

// In-memory persistent datastores (backend enclave only)
interface UserRecord {
  id: string;
  walletAddress: string;
  displayName?: string;
  role: 'individual' | 'developer' | 'admin';
  createdAt: string;
  lastLoginAt: string;
}

interface NonceRecord {
  id: string;
  walletAddress: string;
  nonceHash: string;
  messageTemplate: string;
  expiresAt: number;
  usedAt?: number;
}

interface SessionRecord {
  id: string;
  userId: string;
  walletAddress: string;
  sessionTokenHash: string;
  expiresAt: number;
  createdAt: string;
  revokedAt?: string;
}

interface VerificationLog {
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
const usersDb = new Map<string, UserRecord>();
const noncesDb = new Map<string, NonceRecord>();
const sessionsDb = new Map<string, SessionRecord>();
const verificationLogsDb: VerificationLog[] = [];

// Seed sample initial telemetry if empty
function initializeSampleTelemetry(walletAddress: string, userId: string) {
  if (verificationLogsDb.filter((v) => v.walletAddress === walletAddress).length === 0) {
    const services = [
      { name: 'agentra.invoice', endpoint: '/verify-task', decision: 'suspicious', risk: 'high', conf: 0.91 },
      { name: 'agentra.email_phish', endpoint: '/verify-email', decision: 'safe', risk: 'low', conf: 0.94 },
      { name: 'agentra.policy', endpoint: '/verify-policy', decision: 'review_before_action', risk: 'medium', conf: 0.84 },
      { name: 'agentra.product', endpoint: '/verify-product', decision: 'suspicious', risk: 'high', conf: 0.93 },
      { name: 'agentra.prompt_guard', endpoint: '/guard-prompt', decision: 'safe', risk: 'low', conf: 0.96 },
    ];

    const now = Date.now();
    services.forEach((s, idx) => {
      verificationLogsDb.push({
        id: `vrfy_${crypto.randomBytes(6).toString('hex')}`,
        userId,
        walletAddress,
        service: s.name,
        endpoint: s.endpoint,
        inputHash: crypto.createHash('sha256').update(`sample-payload-${idx}`).digest('hex'),
        decision: s.decision as any,
        risk: s.risk as any,
        confidence: s.conf,
        amount: 0.01,
        currency: 'USDC',
        timestamp: new Date(now - (idx + 1) * 3600 * 1000 * 6).toISOString(),
      });
    });
  }
}

/**
 * POST /auth/nonce
 * Generates a 5-minute cryptographic nonce for the given wallet address
 */
export async function handleGetNonce(c: Context) {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.trim().length < 50) {
      return c.json({ error: 'Valid 58-character Algorand wallet address required' }, 400);
    }

    const cleanAddress = walletAddress.trim();
    const rawNonce = crypto.randomBytes(32).toString('hex');
    const nonceHash = crypto.createHash('sha256').update(rawNonce).digest('hex');
    const nonceId = `nonce_${crypto.randomBytes(8).toString('hex')}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    const messageTemplate = `Sign in to Agentra\n\nWallet: ${cleanAddress}\nNonce: ${rawNonce}\nIssued At: ${new Date().toISOString()}\nNetwork: Algorand TestNet\nPurpose: Authenticate wallet ownership for Agentra`;

    noncesDb.set(rawNonce, {
      id: nonceId,
      walletAddress: cleanAddress,
      nonceHash,
      messageTemplate,
      expiresAt,
    });

    console.log(`🔑 [Auth] Issued nonce for wallet ${cleanAddress.slice(0, 8)}...`);

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
      return c.json({ error: 'walletAddress, nonce, and signature are required' }, 400);
    }

    const cleanAddress = walletAddress.trim();
    const nonceRecord = noncesDb.get(nonce);

    if (!nonceRecord) {
      return c.json({ error: 'Invalid or unrecognized authentication nonce' }, 401);
    }

    if (nonceRecord.walletAddress !== cleanAddress) {
      return c.json({ error: 'Nonce does not match provided wallet address' }, 401);
    }

    if (nonceRecord.expiresAt < Date.now()) {
      noncesDb.delete(nonce);
      return c.json({ error: 'Authentication nonce has expired. Please request a new one.' }, 401);
    }

    if (nonceRecord.usedAt) {
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
      return c.json({ error: 'Cryptographic signature verification failed' }, 401);
    }

    // Mark nonce as used
    nonceRecord.usedAt = Date.now();

    // Find or create user
    let user = usersDb.get(cleanAddress);
    const nowIso = new Date().toISOString();

    if (!user) {
      user = {
        id: `usr_${crypto.randomBytes(8).toString('hex')}`,
        walletAddress: cleanAddress,
        role: 'individual',
        createdAt: nowIso,
        lastLoginAt: nowIso,
      };
      usersDb.set(cleanAddress, user);
      console.log(`👤 [Auth] Created new user profile for ${cleanAddress.slice(0, 8)}... (ID: ${user.id})`);
    } else {
      user.lastLoginAt = nowIso;
      usersDb.set(cleanAddress, user);
      console.log(`👤 [Auth] Logged in existing user ${user.id} (${cleanAddress.slice(0, 8)}...)`);
    }

    // Seed sample analytics history
    initializeSampleTelemetry(cleanAddress, user.id);

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

    return c.json({
      success: true,
      sessionToken: rawSessionToken,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
        createdAt: user.createdAt,
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

/**
 * GET /user/profile
 * Returns authenticated user profile and summary metrics
 */
export async function handleGetUserProfile(c: Context) {
  const user = getAuthenticatedUser(c);
  const walletFromQuery = c.req.query('wallet');

  if (!user || (walletFromQuery && walletFromQuery !== user.walletAddress)) {
    return c.json({ error: 'Authenticated wallet session required.' }, 401);
  }

  const targetWallet = user.walletAddress;
  const targetUser = usersDb.get(targetWallet)!;

  initializeSampleTelemetry(targetWallet, targetUser.id);

  const userLogs = verificationLogsDb.filter((v) => v.walletAddress === targetWallet);
  const totalSpent = userLogs.reduce((sum, v) => sum + v.amount, 0);
  const threatsBlocked = userLogs.filter((v) => v.decision === 'suspicious').length;

  return c.json({
    user: {
      id: targetUser.id,
      walletAddress: targetUser.walletAddress,
      role: targetUser.role,
      createdAt: targetUser.createdAt,
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
    return c.json({ error: 'Authenticated wallet session required.' }, 401);
  }
  const targetWallet = user.walletAddress;

  initializeSampleTelemetry(targetWallet, user?.id || 'usr_sample');

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

  return c.json({
    walletAddress: targetWallet,
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
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = sessionsDb.get(tokenHash);
    if (session) {
      session.revokedAt = new Date().toISOString();
      sessionsDb.set(tokenHash, session);
    }
  }
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
