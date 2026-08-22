import type { Context } from 'hono';
import { createHash } from 'crypto';
import { getAuthenticatedUser } from './auth';

// ════════════════════════════════════════════════════════════════════
// TYPES & DATA INTERFACES
// ════════════════════════════════════════════════════════════════════

export interface P2PAgentIdentity {
  agentId: string;
  ownerWalletAddress: string;
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
    lenderWallet: string;
    guarantorWallet?: string;
  };
  signatures: {
    borrowerSignature: string;
    lenderSignature: string;
    guarantorSignature?: string;
  };
  escrow?: {
    escrowVaultAddress: string;
    fundedAmountUsdc: number;
    serviceProviderWallet?: string;
    serviceDelivered: boolean;
    serviceDeliveryProof?: string;
  };
  onChainTxHash?: string;
  state: 'DRAFT' | 'ACTIVE' | 'DUE_SOON' | 'GRACE_PERIOD' | 'RENEGOTIATION_PENDING' | 'DEFAULTED' | 'RESOLVED';
  createdAt: string;
}

export interface RepaymentRecord {
  repaymentId: string;
  contractId: string;
  payerWallet: string;
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
  recipientWallet: string;
  encryptedContent: string;
  signature: string;
  timestamp: string;
}

// ════════════════════════════════════════════════════════════════════
// IN-MEMORY STORAGE & SEED DATA
// ════════════════════════════════════════════════════════════════════

const agentsDb: Map<string, P2PAgentIdentity> = new Map([
  [
    '0x3F8A9B21C4E7F0D1A3B5C7D9E1F3A5B7C9D1E3F5',
    {
      agentId: 'agent-alpha-001',
      ownerWalletAddress: '0x3F8A9B21C4E7F0D1A3B5C7D9E1F3A5B7C9D1E3F5',
      publicKey: 'ed25519_pk_alpha_001',
      role: 'BORROWER',
      borrowerScore: 745,
      lenderScore: 600,
      walletAgeDays: 240,
      totalLoansSettled: 14,
      totalLoansDefaulted: 0,
      registeredAt: '2026-01-15T08:00:00.000Z',
    },
  ],
  [
    '0x9E1F3A5B7C9D1E3F50x3F8A9B21C4E7F0D1A3B5',
    {
      agentId: 'agent-lender-vault-99',
      ownerWalletAddress: '0x9E1F3A5B7C9D1E3F50x3F8A9B21C4E7F0D1A3B5',
      publicKey: 'ed25519_pk_lender_99',
      role: 'LENDER',
      borrowerScore: 650,
      lenderScore: 810,
      walletAgeDays: 520,
      totalLoansSettled: 89,
      totalLoansDefaulted: 2,
      registeredAt: '2025-09-01T10:00:00.000Z',
    },
  ],
]);

const requestsDb: Map<string, CreditRequest> = new Map([
  [
    'req-p2p-101',
    {
      requestId: 'req-p2p-101',
      borrowerAgentId: 'agent-alpha-001',
      borrowerWallet: '0x3F8A9B21C4E7F0D1A3B5C7D9E1F3A5B7C9D1E3F5',
      requestedPrincipalUsdc: 25.0,
      maxInterestRateBps: 400, // 4.0%
      maxDurationSeconds: 604800, // 7 days
      purposeCategory: 'X402_API_DRAW',
      serviceEndpoint: 'https://api.agentbond.io/verify-task',
      guarantorRequired: false,
      collateralOfferedUsdc: 0,
      status: 'OPEN',
      borrowerSignature: 'sig_b_req_101_ed25519_proof_valid',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    },
  ],
]);

const offersDb: Map<string, LoanOffer> = new Map();
const contractsDb: Map<string, HybridContract> = new Map();
const repaymentsDb: Map<string, RepaymentRecord> = new Map();
const disputesDb: Map<string, DisputeRecord> = new Map();
const chatMessagesDb: Map<string, ChatMessage[]> = new Map();

// ════════════════════════════════════════════════════════════════════
// SCORING & EXPOSURE CAP MATH UTILITIES
// ════════════════════════════════════════════════════════════════════

export function calculateBorrowerTrustScore(params: {
  repaymentRatio: number; // 0 to 1
  walletAgeDays: number;  // 0 to 365+
  guarantorRatio: number; // 0 to 1
  collateralRatio: number;// 0 to 1
  debtRatio: number;      // 0 to 1
}): number {
  const rSettle = Math.min(Math.max(params.repaymentRatio, 0), 1);
  const mWallet = Math.min(params.walletAgeDays / 365, 1);
  const gBacking = Math.min(Math.max(params.guarantorRatio, 0), 1);
  const cCoverage = Math.min(Math.max(params.collateralRatio, 0), 1);
  const dRatio = Math.min(Math.max(params.debtRatio, 0), 1);

  const weightedFactor =
    0.35 * rSettle +
    0.20 * mWallet +
    0.20 * gBacking +
    0.15 * cCoverage -
    0.10 * dRatio;

  const score = Math.round(300 + 550 * Math.max(weightedFactor, 0));
  return Math.min(Math.max(score, 300), 850);
}

