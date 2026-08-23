import React, { useState, useEffect } from 'react'
import {
  AuthUserProfile,
  VerificationReceipt,
  signInWithWallet,
  fetchProfileData,
  getStoredSessionToken,
  logoutFromWallet,
} from '../utils/auth'

interface AgentBondProfileProps {
  activeAddress: string | null
  walletSigner?: any
  userProfile?: AuthUserProfile | null
  onOpenWalletModal: () => void
  onOpenUsernameModal?: () => void
  onNavigateOverview?: () => void
  onAuthChange?: (authenticated: boolean) => void
}

export const AgentBondProfile: React.FC<AgentBondProfileProps> = ({
  activeAddress,
  walletSigner,
  userProfile: propUserProfile,
  onOpenWalletModal,
  onOpenUsernameModal,
  onAuthChange,
}) => {
  const [internalUserProfile, setInternalUserProfile] = useState<AuthUserProfile | null>(propUserProfile || null)
  const [receipts, setReceipts] = useState<VerificationReceipt[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(getStoredSessionToken())
  const [selectedReceipt, setSelectedReceipt] = useState<VerificationReceipt | null>(null)
  const [receiptFilter, setReceiptFilter] = useState<string>('all')
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [showFullWallet, setShowFullWallet] = useState<boolean>(false)
  const [dashboardTab, setDashboardTab] = useState<'p2p' | 'telemetry'>('p2p')
  
  // Funding/Repayment transaction IDs simulation state
  const [fundingTxId, setFundingTxId] = useState<string>('')
  const [repayAmount, setRepayAmount] = useState<string>('')
  const [repayTxId, setRepayTxId] = useState<string>('')
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const userProfile = propUserProfile || internalUserProfile
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const loadProfile = async () => {
    if (!activeAddress) return
    try {
      const data = await fetchProfileData(activeAddress)
      if (data.user) setInternalUserProfile(data.user)
      if (data.receipts) setReceipts(data.receipts)
    } catch (err) {
      console.warn('Profile fetch note:', (err as Error).message)
    }
  }

  const loadContracts = async () => {
    if (!sessionToken) return
    try {
      const res = await fetch(`${apiBaseUrl}/p2p/contracts`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setContracts(data.contracts || [])
        }
      }
    } catch (err) {
      console.warn('Contracts fetch note:', err)
    }
  }

  useEffect(() => {
    loadProfile()
    if (sessionToken) {
      loadContracts()
    }
  }, [activeAddress, sessionToken])

  const handleSIWA = async () => {
    if (!activeAddress || !walletSigner) {
      onOpenWalletModal()
      return
    }

    setIsAuthenticating(true)
    setAuthError(null)

    try {
      const authResult = await signInWithWallet(walletSigner)
      setSessionToken(authResult.sessionToken)
      setInternalUserProfile(authResult.user)
      onAuthChange?.(true)
      await loadProfile()
    } catch (err) {
      setAuthError((err as Error).message)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleSignOut = async () => {
    await logoutFromWallet()
    setSessionToken(null)
    setInternalUserProfile(null)
    setContracts([])
    onAuthChange?.(false)
  }

  // Contract actions (Sign, Fund, Repay)
  const handleSignContract = async (contractId: string) => {
    try {
      setActionMessage(null)
      setActionError(null)
      const res = await fetch(`${apiBaseUrl}/p2p/contracts/${contractId}/borrower-sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ signature: `sig_b_contract_${Date.now()}` }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to sign contract')
      
      setActionMessage('Contract signed successfully!')
      await loadContracts()
    } catch (err: any) {
      setActionError(err.message)
    }
  }

  const handleFundContract = async (contractId: string) => {
    if (!fundingTxId.trim()) {
      setActionError('Please provide a valid funding transaction ID.')
      return
    }
    try {
      setActionMessage(null)
      setActionError(null)
      const res = await fetch(`${apiBaseUrl}/p2p/contracts/${contractId}/fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ fundingTransactionId: fundingTxId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fund contract')

      setActionMessage('Contract funded! Status updated to Active.')
      setFundingTxId('')
      await loadContracts()
    } catch (err: any) {
      setActionError(err.message)
    }
  }

  const handleRepayContract = async (contractId: string, maxAmount: number) => {
    const amountNum = Number(repayAmount)
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > maxAmount) {
      setActionError(`Please enter a valid repayment amount between 0 and $${maxAmount}.`)
      return
    }
    if (!repayTxId.trim()) {
      setActionError('Please provide a repayment transaction ID.')
      return
    }
    try {
      setActionMessage(null)
      setActionError(null)
      const res = await fetch(`${apiBaseUrl}/p2p/contracts/${contractId}/repay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ amount: amountNum, transactionId: repayTxId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit repayment')

      setActionMessage(data.contractState === 'Repaid' ? 'Loan fully repaid!' : 'Repayment recorded successfully.');
      setRepayAmount('')
      setRepayTxId('')
      await loadContracts()
      await loadProfile()
    } catch (err: any) {
      setActionError(err.message)
    }
  }

  // Calculate dynamic P2P counters
  const totalBorrowed = contracts
    .filter((c) => c.parties.borrowerWallet === activeAddress && c.state !== 'Repaid' && c.state !== 'DRAFT')
    .reduce((sum, c) => sum + c.terms.principalUsdc, 0)

  const totalLent = contracts
    .filter((c) => c.parties.lenderWallet === activeAddress && c.state !== 'Repaid' && c.state !== 'DRAFT')
    .reduce((sum, c) => sum + c.terms.principalUsdc, 0)

  const outstandingDebt = contracts
    .filter((c) => c.parties.borrowerWallet === activeAddress && c.state !== 'Repaid' && c.state !== 'DRAFT')
    .reduce((sum, c) => sum + c.terms.totalRepaymentUsdc, 0)

  const activeLoansCount = contracts.filter(
    (c) =>
      (c.parties.borrowerWallet === activeAddress || c.parties.lenderWallet === activeAddress) &&
      (c.state === 'Active' || c.state === 'Overdue')
  ).length

  const reputationScore = userProfile?.reputationScore || 650
  const defaultCount = userProfile?.defaultCount || 0
  const successRate = defaultCount === 0 ? 100 : Math.round((receipts.length / (receipts.length + defaultCount)) * 100)

  // Color mappings for Trust Score
  const getScoreColor = (score: number) => {
    if (score >= 740) return 'text-[#10B981]' // Green
    if (score >= 660) return 'text-[#F59E0B]' // Yellow/Amber
    return 'text-[#EF4444]' // Red
  }

  return (
    <div className="w-full text-[#1B133C] font-['Inter',sans-serif] space-y-8 pb-20 max-w-7xl mx-auto px-4 pt-4">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* PAGE SCENARIO BANNER: OPERATOR IDENTITY */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#1B133C]/10 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] text-xs font-medium text-[#1B133C]">
            <div className="w-4 h-4 rounded-md bg-[#F97316] flex items-center justify-center text-white font-bold text-[10px]">
              A
            </div>
            <span>Fintech Credit Registry & P2P Portal</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>SIWA Identity & Ledger Verified</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl md:text-5xl font-normal text-[#1B133C] tracking-tight">
              Arjun Financial Credit Profile
            </h1>
            <p className="text-xs sm:text-sm text-[#1B133C]/70 max-w-2xl leading-relaxed">
              Verify your connected Algorand identity, audit outstanding debt obligations, and view reputation scoring metrics.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {sessionToken ? (
              <button
                onClick={handleSignOut}
                className="px-4 py-2.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] hover:bg-[#1B133C]/5 text-[#1B133C] text-xs font-semibold transition-all cursor-pointer"
              >
                Disconnect Session
              </button>
            ) : (
              <button
                onClick={handleSIWA}
                disabled={isAuthenticating}
                className="px-5 py-2.5 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Ed25519 Proof...</span>
                  </>
                ) : (
                  <span>Sign-In with Algorand (SIWA)</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Scenario Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#1B133C]/5 text-[11px] text-[#1B133C]/75">
          <span className="font-semibold text-[#1B133C]">Scenario Reference:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Bilateral Peer Funding</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Trust Score Calibration</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Decentralized Repayments</span>
        </div>
      </div>

      {authError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
          ❌ Authentication Error: {authError}
        </div>
      )}

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
          ✅ {actionMessage}
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
          ❌ Error: {actionError}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* IDENTITY PROFILE BENTO GRID */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeAddress ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: User Profile Summary */}
          <div className="p-6 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1B133C]/10 pb-3">
                <span className="text-xs font-mono text-[#F97316] uppercase font-semibold">Financial Identity</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#F5F5F5] border border-[#1B133C]/10 flex items-center justify-center text-3xl shadow-inner">
                  🤖
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-extrabold text-[#1B133C] tracking-tight">
                    {userProfile?.username ? `@${userProfile.username}` : '@unregistered'}
                  </div>
                  <div className="text-[11px] text-[#1B133C]/60 font-mono">
                    Member ID: {userProfile?.id?.slice(0, 12) || 'usr_demo_101'}
                  </div>
                </div>
              </div>

              {/* Wallet address display */}
              <div className="space-y-1.5 pt-2 font-mono text-xs">
                <div className="flex justify-between items-center text-[10px] text-[#1B133C]/60">
                  <span>CONNECTED WALLET</span>
                  <button
                    onClick={() => handleCopy(activeAddress)}
                    className="text-[#F97316] hover:underline"
                  >
                    {copiedText === activeAddress ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-3 rounded-2xl bg-[#F5F5F5] border border-[#1B133C]/10 text-[#1B133C] truncate">
                  {activeAddress}
                </div>
                <a
                  href={`https://lora.algokit.io/testnet/account/${activeAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F97316] hover:underline text-[11px] block text-right"
                >
                  View on Lora Explorer ↗
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1B133C]/5 grid grid-cols-2 gap-3 text-center text-xs font-mono">
              <div className="p-3 rounded-2xl border border-[#1B133C]/10 bg-[#F5F5F5]">
                <span className="text-[10px] uppercase block text-[#1B133C]/60">Role</span>
                <span className="text-xs font-bold text-[#1B133C] capitalize">
                  {userProfile?.role || 'Individual'}
                </span>
              </div>
              <div className="p-3 rounded-2xl border border-[#1B133C]/10 bg-[#F5F5F5]">
                <span className="text-[10px] uppercase block text-[#1B133C]/60">Registered</span>
                <span className="text-xs font-bold text-[#1B133C]">
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Jan 2026'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Trust & Reputation Score dial */}
          <div className="p-6 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#1B133C]/10 pb-3">
              <span className="text-xs font-mono text-[#F97316] uppercase font-semibold">Reputation & Risk</span>
              <span className="text-xs font-mono text-[#1B133C]/60">Trust Score Range: 300 - 850</span>
            </div>

            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              {/* Circular score dial visualizer */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#F5F5F5"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#F97316"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * (reputationScore - 300)) / 550}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className="text-3xl font-extrabold text-[#1B133C]">{reputationScore}</span>
                  <span className="text-[9px] uppercase tracking-wider text-[#1B133C]/60 font-semibold">
                    {reputationScore >= 740 ? 'Excellent' : reputationScore >= 660 ? 'Good' : 'Subprime'}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 pt-2 font-mono text-center">
                <div className="bg-[#F5F5F5] p-3 rounded-2xl border border-[#1B133C]/10">
                  <span className="text-[10px] text-[#1B133C]/60 block">REPAYMENT SUCCESS</span>
                  <span className="text-sm font-bold text-emerald-700">{successRate}%</span>
                </div>
                <div className="bg-[#F5F5F5] p-3 rounded-2xl border border-[#1B133C]/10">
                  <span className="text-[10px] text-[#1B133C]/60 block">DEFAULTS</span>
                  <span className="text-sm font-bold text-rose-600">{defaultCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Financial Balances Grid */}
          <div className="p-6 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#1B133C]/10 pb-3">
              <span className="text-xs font-mono text-[#F97316] uppercase font-semibold">Financial Positions</span>
              <span className="text-xs font-mono text-[#1B133C]/60">USDC Balances</span>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono">
              <div className="p-3 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-2xl space-y-1">
                <span className="text-[9px] uppercase text-[#1B133C]/60 block">Available Balance</span>
                <span className="text-base font-extrabold text-[#1B133C]">$245.80</span>
                <span className="text-[8px] text-[#1B133C]/50 block">Simulated Wallet</span>
              </div>
              <div className="p-3 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-2xl space-y-1">
                <span className="text-[9px] uppercase text-[#1B133C]/60 block">Active Loans Count</span>
                <span className="text-base font-extrabold text-[#1B133C]">{activeLoansCount}</span>
                <span className="text-[8px] text-emerald-700 block">Ongoing Credits</span>
              </div>
              <div className="p-3 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-2xl space-y-1">
                <span className="text-[9px] uppercase text-[#1B133C]/60 block">Total Borrowed</span>
                <span className="text-base font-extrabold text-[#1B133C]">${totalBorrowed.toFixed(2)}</span>
                <span className="text-[8px] text-[#F97316] block">As Borrower</span>
              </div>
              <div className="p-3 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-2xl space-y-1">
                <span className="text-[9px] uppercase text-[#1B133C]/60 block">Total Lent</span>
                <span className="text-base font-extrabold text-[#1B133C]">${totalLent.toFixed(2)}</span>
                <span className="text-[8px] text-emerald-600 block">As Lender</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl font-mono text-center space-y-0.5">
              <span className="text-[9px] uppercase block tracking-wider font-semibold">Outstanding Obligation</span>
              <span className="text-lg font-black block">${outstandingDebt.toFixed(2)} USDC</span>
            </div>
          </div>

        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#1B133C]/10 space-y-4">
          <div className="text-3xl">💳</div>
          <h3 className="font-bold text-lg text-[#1B133C]">No wallet connected</h3>
          <p className="text-xs text-[#1B133C]/70 max-w-sm mx-auto">Connect your Algorand wallet to view your financial profile stats, reputation score, and active loan contracts.</p>
          <button
            onClick={onOpenWalletModal}
            className="px-6 py-2.5 rounded-xl bg-[#1B133C] text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SUBNAV TABS: CONTRACTS OR TELEMETRY */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeAddress && (
        <div className="space-y-6">
          <div className="flex border-b border-[#1B133C]/10 gap-6 font-semibold text-xs pb-1">
            <button
              onClick={() => setDashboardTab('p2p')}
              className={`pb-2.5 transition-all cursor-pointer relative ${
                dashboardTab === 'p2p' ? 'text-[#1B133C] font-bold' : 'text-[#1B133C]/50 hover:text-[#1B133C]'
              }`}
            >
              Active P2P Contracts ({contracts.length})
              {dashboardTab === 'p2p' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B133C]" />}
            </button>
            <button
              onClick={() => setDashboardTab('telemetry')}
              className={`pb-2.5 transition-all cursor-pointer relative ${
                dashboardTab === 'telemetry' ? 'text-[#1B133C] font-bold' : 'text-[#1B133C]/50 hover:text-[#1B133C]'
              }`}
            >
              SIWA Telemetry & Verifications ({receipts.length})
              {dashboardTab === 'telemetry' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B133C]" />}
            </button>
          </div>

          {/* TAB 1: P2P CONTRACTS BOARD */}
          {dashboardTab === 'p2p' && (
            <div className="space-y-4">
              {contracts.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#1B133C]/10 text-xs text-[#1B133C]/60 italic font-mono">
                  No active P2P contracts matching your wallet identity. Proceed to P2P Marketplace to request credit or fund open draws.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contracts.map((c) => {
                    const isBorrower = c.parties.borrowerWallet === activeAddress
                    const isLender = c.parties.lenderWallet === activeAddress
                    const totalOwed = c.terms.totalRepaymentUsdc
                    const stateColor =
                      c.state === 'Active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : c.state === 'Overdue'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : c.state === 'Defaulted'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : c.state === 'Repaid'
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200'

                    return (
                      <div
                        key={c.contractId}
                        className="p-6 bg-white border border-[#1B133C]/10 rounded-3xl space-y-4 hover:border-[#1B133C]/20 transition-all font-mono text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-[#1B133C]/10 pb-3">
                          <span className="font-bold text-[#F97316]">{c.contractId}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stateColor}`}>
                            {c.state}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <span className="text-[#1B133C]/60 block">ROLE</span>
                            <span className="font-bold text-[#1B133C]">
                              {isBorrower && isLender ? 'BORROWER & LENDER' : isBorrower ? 'BORROWER' : 'LENDER'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#1B133C]/60 block">PARTNER</span>
                            <span className="font-bold text-[#1B133C]">
                              {isBorrower ? `@${c.parties.lenderUsername || 'lender'}` : `@${c.parties.borrowerUsername || 'borrower'}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#1B133C]/60 block">PRINCIPAL</span>
                            <span className="font-bold text-[#1B133C]">${c.terms.principalUsdc} USDC</span>
                          </div>
                          <div>
                            <span className="text-[#1B133C]/60 block">TOTAL REPAYMENT</span>
                            <span className="font-bold text-emerald-700">${totalOwed} USDC</span>
                          </div>
                          <div>
                            <span className="text-[#1B133C]/60 block">DUE DATE</span>
                            <span className="font-bold text-[#1B133C]">
                              {new Date(c.terms.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#1B133C]/60 block">GRACE DATE</span>
                            <span className="font-bold text-rose-600">
                              {new Date(c.terms.gracePeriodEndDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Interactive sign/fund/repay workflows per role */}
                        {c.state === 'Awaiting Borrower Signature' && isBorrower && (
                          <button
                            onClick={() => handleSignContract(c.contractId)}
                            className="w-full py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Sign Terms & Commit (Ed25519)
                          </button>
                        )}

                        {c.state === 'Ready for Lender Funding' && isLender && (
                          <div className="space-y-2.5 pt-2 border-t border-[#1B133C]/5">
                            <span className="text-[10px] text-[#1B133C]/60 uppercase block">Fund Agreement (Lender Only)</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Algorand transaction ID..."
                                value={fundingTxId}
                                onChange={(e) => setFundingTxId(e.target.value)}
                                className="flex-1 px-3 py-2 border border-[#1B133C]/10 rounded-xl bg-[#F5F5F5] outline-none focus:border-[#1B133C]/40 text-xs"
                              />
                              <button
                                onClick={() => handleFundContract(c.contractId)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                              >
                                Submit Fund
                              </button>
                            </div>
                            <p className="text-[10px] text-[#1B133C]/50">Verify transfer of ${c.terms.principalUsdc} USDC to borrower address.</p>
                          </div>
                        )}

                        {c.state === 'Active' && isBorrower && (
                          <div className="space-y-2.5 pt-2 border-t border-[#1B133C]/5">
                            <span className="text-[10px] text-[#1B133C]/60 uppercase block">Repay Obligation</span>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="number"
                                placeholder="Amount USDC..."
                                value={repayAmount}
                                onChange={(e) => setRepayAmount(e.target.value)}
                                className="w-full sm:w-28 px-3 py-2 border border-[#1B133C]/10 rounded-xl bg-[#F5F5F5] outline-none text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Repayment tx ID..."
                                value={repayTxId}
                                onChange={(e) => setRepayTxId(e.target.value)}
                                className="flex-1 px-3 py-2 border border-[#1B133C]/10 rounded-xl bg-[#F5F5F5] outline-none text-xs"
                              />
                              <button
                                onClick={() => handleRepayContract(c.contractId, totalOwed)}
                                className="px-4 py-2 bg-[#1B133C] hover:bg-[#1B133C]/90 text-white font-bold rounded-xl cursor-pointer"
                              >
                                Repay
                              </button>
                            </div>
                            <p className="text-[10px] text-[#1B133C]/50">USDC transfer to lender address. Overdue after due date + grace period.</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SIWA TELEMETRY RECIEPTS */}
          {dashboardTab === 'telemetry' && (
            <div className="p-6 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1B133C]/10 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1B133C]">
                    On-Chain Transaction & Audit Explorer
                  </h3>
                  <p className="text-[11px] text-[#1B133C]/60 mt-0.5">
                    Cryptographic receipts, gas units, and outcome verification records.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] text-xs font-mono">
                  {['all', 'safe', 'review_before_action', 'suspicious'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setReceiptFilter(f)}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        receiptFilter === f ? 'bg-[#1B133C] text-white font-bold' : 'text-[#1B133C]/70 hover:text-[#1B133C]'
                      }`}
                    >
                      {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1B133C]/10 text-[10px] uppercase text-[#1B133C]/60">
                      <th className="pb-3 font-semibold">Receipt / Tx Hash</th>
                      <th className="pb-3 font-semibold">Service / Endpoint</th>
                      <th className="pb-3 font-semibold">Outcome</th>
                      <th className="pb-3 font-semibold text-right">Amount</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B133C]/10 text-[#1B133C]">
                    {receipts.filter((r) => receiptFilter === 'all' || r.decision === receiptFilter).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#1B133C]/50 italic font-sans">
                          No matching transaction receipts recorded.
                        </td>
                      </tr>
                    ) : (
                      receipts
                        .filter((r) => receiptFilter === 'all' || r.decision === receiptFilter)
                        .map((r) => (
                          <tr key={r.id} className="transition-colors hover:bg-slate-50">
                            <td className="py-3 font-bold flex items-center gap-2 text-[#1B133C]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1B133C]" />
                              <span className="truncate max-w-[130px]">{r.id}</span>
                            </td>
                            <td className="py-3">
                              <span className="font-sans font-medium text-[#1B133C]">{r.service}</span>
                              <span className="text-[10px] block font-mono text-[#1B133C]/60">{r.endpoint}</span>
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  r.decision === 'safe'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : r.decision === 'review_before_action'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}
                              >
                                {r.decision}
                              </span>
                            </td>
                            <td className="py-3 text-right font-bold text-[#1B133C]">
                              ${r.amount?.toFixed(2) || '0.01'}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => setSelectedReceipt(r)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#F5F5F5] hover:bg-slate-200 text-[#1B133C] transition-colors cursor-pointer"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: TRANSACTION PAYLOAD INSPECTOR */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B133C]/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-[#1B133C]/10 bg-white p-6 sm:p-8 shadow-2xl space-y-5 text-[#1B133C]">
            <div className="flex items-start justify-between border-b border-[#1B133C]/10 pb-3">
              <div>
                <span className="text-xs font-mono text-[#F97316] uppercase font-semibold">On-Chain Receipt Inspector</span>
                <h3 className="text-xl font-bold text-[#1B133C] mt-0.5">
                  {selectedReceipt.service}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 rounded-lg bg-[#F5F5F5] hover:bg-slate-200 text-[#1B133C] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-[#1B133C]/10 bg-[#F5F5F5] text-xs font-mono space-y-2 select-text text-[#1B133C]">
              <div className="flex justify-between">
                <span className="text-[#1B133C]/60">Transaction ID:</span>
                <span className="font-bold text-[#1B133C]">{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1B133C]/60">Service Endpoint:</span>
                <span className="text-[#1B133C] font-semibold">{selectedReceipt.endpoint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1B133C]/60">Decision Verdict:</span>
                <span className="text-emerald-700 font-bold">{selectedReceipt.decision}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1B133C]/60">Risk Level:</span>
                <span className="capitalize text-[#1B133C]">{selectedReceipt.risk || 'Low'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1B133C]/60">Settled Amount:</span>
                <span className="font-bold text-[#1B133C]">${selectedReceipt.amount?.toFixed(2) || '0.01'} USDC (ASA 10458941)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1B133C]/60">Timestamp:</span>
                <span>{new Date(selectedReceipt.timestamp).toISOString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#F5F5F5] hover:bg-slate-200 text-[#1B133C] cursor-pointer"
              >
                Close
              </button>
              <a
                href={`https://lora.algokit.io/testnet/transaction/${selectedReceipt.id}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>View on Lora Explorer</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentBondProfile
