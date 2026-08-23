import type { Context } from 'hono';
import { createHash } from 'crypto';
import algosdk from 'algosdk';
import { getAuthenticatedUserAsync, resolveUsernameByWallet, usersDb, blacklistedWallets, logSecurityEvent, checkRateLimit } from './auth';

// ════════════════════════════════════════════════════════════════════
// TYPES & DATA INTERFACES
// ════════════════════════════════════════════════════════════════════

export interface P2PAgentIdentity {
  agentId: string;
  ownerWalletAddress: string;
  username?: string;
  publicKey: string;
  role: 'BORROWER' | 'LENDER' | 'GUARANTOR' | 'MULTI';
  borrowerScore: number; // 300 - 850
  lenderScore: number;   // 300 - 850
  walletAgeDays: number;
  totalLoansSettled: number;
  totalLoansDefaulted: number;
  registeredAt: string;
}

export interface CreditRequest {
  requestId: string;
  borrowerAgentId: string;
  borrowerWallet: string;
  borrowerUsername?: string;
  requestedPrincipalUsdc: number;
  maxInterestRateBps: number; // e.g. 500 = 5.0%
  maxDurationSeconds: number;
  purposeCategory: 'X402_API_DRAW' | 'COMPUTE_PROVISION' | 'GENERAL_LIQUIDITY';
  serviceEndpoint?: string;
  guarantorRequired: boolean;
  collateralOfferedUsdc: number;
  status: 'OPEN' | 'NEGOTIATING' | 'MATCHED' | 'EXPIRED' | 'CANCELLED';
  borrowerSignature: string;
  createdAt: string;
  expiresAt: string;
}

export interface LoanOffer {
  offerId: string;
  requestId: string;
  lenderAgentId: string;
  lenderWallet: string;
  lenderUsername?: string;
  offeredPrincipalUsdc: number;
  interestRateBps: number;
  durationSeconds: number;
  gracePeriodSeconds: number;
  renegotiationWindowSeconds: number;
  collateralRequiredUsdc: number;
  guarantorRequired: boolean;
  escrowRequired: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED';
  lenderSignature: string;
  createdAt: string;
}

export interface HybridContract {
  contractId: string;
  requestId: string;
  offerId: string;
  contractVersion: number;
  canonicalHash: string; // SHA-256 hash of canonical terms JSON
  terms: {
    principalUsdc: number;
    interestRateBps: number;
    interestUsdc: number;
    totalRepaymentUsdc: number;
    durationSeconds: number;
    gracePeriodSeconds: number;
    startDate: string;
    dueDate: string;
    gracePeriodEndDate: string;
    defaultRule: 'REPUTATION_PENALTY' | 'GUARANTOR_CLAIM' | 'COLLATERAL_SEIZURE' | 'LEGAL_EXPORT';
    privacyLevel: 'PUBLIC' | 'COUNTERPARTY_ONLY' | 'ENCRYPTED_PLATFORM';
  };
  parties: {
    borrowerWallet: string;
    borrowerUsername?: string;
    lenderWallet: string;
    lenderUsername?: string;
    guarantorWallet?: string;
    guarantorUsername?: string;
  };
  signatures: {
    borrowerSignature: string;
    borrowerSignedAt?: string;
    lenderSignature: string;
    lenderSignedAt?: string;
    guarantorSignature?: string;
    guarantorSignedAt?: string;
  };
  escrow?: {
    escrowVaultAddress: string;
    fundedAmountUsdc: number;
    serviceProviderWallet?: string;
    serviceDelivered: boolean;
    serviceDeliveryProof?: string;
  };
  onChainTxHash?: string;
  fundingTransactionId?: string;
  repaymentTransactionIds?: string[];
  statusHistory?: string[];
  state:
    | 'DRAFT'
    | 'Awaiting Borrower Signature'
    | 'Awaiting Lender Signature'
    | 'Ready for Lender Funding'
    | 'Funding Verification Pending'
    | 'Active'
    | 'Payment Due'
    | 'Overdue'
    | 'Defaulted'
    | 'Repaid'
    | 'RESOLVED';
  createdAt: string;
}

export interface RepaymentRecord {
  repaymentId: string;
  contractId: string;
  payerWallet: string;
  payerUsername?: string;
  amountPaidUsdc: number;
  paymentType: 'FULL' | 'PARTIAL' | 'GRACE_PERIOD' | 'RENEGOTIATED';
  onChainTxHash: string;
  remainingBalanceUsdc: number;
  timestamp: string;
}

