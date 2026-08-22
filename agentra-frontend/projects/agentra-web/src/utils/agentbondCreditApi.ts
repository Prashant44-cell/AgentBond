/**
 * AgentBond Credit Protocol Client API
 * 
 * Machine-to-Machine Outcome-Backed Credit & Factoring for Autonomous AI Agents on Algorand
 */

export interface AgentCreditProfile {
  agentId: string;
  name: string;
  category: 'research' | 'coding' | 'data' | 'finance' | 'devops';
  walletAddress: string;
  sponsorAddress: string;
  sponsorStakeUsdc: number;
  runtimeVersion: string;
  createdAt: string;
  creditScore: number;
  riskTier: 'AAA' | 'AA' | 'A' | 'BBB' | 'Subprime';
  totalCreditLineUsdc: number;
  availableCreditUsdc: number;
  maxPerTaskDrawUsdc: number;
  interestRateBps: number;
  defaultProbability: number;
  metrics: {
    totalDrawsCount: number;
    totalBorrowedUsdc: number;
    totalRepaidUsdc: number;
    repaymentReliabilityRate: number;
    verifiedTaskQualityScore: number;
    identityContinuityMonths: number;
    policyComplianceRate: number;
    serviceDiversityCount: number;
    activeObligationsCount: number;
  };
  activeObligations: CreditObligation[];
}

export interface CreditObligation {
  obligationId: string;
  agentId: string;
  targetService: string;
  endpoint: string;
  amountUsdc: number;
  feeUsdc: number;
  totalOwedUsdc: number;
  clientReceivableUsdc?: number;
  netAgentPayoutUsdc?: number;
  drawnAt: string;
  dueDate: string;
  status: 'active' | 'repaid' | 'defaulted' | 'under_review';
  taskContext?: string;
  taskOutcome?: {
    submittedAt: string;
    artifactType: 'code' | 'research' | 'data' | 'policy';
    qualityScore: number;
    verificationStatus: 'verified_pass' | 'partial_pass' | 'failed';
    evidence: string[];
    deterministicChecks?: {
      testsPassed?: string;
      lintClean?: boolean;
      citationsVerified?: number;
      schemaValid?: boolean;
    };
  };
  repaidAt?: string;
  txHash?: string;
}

export interface LiquidityPoolStats {
  totalVaultLiquidityUsdc: number;
  activeCreditLinesUsdc: number;
  totalLoansDisbursedUsdc: number;
  totalInterestEarnedUsdc: number;
  defaultLossUsdc: number;
  currentNetApy: number;
  activeBorrowingAgentsCount: number;
  defaultRatePercent: number;
  lossAbsorptionHierarchy: {
    firstLossSponsorStakesUsdc: number;
    secondLossInsuranceReserveUsdc: number;
    thirdLossJuniorTrancheUsdc: number;
    seniorCapitalProtectedUsdc: number;
  };
  tranches: {
    seniorAaaCapitalUsdc: number;
    seniorApy: number;
    juniorYieldCapitalUsdc: number;
    juniorApy: number;
    insuranceReserveUsdc: number;
  };
}

export interface CreditBureauResponse {
  success: boolean;
  protocol: string;
  version: string;
  network: string;
  totalAgents: number;
  agents: AgentCreditProfile[];
  poolStats: LiquidityPoolStats;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021';

export async function fetchCreditBureau(): Promise<CreditBureauResponse> {
  const res = await fetch(`${API_BASE}/api/credit/bureau`);
  if (!res.ok) throw new Error('Failed to fetch AgentBond credit bureau data');
  return res.json();
}

export async function fetchAgentProfile(agentId: string): Promise<{ success: boolean; agent: AgentCreditProfile }> {
  const res = await fetch(`${API_BASE}/api/credit/agent/${encodeURIComponent(agentId)}`);
  if (!res.ok) throw new Error(`Failed to fetch profile for agent ${agentId}`);
  return res.json();
}

export async function registerAgent(payload: {
  name: string;
  category: string;
  walletAddress: string;
  sponsorAddress?: string;
  sponsorStakeUsdc?: string;
  runtimeVersion?: string;
}): Promise<{ success: boolean; agent: AgentCreditProfile; message: string }> {
  const res = await fetch(`${API_BASE}/api/credit/agents/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to register agent');
  }
  return res.json();
}

export async function drawCredit(payload: {
  agentId: string;
  targetService: string;
  endpoint: string;
  amountUsdc: string;
  clientReceivableUsdc?: string;
  taskContext?: string;
}): Promise<{
  success: boolean;
  message: string;
  obligation: CreditObligation;
  agentCreditStatus: {
    agentId: string;
    creditScore: number;
    riskTier: string;
    remainingAvailableCredit: number;
  };
}> {
  const res = await fetch(`${API_BASE}/api/credit/draw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Credit draw rejected by underwriting engine');
  }
  return res.json();
}

export async function verifyOutcome(payload: {
  obligationId: string;
  artifactType: 'code' | 'research' | 'data' | 'policy';
  artifactContent: string;
  testPassRate?: number;
  citationCount?: number;
}): Promise<{
  success: boolean;
  message: string;
  obligationId: string;
  taskOutcome: CreditObligation['taskOutcome'];
  updatedAgentQualityAverage: number;
}> {
  const res = await fetch(`${API_BASE}/api/credit/verify-outcome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Task outcome verification failed');
  }
  return res.json();
}

export async function repayCredit(payload: {
  obligationId: string;
  payerAddress?: string;
  txHash?: string;
}): Promise<{
  success: boolean;
  message: string;
  settlement: {
    obligationId: string;
    amountRepaidUsdc: number;
    clientReceivableUsdc?: number;
    netAgentProfitUsdc?: number;
    settledAt: string;
    txHash: string;
  };
  scoreEvolution: {
    previousScore: number;
    newCreditScore: number;
    scoreDelta: string;
    previousLimitUsdc: number;
    newTotalCreditLineUsdc: number;
    limitDelta: string;
    riskTier: string;
  };
  agent: AgentCreditProfile;
}> {
  const res = await fetch(`${API_BASE}/api/credit/repay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to settle credit obligation');
  }
  return res.json();
}

export async function fetchPoolStats(): Promise<{ success: boolean; pool: LiquidityPoolStats }> {
  const res = await fetch(`${API_BASE}/api/credit/pool`);
  if (!res.ok) throw new Error('Failed to fetch liquidity pool stats');
  return res.json();
}