export function calculateMaxUncollateralizedCredit(borrowerScore: number): number {
  const normalized = Math.max((borrowerScore - 300) / 550, 0);
  return Number((100 * Math.pow(normalized, 2)).toFixed(2));
}

export function generateCanonicalContractHash(terms: HybridContract['terms'], parties: HybridContract['parties']): string {
  const canonicalString = JSON.stringify({
    terms,
    parties,
  });
  return createHash('sha256').update(canonicalString).digest('hex');
}

// ════════════════════════════════════════════════════════════════════
// HANDLER CONTROLLERS
// ════════════════════════════════════════════════════════════════════

/**
 * POST /api/v2/p2p/requests
 * Borrower posts a signed credit request
 */
export async function handleCreateCreditRequest(c: Context) {
  try {
    const user = getAuthenticatedUser(c);
    if (!user) return c.json({ error: 'Sign in with your wallet before posting a credit request.' }, 401);

    const body = await c.req.json();
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
      return c.json({ error: 'requestedPrincipalUsdc is required' }, 400);
    }

    const borrowerWallet = user.walletAddress;
    const authenticatedSignature = borrowerSignature || `session:${user.id}`;

    // Get or register agent profile
    let agent = agentsDb.get(borrowerWallet);
    if (!agent) {
      agent = {
        agentId: `agent-${borrowerWallet.substring(0, 8)}`,
        ownerWalletAddress: borrowerWallet,
        publicKey: `pk_${borrowerWallet.substring(0, 10)}`,
        role: 'BORROWER',
        borrowerScore: 600,
        lenderScore: 500,
        walletAgeDays: 30,
        totalLoansSettled: 0,
        totalLoansDefaulted: 0,
        registeredAt: new Date().toISOString(),
      };
      agentsDb.set(borrowerWallet, agent);
    }

    // Evaluate Exposure Caps
    const maxCreditAllowed = calculateMaxUncollateralizedCredit(agent.borrowerScore);
    if (requestedPrincipalUsdc > maxCreditAllowed + (collateralOfferedUsdc || 0)) {
      return c.json(
        {
          error: 'Requested amount exceeds borrower credit exposure cap',
          borrowerScore: agent.borrowerScore,
          maxUncollateralizedLimitUsdc: maxCreditAllowed,
          requestedPrincipalUsdc,
        },
        422
      );
    }

    const requestId = `req-p2p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newRequest: CreditRequest = {
      requestId,
      borrowerAgentId: agent.agentId,
      borrowerWallet,
      requestedPrincipalUsdc: Number(requestedPrincipalUsdc),
      maxInterestRateBps: maxInterestRateBps || 500,
      maxDurationSeconds: maxDurationSeconds || 604800,
      purposeCategory: purposeCategory || 'X402_API_DRAW',
      serviceEndpoint,
      guarantorRequired: !!guarantorRequired,
      collateralOfferedUsdc: Number(collateralOfferedUsdc || 0),
      status: 'OPEN',
      borrowerSignature: authenticatedSignature,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    };

    requestsDb.set(requestId, newRequest);

    return c.json(
      {
        message: 'Credit request created successfully',
        request: newRequest,
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
 * Browse open credit requests
 */
export async function handleGetCreditRequests(c: Context) {
  const status = c.req.query('status') || 'OPEN';
  const category = c.req.query('category');

  let list = Array.from(requestsDb.values());
  if (status !== 'ALL') {
    list = list.filter((r) => r.status === status);
  }
  if (category) {
    list = list.filter((r) => r.purposeCategory === category);
  }

  return c.json({
    total: list.length,
    requests: list,
  });
}

/**
 * POST /api/v2/p2p/offers
 * Lender submits a loan offer
 */
export async function handleCreateLoanOffer(c: Context) {
  try {
    const body = await c.req.json();
    const {
      requestId,
      lenderWallet,
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

    if (!requestId || !lenderWallet || !offeredPrincipalUsdc || !lenderSignature) {
      return c.json({ error: 'Missing required fields: requestId, lenderWallet, offeredPrincipalUsdc, lenderSignature' }, 400);
    }

    const request = requestsDb.get(requestId);
    if (!request) {
      return c.json({ error: 'Credit request not found' }, 404);
    }

    const offerId = `offer-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newOffer: LoanOffer = {
      offerId,
      requestId,
      lenderAgentId: `lender-${lenderWallet.substring(0, 8)}`,
      lenderWallet,
      offeredPrincipalUsdc: Number(offeredPrincipalUsdc),
      interestRateBps: interestRateBps || request.maxInterestRateBps,
      durationSeconds: durationSeconds || request.maxDurationSeconds,
      gracePeriodSeconds: gracePeriodSeconds || 172800, // 48h default
      renegotiationWindowSeconds: renegotiationWindowSeconds || 86400, // 24h default
      collateralRequiredUsdc: Number(collateralRequiredUsdc || 0),
      guarantorRequired: !!guarantorRequired,
      escrowRequired: !!escrowRequired,
      status: 'PENDING',
      lenderSignature,
      createdAt: new Date().toISOString(),
    };

    offersDb.set(offerId, newOffer);
    request.status = 'NEGOTIATING';
    requestsDb.set(requestId, request);

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
 * List offers for a request or lender
 */
export async function handleGetLoanOffers(c: Context) {
  const requestId = c.req.query('requestId');
  const lenderWallet = c.req.query('lenderWallet');

  let list = Array.from(offersDb.values());
  if (requestId) {
    list = list.filter((o) => o.requestId === requestId);
  }
  if (lenderWallet) {
    list = list.filter((o) => o.lenderWallet === lenderWallet);
  }

  return c.json({
    total: list.length,
    offers: list,
  });
}

/**
 * POST /api/v2/p2p/contracts/assemble
 * Assemble canonical contract terms & SHA-256 hash
 */
export async function handleAssembleContract(c: Context) {
  try {
    const body = await c.req.json();
    const { offerId, borrowerWallet, guarantorWallet } = body;

    const offer = offersDb.get(offerId);
    if (!offer) {
      return c.json({ error: 'Offer not found' }, 404);
    }

    const principal = offer.offeredPrincipalUsdc;
    const interestUsdc = Number((principal * (offer.interestRateBps / 10000)).toFixed(4));
    const totalRepayment = Number((principal + interestUsdc).toFixed(4));

    const startDate = new Date();
    const dueDate = new Date(startDate.getTime() + offer.durationSeconds * 1000);
    const gracePeriodEndDate = new Date(dueDate.getTime() + offer.gracePeriodSeconds * 1000);

    const terms: HybridContract['terms'] = {
      principalUsdc: principal,
      interestRateBps: offer.interestRateBps,
      interestUsdc,
      totalRepaymentUsdc: totalRepayment,
      durationSeconds: offer.durationSeconds,
      gracePeriodSeconds: offer.gracePeriodSeconds,
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
      gracePeriodEndDate: gracePeriodEndDate.toISOString(),
      defaultRule: guarantorWallet ? 'GUARANTOR_CLAIM' : offer.collateralRequiredUsdc > 0 ? 'COLLATERAL_SEIZURE' : 'REPUTATION_PENALTY',
      privacyLevel: 'COUNTERPARTY_ONLY',
    };

    const parties: HybridContract['parties'] = {
      borrowerWallet,
      lenderWallet: offer.lenderWallet,
      guarantorWallet,
    };

    const canonicalHash = generateCanonicalContractHash(terms, parties);
    const contractId = `contract-${Date.now()}`;

    const newContract: HybridContract = {
      contractId,
      requestId: offer.requestId,
      offerId,
      contractVersion: 1,
      canonicalHash,
      terms,
      parties,
      signatures: {
        borrowerSignature: '',
        lenderSignature: offer.lenderSignature,
      },
      escrow: offer.escrowRequired
        ? {
            escrowVaultAddress: `escrow_vault_${contractId.substring(9)}`,
            fundedAmountUsdc: 0,
            serviceDelivered: false,
          }
        : undefined,
      state: 'DRAFT',
      createdAt: new Date().toISOString(),
    };

    contractsDb.set(contractId, newContract);

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
    const body = await c.req.json();
    const { contractId, walletAddress, role, signature } = body;

    const contract = contractsDb.get(contractId);
    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
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
      contract.state = 'ACTIVE';
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
    const body = await c.req.json();
    const { contractId, payerWallet, amountPaidUsdc, onChainTxHash } = body;

    const contract = contractsDb.get(contractId);
    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    const repaymentId = `repay-${Date.now()}`;
    const totalOwed = contract.terms.totalRepaymentUsdc;
    const remaining = Math.max(totalOwed - amountPaidUsdc, 0);

    const record: RepaymentRecord = {
      repaymentId,
      contractId,
      payerWallet,
      amountPaidUsdc: Number(amountPaidUsdc),
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
    const body = await c.req.json();
    const { threadId, senderWallet, recipientWallet, encryptedContent, signature } = body;

    const messageId = `msg-${Date.now()}`;
    const newMsg: ChatMessage = {
      messageId,
      threadId,
      senderWallet,
      recipientWallet,
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
  const threadId = c.req.param('threadId') || '';
  const thread = chatMessagesDb.get(threadId) || [];
  return c.json({ threadId, total: thread.length, messages: thread });
}