export interface DisputeRecord {
  disputeId: string;
  contractId: string;
  initiatedByWallet: string;
  reason: 'NON_REPAYMENT' | 'SERVICE_NOT_DELIVERED' | 'UNFAIR_TERMS_BREACH';
  evidenceHashes: string[];
  status: 'OPEN' | 'IN_MEDIATION' | 'RESOLVED_LENDER_FAVOR' | 'RESOLVED_BORROWER_FAVOR';
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ChatMessage {
  messageId: string;
  threadId: string;
  senderWallet: string;
  senderUsername?: string;
  recipientWallet: string;
  recipientUsername?: string;
  encryptedContent: string;
  signature: string;
  timestamp: string;
}

// ════════════════════════════════════════════════════════════════════
// IN-MEMORY STORAGE & SEED DATA
// ════════════════════════════════════════════════════════════════════

const agentsDb: Map<string, P2PAgentIdentity> = new Map();
export const requestsDb: Map<string, CreditRequest> = new Map();

export const offersDb: Map<string, LoanOffer> = new Map();
export const contractsDb: Map<string, HybridContract> = new Map();
export const repaymentsDb: Map<string, RepaymentRecord> = new Map();
export const disputesDb: Map<string, DisputeRecord> = new Map();
export const chatMessagesDb: Map<string, ChatMessage[]> = new Map();
export const verifiedTxIds = new Set<string>();

export interface EscrowRecord {
  contractId: string;
  collateralAsset: string;
  collateralAmount: number;
  status: 'LOCKED' | 'RELEASED' | 'LIQUIDATED';
  lockedAt?: string;
  releasedAt?: string;
  liquidatedAt?: string;
}
export const escrowDb = new Map<string, EscrowRecord>();

/**
 * Periodically evaluate contract dates to transition status to OVERDUE or DEFAULTED
 */
export function evaluateContractsState() {
  const now = new Date();
  for (const [contractId, contract] of contractsDb.entries()) {
    if (contract.state === 'Active') {
      const dueDate = new Date(contract.terms.dueDate);
      if (now > dueDate) {
        contract.state = 'Overdue';
        if (!contract.statusHistory) contract.statusHistory = [];
        contract.statusHistory.push(`Transitioned to Overdue at ${now.toISOString()}`);
        contractsDb.set(contractId, contract);
        logSecurityEvent('CONTRACT_STATE_TRANSITION', contract.parties.borrowerWallet, `Contract ${contractId} transitioned to OVERDUE`, 'SUCCESS');
      }
    }
    
    if (contract.state === 'Overdue') {
      const graceDate = new Date(contract.terms.gracePeriodEndDate);
      if (now > graceDate) {
        contract.state = 'Defaulted';
        if (!contract.statusHistory) contract.statusHistory = [];
        contract.statusHistory.push(`Transitioned to Defaulted at ${now.toISOString()}`);
        contractsDb.set(contractId, contract);
        logSecurityEvent('CONTRACT_STATE_TRANSITION', contract.parties.borrowerWallet, `Contract ${contractId} transitioned to DEFAULTED`, 'SUCCESS');

        // Blacklist wallet immediately to prevent repeat account abuse
        blacklistedWallets.add(contract.parties.borrowerWallet);
        logSecurityEvent('WALLET_BLACKLISTED', contract.parties.borrowerWallet, `Wallet blacklisted due to default on contract ${contractId}`, 'SUCCESS');

        // Escrow collateral liquidation
        const escrow = escrowDb.get(contractId);
        if (escrow && escrow.status === 'LOCKED') {
          escrow.status = 'LIQUIDATED';
          escrow.liquidatedAt = now.toISOString();
          escrowDb.set(contractId, escrow);
          logSecurityEvent('ESCROW_LIQUIDATED', contract.parties.borrowerWallet, `Collateral of $${escrow.collateralAmount} USDC liquidated for contract ${contractId}`, 'SUCCESS');
        }
        
        // Update borrower's agent trust score
        const borrower = agentsDb.get(contract.parties.borrowerWallet);
        if (borrower) {
          borrower.totalLoansDefaulted += 1;
          borrower.borrowerScore = calculateBorrowerTrustScore({
            repaymentRatio: borrower.totalLoansSettled / (borrower.totalLoansSettled + borrower.totalLoansDefaulted),
            walletAgeDays: borrower.walletAgeDays,
            guarantorRatio: contract.parties.guarantorWallet ? 1 : 0,
            collateralRatio: 0,
            debtRatio: 0.8,
          });
          agentsDb.set(contract.parties.borrowerWallet, borrower);
        }
        
        // Update user record to blocked state
        const user = usersDb.get(contract.parties.borrowerWallet);
        if (user) {
          user.defaultCount += 1;
          user.reputationScore = Math.max(300, user.reputationScore - 150);
          user.isBlocked = true;
          usersDb.set(contract.parties.borrowerWallet, user);
        }
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// SCORING & EXPOSURE CAP MATH UTILITIES
// ════════════════════════════════════════════════════════════════════

export function calculateBorrowerTrustScore(params: {
  repaymentRatio: number; // 0.0 - 1.0 (settled / total)
  walletAgeDays: number;
  guarantorRatio: number;
  collateralRatio: number;
  debtRatio: number;
}): number {
  const { repaymentRatio, walletAgeDays, guarantorRatio, collateralRatio, debtRatio } = params;

  let score = 300;
  score += repaymentRatio * 250;
  score += Math.min(walletAgeDays / 365, 1.0) * 100;
  score += Math.min(guarantorRatio, 1.0) * 80;
  score += Math.min(collateralRatio, 1.0) * 70;
  score -= Math.min(debtRatio, 1.0) * 50;

  return Math.round(Math.min(Math.max(score, 300), 850));
}

export function calculateExposureCapUsdc(borrowerScore: number, collateralUsdc: number): number {
  let baseCap = 0;
  if (borrowerScore >= 780) baseCap = 2.5;
  else if (borrowerScore >= 720) baseCap = 1.5;
  else if (borrowerScore >= 660) baseCap = 1;
  else if (borrowerScore >= 580) baseCap = 0.5;
  else baseCap = 0.25;

  return baseCap + collateralUsdc * 0.8;
}

export function generateCanonicalHash(terms: HybridContract['terms']): string {
  const canonicalString = JSON.stringify(terms, Object.keys(terms).sort());
  return createHash('sha256').update(canonicalString).digest('hex');
}

function verifyWalletSignature(message: string, signature: unknown, walletAddress: string): boolean {
  if (typeof signature !== 'string' || !algosdk.isValidAddress(walletAddress)) return false;
  try {
    const bytes = new Uint8Array(Buffer.from(signature, signature.includes('=') ? 'base64' : 'hex'));
    return (algosdk as any).verifyBytes(new Uint8Array(Buffer.from(message, 'utf8')), bytes, walletAddress);
  } catch {
    return false;
  }
}

// ════════════════════════════════════════════════════════════════════
// API ROUTE HANDLERS
// ════════════════════════════════════════════════════════════════════

/**
 * POST /api/v2/p2p/requests
 * Create a new credit request
 */
export async function handleCreateCreditRequest(c: Context) {
  try {
    const authUser = await getAuthenticatedUserAsync(c);
    if (!authUser) {
      logSecurityEvent('CREDIT_REQUEST_CREATION', 'unknown', 'Attempted credit request without authenticated session', 'FAILURE');
      return c.json({ error: 'Authentication required. Please sign in with your Algorand wallet.' }, 401);
    }

    const borrowerWallet = authUser.walletAddress;

    // Rate Limiting: max 3 requests per minute
    if (!checkRateLimit(`credit-request:${borrowerWallet}`, 3, 60 * 1000)) {
      logSecurityEvent('CREDIT_REQUEST_CREATION', borrowerWallet, 'Rate limit exceeded for request creation', 'FAILURE');
      return c.json({ error: 'Too many requests. Please try again in 1 minute.' }, 429);
    }

    // Blacklist check
    if (blacklistedWallets.has(borrowerWallet)) {
      logSecurityEvent('CREDIT_REQUEST_CREATION', borrowerWallet, 'Attempt by blacklisted wallet rejected', 'FAILURE');
      return c.json({ error: 'This wallet is blacklisted from borrowing due to past defaults.' }, 403);
    }

    // Blocked check
    if (authUser.isBlocked || authUser.defaultCount > 0) {
      logSecurityEvent('CREDIT_REQUEST_CREATION', borrowerWallet, 'Attempt by blocked/defaulted user rejected', 'FAILURE');
      return c.json({ error: 'Borrower is blocked from creating new credit requests due to outstanding defaulted loans.' }, 403);
    }

    const body = await c.req.json().catch(() => ({}));
    const {
      requestedPrincipalUsdc,
      maxInterestRateBps,
      maxDurationSeconds,
      purposeCategory,
      serviceEndpoint,
      guarantorRequired,
      collateralOfferedUsdc,
      borrowerSignature,
    } = body;

    if (!requestedPrincipalUsdc) {
      logSecurityEvent('CREDIT_REQUEST_CREATION', borrowerWallet, 'Missing requestedPrincipalUsdc parameter', 'FAILURE');
      return c.json({ error: 'requestedPrincipalUsdc is required' }, 400);
    }

    // Limit Check: Only one active loan per borrower initially
    const activeContracts = Array.from(contractsDb.values()).filter(
      (ctr) =>
        ctr.parties.borrowerWallet === borrowerWallet &&
        ctr.state !== 'Repaid' &&
        ctr.state !== 'RESOLVED'
    );
    if (activeContracts.length > 0) {
      logSecurityEvent('CREDIT_REQUEST_CREATION', borrowerWallet, 'Attempted to exceed maximum limit of one active loan', 'FAILURE');
      return c.json({ error: 'You are restricted to only one active contract at a time.' }, 400);
    }

    // KYC Tier Cap Check: KYC Tier 0 (unverified) capped at $0.25 USDC for TestNet demos
    const principalNum = Number(requestedPrincipalUsdc);
    if (authUser.kycTier === 0 && principalNum > 0.25) {
      logSecurityEvent('CREDIT_REQUEST_CREATION', borrowerWallet, `Rejected principal $${principalNum} USDC: exceeds $0.25 limit for unverified Tier 0 accounts`, 'FAILURE');
      return c.json({ error: 'Unverified TestNet accounts are capped at a maximum of $0.25 USDC principal.' }, 400);
    }

    // Cooling period check: new accounts (less than 1 minute old in test / 1 hour in prod) must offer collateral
    const accountAgeMs = Date.now() - (authUser.createdAtTime || 0);
    const collateralNum = Number(collateralOfferedUsdc || 0);
    if (accountAgeMs < 1000 * 60 && collateralNum === 0) {
      logSecurityEvent('CREDIT_REQUEST_CREATION', borrowerWallet, 'Rejected unsecured request: brand new accounts require collateral', 'FAILURE');
      return c.json({ error: 'New accounts require collateral before unsecured borrowing is permitted.' }, 400);
    }

    let agent = agentsDb.get(borrowerWallet);
    if (!agent) {
      agent = {
        agentId: `agent-${borrowerWallet.substring(0, 8)}`,
        ownerWalletAddress: borrowerWallet,
        username: resolveUsernameByWallet(borrowerWallet),
        publicKey: `pk_${borrowerWallet.substring(0, 10)}`,
        role: 'BORROWER',
        borrowerScore: authUser.reputationScore || 650,
        lenderScore: 600,
        walletAgeDays: 30,
        totalLoansSettled: authUser.totalLoansSettled || 0,
        totalLoansDefaulted: authUser.defaultCount || 0,
        registeredAt: authUser.createdAt || new Date().toISOString(),
      };
      agentsDb.set(borrowerWallet, agent);
    }

    const maxCreditAllowed = calculateExposureCapUsdc(agent.borrowerScore, collateralNum);
    if (principalNum > maxCreditAllowed) {
      logSecurityEvent('CREDIT_REQUEST_CREATION', borrowerWallet, `Requested principal exceeds limit cap ($${maxCreditAllowed})`, 'FAILURE');
      return c.json(
        {
          error: `Requested principal ($${principalNum}) exceeds agent exposure limit ($${maxCreditAllowed}) based on trust score (${agent.borrowerScore})`,
        },
        400
      );
    }

    const signatureMessage = [
      'AgentBond credit request', borrowerWallet, principalNum, maxInterestRateBps || 500,
      maxDurationSeconds || 604800, purposeCategory || 'X402_API_DRAW', collateralNum,
    ].join('|');
    if (!verifyWalletSignature(signatureMessage, borrowerSignature, borrowerWallet)) {
      return c.json({ error: 'A valid borrower wallet signature is required for this credit request.' }, 401);
    }
    const authenticatedSignature = borrowerSignature;

    const requestId = `req-p2p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const borrowerUsername = resolveUsernameByWallet(borrowerWallet);
    const newRequest: CreditRequest = {
      requestId,
      borrowerAgentId: agent.agentId,
      borrowerWallet,
      borrowerUsername,
      requestedPrincipalUsdc: principalNum,
      maxInterestRateBps: maxInterestRateBps || 500,
      maxDurationSeconds: maxDurationSeconds || 604800,
      purposeCategory: purposeCategory || 'X402_API_DRAW',
      serviceEndpoint,
      guarantorRequired: !!guarantorRequired,
      collateralOfferedUsdc: collateralNum,
      status: 'OPEN',
      borrowerSignature: authenticatedSignature,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    };

    requestsDb.set(requestId, newRequest);
    logSecurityEvent('CREDIT_REQUEST_CREATION', borrowerWallet, `Created credit request ${requestId} for $${principalNum} USDC`, 'SUCCESS');

    return c.json(
      {
        message: 'Credit request created successfully',
        request: newRequest,
        signatureMessage,
        borrowerExposureLimitUsdc: maxCreditAllowed,
      },
      201
    );
  } catch (err: any) {
    return c.json({ error: 'Failed to create credit request', details: err.message }, 500);
  }
}

/**
 * GET /api/v2/p2p/requests
 * Browse open credit requests with resolved usernames
 */
export async function handleGetCreditRequests(c: Context) {
  evaluateContractsState();
  const status = c.req.query('status') || 'OPEN';
  const category = c.req.query('category');

  let list = Array.from(requestsDb.values());
  if (status !== 'ALL') {
    list = list.filter((r) => r.status === status);
  }
  if (category) {
    list = list.filter((r) => r.purposeCategory === category);
  }

  // Resolve borrower usernames dynamically
  const resolvedList = list.map(({ borrowerWallet, ...r }) => ({
    ...r,
    borrowerUsername: resolveUsernameByWallet(borrowerWallet),
  }));

  return c.json({
    total: resolvedList.length,
    requests: resolvedList,
  });
}

/**
 * POST /api/v2/p2p/offers
 * Lender submits a loan offer
 */
export async function handleCreateLoanOffer(c: Context) {
  try {
    const authUser = await getAuthenticatedUserAsync(c);
    if (!authUser) {
      logSecurityEvent('LOAN_OFFER_CREATION', 'unknown', 'Attempted loan offer without authenticated session', 'FAILURE');
      return c.json({ error: 'Authentication required. Please sign in with your Algorand wallet.' }, 401);
    }

    const lenderWallet = authUser.walletAddress;

    // Rate Limiting: max 5 requests per minute
    if (!checkRateLimit(`loan-offer:${lenderWallet}`, 5, 60 * 1000)) {
      logSecurityEvent('LOAN_OFFER_CREATION', lenderWallet, 'Rate limit exceeded for loan offer creation', 'FAILURE');
      return c.json({ error: 'Too many requests. Please try again in 1 minute.' }, 429);
    }

    const body = await c.req.json().catch(() => ({}));
    const {
      requestId,
      offeredPrincipalUsdc,
      interestRateBps,
      durationSeconds,
      gracePeriodSeconds,
      renegotiationWindowSeconds,
      collateralRequiredUsdc,
      guarantorRequired,
      escrowRequired,
      lenderSignature,
    } = body;

    if (!requestId || !offeredPrincipalUsdc) {
      logSecurityEvent('LOAN_OFFER_CREATION', lenderWallet, 'Missing required fields: requestId, offeredPrincipalUsdc', 'FAILURE');
      return c.json({ error: 'Missing required fields: requestId, offeredPrincipalUsdc' }, 400);
    }

    const request = requestsDb.get(requestId);
    if (!request) {
      logSecurityEvent('LOAN_OFFER_CREATION', lenderWallet, `Target credit request ${requestId} not found`, 'FAILURE');
      return c.json({ error: 'Credit request not found' }, 404);
    }

    // Prevent Self-Funding / Self-Offers
    if (request.borrowerWallet === lenderWallet) {
      logSecurityEvent('LOAN_OFFER_CREATION', lenderWallet, `Rejected self-offer on request ${requestId}`, 'FAILURE');
      return c.json({ error: 'Borrowers cannot submit loan offers to their own requests.' }, 400);
    }

    const offerSignatureMessage = [
      'AgentBond loan offer', lenderWallet, requestId, Number(offeredPrincipalUsdc),
      interestRateBps || request.maxInterestRateBps, durationSeconds || request.maxDurationSeconds,
    ].join('|');
    if (!verifyWalletSignature(offerSignatureMessage, lenderSignature, lenderWallet)) {
      return c.json({ error: 'A valid lender wallet signature is required for this offer.' }, 401);
    }

    const offerId = `offer-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const lenderUsername = resolveUsernameByWallet(lenderWallet);
    const newOffer: LoanOffer = {
      offerId,
      requestId,
      lenderAgentId: `lender-${lenderWallet.substring(0, 8)}`,
      lenderWallet,
      lenderUsername,
      offeredPrincipalUsdc: Number(offeredPrincipalUsdc),
      interestRateBps: interestRateBps || request.maxInterestRateBps,
      durationSeconds: durationSeconds || request.maxDurationSeconds,
      gracePeriodSeconds: gracePeriodSeconds || 172800, // 48h default
      renegotiationWindowSeconds: renegotiationWindowSeconds || 86400, // 24h default
      collateralRequiredUsdc: Number(collateralRequiredUsdc || 0),
      guarantorRequired: !!guarantorRequired,
      escrowRequired: !!escrowRequired,
      status: 'PENDING',
      lenderSignature: lenderSignature || `sig_lender_${Date.now()}_valid`,
      createdAt: new Date().toISOString(),
    };

    offersDb.set(offerId, newOffer);
    request.status = 'NEGOTIATING';
    requestsDb.set(requestId, request);

    logSecurityEvent('LOAN_OFFER_CREATION', lenderWallet, `Created loan offer ${offerId} for request ${requestId}`, 'SUCCESS');

    return c.json(
      {
        message: 'Loan offer created successfully',
        offer: newOffer,
      },
      201
    );
  } catch (err: any) {
    return c.json({ error: 'Failed to submit loan offer', details: err.message }, 500);
  }
}

/**
 * GET /api/v2/p2p/offers
 * List offers for a request or lender with resolved usernames
 */
export async function handleGetLoanOffers(c: Context) {
  const authUser = await getAuthenticatedUserAsync(c);
  if (!authUser) return c.json({ error: 'Authentication required' }, 401);
  const requestId = c.req.query('requestId');
  const lenderWallet = c.req.query('lenderWallet');

  let list = Array.from(offersDb.values());
  if (requestId) {
    list = list.filter((o) => o.requestId === requestId);
  }
  if (lenderWallet) {
    list = list.filter((o) => o.lenderWallet === lenderWallet);
  }
  list = list.filter((offer) => {
    const request = requestsDb.get(offer.requestId);
    return offer.lenderWallet === authUser.walletAddress || request?.borrowerWallet === authUser.walletAddress;
  });

  const resolvedList = list.map((o) => ({
    ...o,
    lenderUsername: resolveUsernameByWallet(o.lenderWallet),
  }));

  return c.json({
    total: resolvedList.length,
    offers: resolvedList,
  });
}

/**
 * POST /api/v2/p2p/contracts/assemble
 * Assemble canonical contract terms & SHA-256 hash
 */
export async function handleAssembleContract(c: Context) {
  try {
    const authUser = await getAuthenticatedUserAsync(c);
    if (!authUser) {
      logSecurityEvent('CONTRACT_ASSEMBLED', 'unknown', 'Attempted contract assembly without authenticated session', 'FAILURE');
      return c.json({ error: 'Authentication required. Please sign in with your Algorand wallet.' }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const { offerId, guarantorWallet } = body;

    const offer = offersDb.get(offerId);
    if (!offer) {
      logSecurityEvent('CONTRACT_ASSEMBLED', authUser.walletAddress, `Target loan offer ${offerId} not found`, 'FAILURE');
      return c.json({ error: 'Offer not found' }, 404);
    }

    const request = requestsDb.get(offer.requestId);
    if (!request) {
      logSecurityEvent('CONTRACT_ASSEMBLED', authUser.walletAddress, `Target request ${offer.requestId} not found`, 'FAILURE');
      return c.json({ error: 'Request not found' }, 404);
    }

    const borrowerWallet = request.borrowerWallet;
    // Verify session user is either borrower or lender; borrower identity comes from the request.
    if (authUser.walletAddress !== borrowerWallet && authUser.walletAddress !== offer.lenderWallet) {
      logSecurityEvent('CONTRACT_ASSEMBLED', authUser.walletAddress, `Unauthorized assembly attempt by third-party wallet`, 'FAILURE');
      return c.json({ error: 'Only participants of the transaction can assemble the contract.' }, 403);
    }

    const contractId = `contract-${Date.now()}`;
    const principal = offer.offeredPrincipalUsdc;
    const interest = Number(((principal * offer.interestRateBps) / 10000).toFixed(4));
    const totalRepay = Number((principal + interest).toFixed(4));

    const startDate = new Date().toISOString();
    const dueDate = new Date(Date.now() + offer.durationSeconds * 1000).toISOString();
    const gracePeriodEndDate = new Date(
      Date.now() + (offer.durationSeconds + offer.gracePeriodSeconds) * 1000
    ).toISOString();

    const collateralRequired = offer.collateralRequiredUsdc || request.collateralOfferedUsdc || 0;

    const terms: HybridContract['terms'] = {
      principalUsdc: principal,
      interestRateBps: offer.interestRateBps,
      interestUsdc: interest,
      totalRepaymentUsdc: totalRepay,
      durationSeconds: offer.durationSeconds,
      gracePeriodSeconds: offer.gracePeriodSeconds,
      startDate,
      dueDate,
      gracePeriodEndDate,
      defaultRule: collateralRequired > 0 ? 'COLLATERAL_SEIZURE' : 'REPUTATION_PENALTY',
      privacyLevel: 'PUBLIC',
    };

    const canonicalHash = generateCanonicalHash(terms);

    const borrowerUsername = resolveUsernameByWallet(borrowerWallet);
    const lenderUsername = resolveUsernameByWallet(offer.lenderWallet);
    const guarantorUsername = guarantorWallet ? resolveUsernameByWallet(guarantorWallet) : undefined;

    const newContract: HybridContract = {
      contractId,
      requestId: request.requestId,
      offerId: offer.offerId,
      contractVersion: 1,
      canonicalHash,
      terms,
      parties: {
        borrowerWallet,
        borrowerUsername,
        lenderWallet: offer.lenderWallet,
        lenderUsername,
        guarantorWallet,
        guarantorUsername,
      },
      signatures: {
        borrowerSignature: '',
        lenderSignature: offer.lenderSignature,
      },
      escrow: (offer.escrowRequired || collateralRequired > 0)
        ? {
            escrowVaultAddress: `escrow_vault_${contractId.substring(9)}`,
            fundedAmountUsdc: 0,
            serviceDelivered: false,
          }
        : undefined,
      state: 'Awaiting Borrower Signature',
      createdAt: new Date().toISOString(),
    };

    // If collateral is required, lock it in the mock escrow database
    if (collateralRequired > 0) {
      escrowDb.set(contractId, {
        contractId,
        collateralAsset: 'USDC',
        collateralAmount: collateralRequired,
        status: 'LOCKED',
        lockedAt: new Date().toISOString(),
      });
      logSecurityEvent('ESCROW_LOCK', borrowerWallet, `Collateral of $${collateralRequired} USDC locked in escrow for contract ${contractId}`, 'SUCCESS');
    }

    contractsDb.set(contractId, newContract);

    logSecurityEvent('CONTRACT_ASSEMBLED', authUser.walletAddress, `Contract ${contractId} assembled with terms hash ${canonicalHash}`, 'SUCCESS');

    return c.json({
      message: 'Canonical hybrid contract assembled',
      contractId,
      canonicalHash,
      contract: newContract,
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to assemble contract', details: err.message }, 500);
  }
}

/**
 * POST /api/v2/p2p/contracts/sign
 * Co-sign contract and transition to ACTIVE
 */
export async function handleSignContract(c: Context) {
  try {
    const authUser = await getAuthenticatedUserAsync(c);
    if (!authUser) return c.json({ error: 'Authentication required' }, 401);
    const body = await c.req.json();
    const { contractId, role, signature } = body;

    const contract = contractsDb.get(contractId);
    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    if (!signature || !['BORROWER', 'LENDER', 'GUARANTOR'].includes(role)) {
      return c.json({ error: 'A valid role and wallet signature are required' }, 400);
    }
    const assignedWallet = role === 'BORROWER'
      ? contract.parties.borrowerWallet
      : role === 'LENDER'
        ? contract.parties.lenderWallet
        : contract.parties.guarantorWallet;
    if (!assignedWallet || authUser.walletAddress !== assignedWallet) {
      return c.json({ error: 'Only the assigned contract participant can sign' }, 403);
    }
    if (!verifyWalletSignature(contract.canonicalHash, signature, authUser.walletAddress)) {
      return c.json({ error: 'Contract signature does not match the authenticated wallet.' }, 401);
    }
    if (role === 'BORROWER') {
      contract.signatures.borrowerSignature = signature;
    } else if (role === 'LENDER') {
      contract.signatures.lenderSignature = signature;
    } else if (role === 'GUARANTOR') {
      contract.signatures.guarantorSignature = signature;
    }

    const hasBorrower = !!contract.signatures.borrowerSignature;
    const hasLender = !!contract.signatures.lenderSignature;
    const needsGuarantor = !!contract.parties.guarantorWallet;
    const hasGuarantor = !needsGuarantor || !!contract.signatures.guarantorSignature;

    if (hasBorrower && hasLender && hasGuarantor) {
      contract.state = 'Active';
      contract.onChainTxHash = `0x_commitment_algo_tx_${Date.now()}`;

      // Update offer and request state
      const offer = offersDb.get(contract.offerId);
      if (offer) offer.status = 'ACCEPTED';
      const request = requestsDb.get(contract.requestId);
      if (request) request.status = 'MATCHED';
    }

    contractsDb.set(contractId, contract);

    return c.json({
      message: 'Contract signature recorded',
      contractState: contract.state,
      contract,
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to sign contract', details: err.message }, 500);
  }
}

/**
 * POST /api/v2/p2p/repay
 * Settle loan obligation
 */
export async function handleRepayLoan(c: Context) {
  try {
    const authUser = await getAuthenticatedUserAsync(c);
    if (!authUser) return c.json({ error: 'Authentication required' }, 401);
    const body = await c.req.json();
    const { contractId, amountPaidUsdc, payerWallet, transactionId } = body;
    const onChainTxHash = body.onChainTxHash || transactionId;

    const contract = contractsDb.get(contractId);
    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }
    if (!payerWallet || !algosdk.isValidAddress(payerWallet)) {
      return c.json({ error: 'A valid payer wallet is required' }, 400);
    }
    const amount = Number(amountPaidUsdc);
    if (!Number.isFinite(amount) || amount <= 0 || !onChainTxHash) {
      return c.json({ error: 'A positive amount and confirmed transaction ID are required' }, 400);
    }
    if ([...repaymentsDb.values()].some((repayment) => repayment.onChainTxHash === onChainTxHash)) {
      return c.json({ error: 'This repayment transaction has already been used' }, 409);
    }

    const repaymentId = `repay-${Date.now()}`;
    const totalOwed = contract.terms.totalRepaymentUsdc;
    const remaining = Math.max(totalOwed - amount, 0);

    const record: RepaymentRecord = {
      repaymentId,
      contractId,
      payerWallet,
      payerUsername: resolveUsernameByWallet(payerWallet),
      amountPaidUsdc: amount,
      paymentType: remaining === 0 ? 'FULL' : 'PARTIAL',
      onChainTxHash: onChainTxHash || `tx_algo_repay_${Date.now()}`,
      remainingBalanceUsdc: remaining,
      timestamp: new Date().toISOString(),
    };

    repaymentsDb.set(repaymentId, record);

    if (remaining === 0) {
      contract.state = 'RESOLVED';
      contractsDb.set(contractId, contract);

      // Score Upgrade
      const borrower = agentsDb.get(contract.parties.borrowerWallet);
      if (borrower) {
        borrower.totalLoansSettled += 1;
        borrower.borrowerScore = calculateBorrowerTrustScore({
          repaymentRatio: borrower.totalLoansSettled / (borrower.totalLoansSettled + borrower.totalLoansDefaulted),
          walletAgeDays: borrower.walletAgeDays,
          guarantorRatio: contract.parties.guarantorWallet ? 1 : 0,
          collateralRatio: 0,
          debtRatio: 0.1,
        });
        agentsDb.set(borrower.ownerWalletAddress, borrower);
      }
    }

    return c.json({
      message: remaining === 0 ? 'Loan settled in full' : 'Partial repayment recorded',
      repaymentRecord: record,
      contractState: contract.state,
    });
  } catch (err: any) {
    return c.json({ error: 'Repayment failed', details: err.message }, 500);
  }
}

/**
 * POST /api/v2/p2p/chat/message
 * E2E Encrypted Chat message
 */
export async function handleSendChatMessage(c: Context) {
  try {
    const authUser = await getAuthenticatedUserAsync(c);
    if (!authUser) return c.json({ error: 'Authentication required' }, 401);
    const body = await c.req.json();
    const { threadId, recipientWallet, encryptedContent, signature } = body;
    const contract = contractsDb.get(threadId.replace(/^thread-/, ''));
    if (!contract) return c.json({ error: 'Contract thread not found' }, 404);
    if (authUser.walletAddress !== contract.parties.borrowerWallet && authUser.walletAddress !== contract.parties.lenderWallet) {
      return c.json({ error: 'Only contract participants can send messages' }, 403);
    }
    const expectedRecipient = authUser.walletAddress === contract.parties.borrowerWallet
      ? contract.parties.lenderWallet
      : contract.parties.borrowerWallet;
    if (recipientWallet !== expectedRecipient || !encryptedContent || !signature) {
      return c.json({ error: 'Recipient, encrypted content, and wallet signature are required' }, 400);
    }
    const senderWallet = authUser.walletAddress;

    const messageId = `msg-${Date.now()}`;
    const newMsg: ChatMessage = {
      messageId,
      threadId,
      senderWallet,
      senderUsername: resolveUsernameByWallet(senderWallet),
      recipientWallet,
      recipientUsername: resolveUsernameByWallet(recipientWallet),
      encryptedContent,
      signature: signature || 'sig_msg_valid',
      timestamp: new Date().toISOString(),
    };

    const thread = chatMessagesDb.get(threadId) || [];
    thread.push(newMsg);
    chatMessagesDb.set(threadId, thread);

    return c.json({ message: 'Encrypted message sent', chatMessage: newMsg });
  } catch (err: any) {
    return c.json({ error: 'Failed to send chat message', details: err.message }, 500);
  }
}

/**
 * GET /api/v2/p2p/chat/:threadId
 * Fetch thread messages
 */
export async function handleGetChatHistory(c: Context) {
  const authUser = await getAuthenticatedUserAsync(c);
  if (!authUser) return c.json({ error: 'Authentication required' }, 401);
  const threadId = c.req.param('threadId') || '';
  const contract = contractsDb.get(threadId.replace(/^thread-/, ''));
  if (!contract) return c.json({ error: 'Contract thread not found' }, 404);
  if (authUser.walletAddress !== contract.parties.borrowerWallet && authUser.walletAddress !== contract.parties.lenderWallet) {
    return c.json({ error: 'Only contract participants can read messages' }, 403);
  }
  const thread = chatMessagesDb.get(threadId) || [];
  const resolved = thread.map((m) => ({
    ...m,
    senderUsername: resolveUsernameByWallet(m.senderWallet),
    recipientUsername: resolveUsernameByWallet(m.recipientWallet),
  }));
  return c.json({ threadId, total: resolved.length, messages: resolved });
}

async function verifyAlgorandTransaction(
  txId: string,
  expectedSender: string,
  expectedReceiver: string,
  expectedAmount: number,
  expectedAssetId?: number
): Promise<{ success: boolean; error?: string }> {
  if (verifiedTxIds.has(txId)) {
    return { success: false, error: 'Transaction ID has already been used.' };
  }

  try {
    const url = `https://testnet-idx.algonode.cloud/v2/transactions/${txId}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { success: false, error: `Indexer could not verify transaction ${txId}.` };
    }
    const data = (await res.json()) as any;
    const tx = data.transaction;
    if (!tx) {
      return { success: false, error: 'Transaction not found on indexer.' };
    }

    const sender = tx.sender;
    if (sender !== expectedSender) {
      return { success: false, error: `Sender mismatch. Expected ${expectedSender}, got ${sender}.` };
    }

    if (expectedAssetId) {
      const axfer = tx['asset-transfer-transaction'];
      if (!axfer) {
        return { success: false, error: 'Transaction is not an asset transfer.' };
      }
      if (axfer['asset-id'] !== expectedAssetId) {
        return { success: false, error: `Asset ID mismatch. Expected ${expectedAssetId}, got ${axfer['asset-id']}.` };
      }
      if (axfer.receiver !== expectedReceiver) {
        return { success: false, error: `Receiver mismatch. Expected ${expectedReceiver}, got ${axfer.receiver}.` };
      }
      const assetTransfer = tx['asset-transfer-transaction'];
      if (!assetTransfer || assetTransfer.receiver !== expectedReceiver) {
        return { success: false, error: 'Asset transfer receiver mismatch.' };
      }
      const amount = assetTransfer.amount / 1000000;
      if (Math.abs(amount - expectedAmount) > 0.01) {
        return { success: false, error: `Amount mismatch. Expected ${expectedAmount}, got ${amount}.` };
      }
    } else {
      const payment = tx['payment-transaction'];
      if (!payment) {
        return { success: false, error: 'Transaction is not a payment transaction.' };
      }
      if (payment.receiver !== expectedReceiver) {
        return { success: false, error: `Receiver mismatch. Expected ${expectedReceiver}, got ${payment.receiver}.` };
      }
      const amount = payment.amount / 1000000;
      if (Math.abs(amount - expectedAmount) > 0.01) {
        return { success: false, error: `Amount mismatch. Expected ${expectedAmount}, got ${amount}.` };
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Unable to verify transaction on Algorand TestNet: ${err.message}` };
  }
}

export async function handleBorrowerSignContract(c: Context) {
  try {
    const authUser = await getAuthenticatedUserAsync(c);
    if (!authUser) {
      logSecurityEvent('CONTRACT_SIGNING', 'unknown', 'Attempted borrower sign without authenticated session', 'FAILURE');
      return c.json({ error: 'Authentication required' }, 401);
    }
    const contractId = c.req.param('id') || '';
    const contract = contractsDb.get(contractId);
    if (!contract) {
      logSecurityEvent('CONTRACT_SIGNING', authUser.walletAddress, `Borrower sign failed: contract ${contractId} not found`, 'FAILURE');
      return c.json({ error: 'Contract not found' }, 404);
    }
    if (authUser.walletAddress !== contract.parties.borrowerWallet) {
      logSecurityEvent('CONTRACT_SIGNING', authUser.walletAddress, `Unauthorized borrower signing attempt for contract ${contractId}`, 'FAILURE');
      return c.json({ error: 'Only the assigned borrower can sign this contract' }, 403);
    }
    const body = await c.req.json().catch(() => ({}));
    const { signature } = body;
    if (!signature) {
      logSecurityEvent('CONTRACT_SIGNING', authUser.walletAddress, 'Missing signature parameter', 'FAILURE');
      return c.json({ error: 'signature is required' }, 400);
    }

    contract.signatures.borrowerSignature = signature;
    contract.signatures.borrowerSignedAt = new Date().toISOString();
    
    // Determine next state
    if (contract.signatures.lenderSignature) {
      contract.state = 'Ready for Lender Funding';
    } else {
      contract.state = 'Awaiting Lender Signature';
    }
    if (!contract.statusHistory) contract.statusHistory = [];
    contract.statusHistory.push(`Borrower signed contract at ${contract.signatures.borrowerSignedAt}`);
    
    contractsDb.set(contractId, contract);
    logSecurityEvent('CONTRACT_SIGNING', authUser.walletAddress, `Borrower signed contract ${contractId}. State: ${contract.state}`, 'SUCCESS');
    return c.json({ success: true, contract });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
}

export async function handleLenderSignContract(c: Context) {
  try {
    const authUser = await getAuthenticatedUserAsync(c);
    if (!authUser) {
      logSecurityEvent('CONTRACT_SIGNING', 'unknown', 'Attempted lender sign without authenticated session', 'FAILURE');
      return c.json({ error: 'Authentication required' }, 401);
    }
    const contractId = c.req.param('id') || '';
    const contract = contractsDb.get(contractId);
    if (!contract) {
      logSecurityEvent('CONTRACT_SIGNING', authUser.walletAddress, `Lender sign failed: contract ${contractId} not found`, 'FAILURE');
      return c.json({ error: 'Contract not found' }, 404);
    }
    if (authUser.walletAddress !== contract.parties.lenderWallet) {
      logSecurityEvent('CONTRACT_SIGNING', authUser.walletAddress, `Unauthorized lender signing attempt for contract ${contractId}`, 'FAILURE');
      return c.json({ error: 'Only the assigned lender can sign this contract' }, 403);
    }
    const body = await c.req.json().catch(() => ({}));
    const { signature } = body;
    if (!signature) {
      logSecurityEvent('CONTRACT_SIGNING', authUser.walletAddress, 'Missing signature parameter', 'FAILURE');
      return c.json({ error: 'signature is required' }, 400);
    }

    contract.signatures.lenderSignature = signature;
    contract.signatures.lenderSignedAt = new Date().toISOString();
    
    // Determine next state
    if (contract.signatures.borrowerSignature) {
      contract.state = 'Ready for Lender Funding';
    } else {
      contract.state = 'Awaiting Borrower Signature';
    }
    if (!contract.statusHistory) contract.statusHistory = [];
    contract.statusHistory.push(`Lender signed contract at ${contract.signatures.lenderSignedAt}`);
    
    contractsDb.set(contractId, contract);
    logSecurityEvent('CONTRACT_SIGNING', authUser.walletAddress, `Lender signed contract ${contractId}. State: ${contract.state}`, 'SUCCESS');
    return c.json({ success: true, contract });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
}

export async function handleFundLoan(c: Context) {
  try {
    const authUser = await getAuthenticatedUserAsync(c);
    if (!authUser) {
      logSecurityEvent('FUND_VERIFICATION', 'unknown', 'Attempted funding without authenticated session', 'FAILURE');
      return c.json({ error: 'Authentication required' }, 401);
    }
    const contractId = c.req.param('id') || '';
    const contract = contractsDb.get(contractId);
    if (!contract) {
      logSecurityEvent('FUND_VERIFICATION', authUser.walletAddress, `Funding failed: contract ${contractId} not found`, 'FAILURE');
      return c.json({ error: 'Contract not found' }, 404);
    }

    // Rate Limiting: max 5 funding checks per minute
    if (!checkRateLimit(`fund-loan:${authUser.walletAddress}`, 5, 60 * 1000)) {
      logSecurityEvent('FUND_VERIFICATION', authUser.walletAddress, 'Rate limit exceeded for funding check', 'FAILURE');
      return c.json({ error: 'Too many attempts. Please try again in 1 minute.' }, 429);
    }

    // Check lender authorization (Section G)
    if (authUser.walletAddress !== contract.parties.lenderWallet) {
      logSecurityEvent('FUND_VERIFICATION', authUser.walletAddress, `Unauthorized funding attempt for contract ${contractId} (Assigned Lender: ${contract.parties.lenderWallet})`, 'FAILURE');
      return c.json({ error: 'Only the assigned lender can fund this loan' }, 403);
    }

    // Check if contract is already funded
    if (contract.state === 'Active' || contract.state === 'Repaid' || contract.state === 'RESOLVED') {
      logSecurityEvent('FUND_VERIFICATION', authUser.walletAddress, `Funding rejected: contract ${contractId} is already funded or resolved`, 'FAILURE');
      return c.json({ error: 'Contract is already funded or resolved' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const { fundingTransactionId } = body;
    if (!fundingTransactionId) {
      logSecurityEvent('FUND_VERIFICATION', authUser.walletAddress, 'Missing fundingTransactionId parameter', 'FAILURE');
      return c.json({ error: 'fundingTransactionId is required' }, 400);
    }

    // Prevent duplicate funding / replay attack (Section G.3)
    if (verifiedTxIds.has(fundingTransactionId)) {
      logSecurityEvent('FUND_VERIFICATION', authUser.walletAddress, `Reused transaction ID ${fundingTransactionId} submitted`, 'FAILURE');
      return c.json({ error: 'Transaction ID has already been recorded for another payment' }, 400);
    }

    // Verify signatures are present
    if (!contract.signatures.borrowerSignature || !contract.signatures.lenderSignature) {
      logSecurityEvent('FUND_VERIFICATION', authUser.walletAddress, `Funding rejected: missing borrower or lender signatures on contract ${contractId}`, 'FAILURE');
      return c.json({ error: 'Cannot fund contract until both parties sign' }, 400);
    }

    contract.state = 'Funding Verification Pending';

    // Verify blockchain transaction details (sender = lender, receiver = borrower, amount = principal, asset = USDC)
    const verification = await verifyAlgorandTransaction(
      fundingTransactionId,
      contract.parties.lenderWallet,
      contract.parties.borrowerWallet,
      contract.terms.principalUsdc,
      10458941 // TestNet USDC ASA ID
    );

    if (!verification.success) {
      contract.state = 'Ready for Lender Funding';
      contractsDb.set(contractId, contract);
      logSecurityEvent('FUND_VERIFICATION', authUser.walletAddress, `On-chain validation failed for tx ${fundingTransactionId}: ${verification.error}`, 'FAILURE');
      return c.json({ error: verification.error || 'Funding verification failed' }, 400);
    }

    contract.fundingTransactionId = fundingTransactionId;
    contract.state = 'Active';
    if (!contract.statusHistory) contract.statusHistory = [];
    contract.statusHistory.push(`Lender funded contract via tx ${fundingTransactionId} at ${new Date().toISOString()}`);
    verifiedTxIds.add(fundingTransactionId);

    // Update active request status to MATCHED
    const request = requestsDb.get(contract.requestId);
    if (request) request.status = 'MATCHED';

    contractsDb.set(contractId, contract);
    logSecurityEvent('FUND_VERIFICATION', authUser.walletAddress, `Funded contract ${contractId} via tx ${fundingTransactionId}`, 'SUCCESS');
    return c.json({ success: true, contract });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
}

export async function handleRepayContractLoan(c: Context) {
  try {
    const authUser = await getAuthenticatedUserAsync(c);
    if (!authUser) {
      logSecurityEvent('REPAYMENT_VERIFICATION', 'unknown', 'Attempted repayment without authenticated session', 'FAILURE');
      return c.json({ error: 'Authentication required' }, 401);
    }
    const contractId = c.req.param('id') || '';
    const contract = contractsDb.get(contractId);
    if (!contract) {
      logSecurityEvent('REPAYMENT_VERIFICATION', authUser.walletAddress, `Repayment failed: contract ${contractId} not found`, 'FAILURE');
      return c.json({ error: 'Contract not found' }, 404);
    }

    // Rate Limiting: max 5 attempts per minute
    if (!checkRateLimit(`repay-loan:${authUser.walletAddress}`, 5, 60 * 1000)) {
      logSecurityEvent('REPAYMENT_VERIFICATION', authUser.walletAddress, 'Rate limit exceeded for repayment check', 'FAILURE');
      return c.json({ error: 'Too many attempts. Please try again in 1 minute.' }, 429);
    }
    
    // Only borrower can repay
    if (authUser.walletAddress !== contract.parties.borrowerWallet) {
      logSecurityEvent('REPAYMENT_VERIFICATION', authUser.walletAddress, `Unauthorized repayment attempt for contract ${contractId}`, 'FAILURE');
      return c.json({ error: 'Only the borrower can repay this loan' }, 403);
    }

    const body = await c.req.json().catch(() => ({}));
    const { amount, transactionId } = body;
    if (!amount || !transactionId) {
      logSecurityEvent('REPAYMENT_VERIFICATION', authUser.walletAddress, 'Missing amount or transactionId parameters', 'FAILURE');
      return c.json({ error: 'amount and transactionId are required' }, 400);
    }

    // Prevent duplicate transaction IDs
    if (verifiedTxIds.has(transactionId)) {
      logSecurityEvent('REPAYMENT_VERIFICATION', authUser.walletAddress, `Reused transaction ID ${transactionId} submitted for repayment`, 'FAILURE');
      return c.json({ error: 'Transaction ID has already been recorded for another payment' }, 400);
    }

    // Verify blockchain transaction
    const verification = await verifyAlgorandTransaction(
      transactionId,
      contract.parties.borrowerWallet,
      contract.parties.lenderWallet,
      Number(amount),
      10458941 // TestNet USDC ASA ID
    );

    if (!verification.success) {
      logSecurityEvent('REPAYMENT_VERIFICATION', authUser.walletAddress, `On-chain validation failed for repayment tx ${transactionId}: ${verification.error}`, 'FAILURE');
      return c.json({ error: verification.error || 'Repayment verification failed' }, 400);
    }

    const repaymentId = `repay-${Date.now()}`;
    const totalOwed = contract.terms.totalRepaymentUsdc;
    
    // Compute total repaid so far
    let totalRepaidSoFar = 0;
    for (const repayment of repaymentsDb.values()) {
      if (repayment.contractId === contractId) {
        totalRepaidSoFar += repayment.amountPaidUsdc;
      }
    }
    const newlyRepaid = totalRepaidSoFar + Number(amount);
    const remaining = Math.max(totalOwed - newlyRepaid, 0);

    const record: RepaymentRecord = {
      repaymentId,
      contractId,
      payerWallet: contract.parties.borrowerWallet,
      payerUsername: contract.parties.borrowerUsername,
      amountPaidUsdc: Number(amount),
      paymentType: remaining === 0 ? 'FULL' : 'PARTIAL',
      onChainTxHash: transactionId,
      remainingBalanceUsdc: remaining,
      timestamp: new Date().toISOString(),
    };

    repaymentsDb.set(repaymentId, record);
    verifiedTxIds.add(transactionId);
    
    if (!contract.repaymentTransactionIds) contract.repaymentTransactionIds = [];
    contract.repaymentTransactionIds.push(transactionId);

    if (remaining === 0) {
      contract.state = 'Repaid';
      if (!contract.statusHistory) contract.statusHistory = [];
      contract.statusHistory.push(`Loan repaid in full via tx ${transactionId} at ${record.timestamp}`);
      contractsDb.set(contractId, contract);

      // Release Escrow Collateral
      const escrow = escrowDb.get(contractId);
      if (escrow && escrow.status === 'LOCKED') {
        escrow.status = 'RELEASED';
        escrow.releasedAt = record.timestamp;
        escrowDb.set(contractId, escrow);
        logSecurityEvent('ESCROW_RELEASE', contract.parties.borrowerWallet, `Collateral of $${escrow.collateralAmount} USDC released for contract ${contractId}`, 'SUCCESS');
      }

      // Upgrade trust score
      const borrower = agentsDb.get(contract.parties.borrowerWallet);
      if (borrower) {
        borrower.totalLoansSettled += 1;
        borrower.borrowerScore = calculateBorrowerTrustScore({
          repaymentRatio: borrower.totalLoansSettled / (borrower.totalLoansSettled + borrower.totalLoansDefaulted),
          walletAgeDays: borrower.walletAgeDays,
          guarantorRatio: contract.parties.guarantorWallet ? 1 : 0,
          collateralRatio: 0,
          debtRatio: 0.1,
        });
        agentsDb.set(borrower.ownerWalletAddress, borrower);
      }

      const userRecord = usersDb.get(contract.parties.borrowerWallet);
      if (userRecord) {
        userRecord.totalLoansSettled += 1;
        userRecord.reputationScore = Math.min(850, userRecord.reputationScore + 25);
        userRecord.borrowLimit = userRecord.borrowLimit + 20; // increase limit after confirmed repayment (Rule C)
        usersDb.set(contract.parties.borrowerWallet, userRecord);
      }
    } else {
      if (!contract.statusHistory) contract.statusHistory = [];
      contract.statusHistory.push(`Partial repayment of $${amount} recorded via tx ${transactionId}`);
    }

    contractsDb.set(contractId, contract);
    logSecurityEvent('REPAYMENT_VERIFICATION', authUser.walletAddress, `Repayment of $${amount} USDC recorded for contract ${contractId}`, 'SUCCESS');
    return c.json({ success: true, repaymentRecord: record, contractState: contract.state });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
}

export async function handleGetContractDetails(c: Context) {
  try {
    evaluateContractsState();
    const authUser = await getAuthenticatedUserAsync(c);
    if (!authUser) {
      logSecurityEvent('CONTRACT_FETCH', 'unknown', 'Attempted contract details fetch without session', 'FAILURE');
      return c.json({ error: 'Authentication required' }, 401);
    }
    const contractId = c.req.param('id') || '';
    const contract = contractsDb.get(contractId);
    if (!contract) {
      logSecurityEvent('CONTRACT_FETCH', authUser.walletAddress, `Fetch failed: contract ${contractId} not found`, 'FAILURE');
      return c.json({ error: 'Contract not found' }, 404);
    }

    // Only borrower or lender of the contract can view details
    if (
      authUser.walletAddress !== contract.parties.borrowerWallet &&
      authUser.walletAddress !== contract.parties.lenderWallet
    ) {
      logSecurityEvent('CONTRACT_FETCH', authUser.walletAddress, `Unauthorized details fetch attempt for contract ${contractId}`, 'FAILURE');
      return c.json({ error: 'Unauthorized to view contract details' }, 403);
    }

    logSecurityEvent('CONTRACT_FETCH', authUser.walletAddress, `Contract ${contractId} details fetched successfully`, 'SUCCESS');
    return c.json({ success: true, contract });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
}

export async function handleGetContractsList(c: Context) {
  try {
    evaluateContractsState();
    const authUser = await getAuthenticatedUserAsync(c);
    if (!authUser) {
      logSecurityEvent('CONTRACT_LIST_FETCH', 'unknown', 'Attempted contracts list fetch without session', 'FAILURE');
      return c.json({ error: 'Authentication required' }, 401);
    }
    const list = Array.from(contractsDb.values()).filter(
      (contract) =>
        contract.parties.borrowerWallet === authUser.walletAddress ||
        contract.parties.lenderWallet === authUser.walletAddress
    );
    logSecurityEvent('CONTRACT_LIST_FETCH', authUser.walletAddress, `Fetched ${list.length} contracts for user wallet`, 'SUCCESS');
    return c.json({ success: true, contracts: list });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
}
