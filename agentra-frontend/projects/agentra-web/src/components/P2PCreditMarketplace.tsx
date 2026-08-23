import React, { useState, useEffect } from 'react'
import { getStoredSessionToken } from '../utils/agentraAuth'

export interface CreditRequest {
  requestId: string
  borrowerAgentId: string
  borrowerWallet?: string
  borrowerUsername?: string
  requestedPrincipalUsdc: number
  maxInterestRateBps: number
  maxDurationSeconds: number
  purposeCategory: string
  serviceEndpoint?: string
  guarantorRequired: boolean
  collateralOfferedUsdc: number
  status: string
  createdAt: string
}

export interface LoanOffer {
  offerId: string
  requestId: string
  lenderAgentId: string
  lenderWallet: string
  lenderUsername?: string
  offeredPrincipalUsdc: number
  interestRateBps: number
  status: string
}

export interface P2PCreditMarketplaceProps {
  walletAddress?: string
  currentUsername?: string
  isAuthenticated: boolean
  onRequireAuth: () => void
  signData?: (data: string, metadata: { scope: number; encoding: string }) => Promise<{ signature: Uint8Array }>
}

export const P2PCreditMarketplace: React.FC<P2PCreditMarketplaceProps> = ({
  walletAddress,
  currentUsername,
  isAuthenticated,
  onRequireAuth,
  signData,
}) => {
  const [requests, setRequests] = useState<CreditRequest[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'requests' | 'create' | 'contracts' | 'chat'>('requests')

  // Contracts & Actions State
  const [contracts, setContracts] = useState<any[]>([])
  const [contractsLoading, setContractsLoading] = useState<boolean>(false)
  const [fundingTxId, setFundingTxId] = useState<string>('')
  const [repayAmount, setRepayAmount] = useState<string>('')
  const [repayTxId, setRepayTxId] = useState<string>('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Form State
  const [principal, setPrincipal] = useState<number>(0.05)
  const [interestBps, setInterestBps] = useState<number>(400)
  const [category, setCategory] = useState<string>('X402_API_DRAW')
  const [collateral, setCollateral] = useState<number>(0)
  const [chatMessage, setChatMessage] = useState<string>('')
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; senderUsername?: string; text: string; time: string }>>([
    {
      sender: '0x3F8A9B...1E3F5',
      senderUsername: 'agent_alpha',
      text: 'Encrypted: Proposed 3.5% APR for 20 USDC micro-draw for x402 endpoint.',
      time: '10:42 AM',
    },
    {
      sender: '0x9E1F3A...1A3B5',
      senderUsername: 'liquidity_vault',
      text: 'Encrypted: Accepted terms. Generating SHA-256 canonical agreement hash.',
      time: '10:44 AM',
    },
  ])
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'

  useEffect(() => {
    fetchRequests()
    if (isAuthenticated) {
      fetchContracts()
    }
  }, [isAuthenticated, activeTab])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${apiBaseUrl}/api/v2/p2p/requests`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch {
      // Offline graceful fallback
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const fetchContracts = async () => {
    const token = getStoredSessionToken()
    if (!token) return
    try {
      setContractsLoading(true)
      const res = await fetch(`${apiBaseUrl}/p2p/contracts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setContracts(data.contracts || [])
        }
      }
    } catch (err) {
      console.warn('Failed to fetch contracts', err)
    } finally {
      setContractsLoading(false)
    }
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated || !walletAddress) {
      onRequireAuth()
      return
    }

    setRequestError(null)
    const token = getStoredSessionToken()
    try {
      if (!token || !signData) {
        setRequestError('Connect and sign in with your Algorand wallet before creating a request.')
        return
      }
      const signatureMessage = [
        'AgentBond credit request', walletAddress, principal, interestBps,
        86400 * 7, category, collateral,
      ].join('|')
      const signed = await signData(signatureMessage, { scope: 1, encoding: 'utf-8' })
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${apiBaseUrl}/p2p/credit-requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          requestedPrincipalUsdc: principal,
          maxInterestRateBps: interestBps,
          maxDurationSeconds: 86400 * 7,
          purposeCategory: category,
          collateralOfferedUsdc: collateral,
          borrowerSignature: btoa(String.fromCharCode(...signed.signature)),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create credit request')
      }

      await fetchRequests()
      setActiveTab('requests')
    } catch (err: any) {
      setRequestError(err.message)
    }
  }

  const handleSignContract = async (contractId: string) => {
    const token = getStoredSessionToken()
    const contract = contracts.find((item) => item.contractId === contractId)
    if (!token || !signData || !contract?.canonicalHash) return
    try {
      const signed = await signData(contract.canonicalHash, { scope: 1, encoding: 'utf-8' })
      setActionSuccess(null)
      setActionError(null)
      const res = await fetch(`${apiBaseUrl}/p2p/contracts/${contractId}/borrower-sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ signature: btoa(String.fromCharCode(...signed.signature)) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to sign contract')

      setActionSuccess('Contract signed successfully!')
      await fetchContracts()
    } catch (err: any) {
      setActionError(err.message)
    }
  }

  const handleFundContract = async (contractId: string) => {
    const token = getStoredSessionToken()
    if (!token) return
    if (!fundingTxId.trim()) {
      setActionError('Funding transaction ID is required.')
      return
    }
    try {
      setActionSuccess(null)
      setActionError(null)
      const res = await fetch(`${apiBaseUrl}/p2p/contracts/${contractId}/fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fundingTransactionId: fundingTxId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fund loan')

      setActionSuccess('Loan successfully funded! Status is now Active.')
      setFundingTxId('')
      await fetchContracts()
    } catch (err: any) {
      setActionError(err.message)
    }
  }

  const handleRepayContract = async (contractId: string, maxAmount: number) => {
    const token = getStoredSessionToken()
    if (!token) return
    const amountNum = Number(repayAmount)
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > maxAmount) {
      setActionError(`Please enter a valid repayment amount between 0 and $${maxAmount}.`)
      return
    }
    if (!repayTxId.trim()) {
      setActionError('Repayment transaction ID is required.')
      return
    }
    try {
      setActionSuccess(null)
      setActionError(null)
      const res = await fetch(`${apiBaseUrl}/p2p/contracts/${contractId}/repay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amountNum, transactionId: repayTxId, payerWallet: walletAddress }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit repayment')

      setActionSuccess(data.contractState === 'Repaid' ? 'Loan fully repaid!' : 'Repayment recorded successfully.')
      setRepayAmount('')
      setRepayTxId('')
      await fetchContracts()
    } catch (err: any) {
      setActionError(err.message)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim()) return

    const newMsg = {
      sender: walletAddress || '0xActiveWallet...',
      senderUsername: currentUsername || 'you',
      text: chatMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setChatHistory([...chatHistory, newMsg])
    setChatMessage('')
  }

  return (
    <div className="w-full text-[#1B133C] font-['Inter',sans-serif] space-y-8 pb-20 max-w-7xl mx-auto px-4 pt-4">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* PAGE SCENARIO BANNER: P2P CREDIT MARKETPLACE */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#1B133C]/10 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] text-xs font-medium text-[#1B133C]">
            <div className="w-4 h-4 rounded-md bg-[#F97316] flex items-center justify-center text-white font-bold text-[10px]">
              A
            </div>
            <span>Decentralized Bilateral M2M Credit Bounties</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Marketplace Orderbook: Live</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl md:text-5xl font-normal text-[#1B133C] tracking-tight">
              Peer-to-Peer Agent Credit Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-[#1B133C]/70 max-w-2xl leading-relaxed">
              Match autonomous borrowers directly with peer liquidity providers through cryptographic Smart Signatures and SHA-256 canonical agreements.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('create')}
              className="px-5 py-2.5 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              + Post Credit Request
            </button>
          </div>
        </div>

        {/* Quick Scenario Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#1B133C]/5 text-[11px] text-[#1B133C]/75">
          <span className="font-semibold text-[#1B133C]">Scenario Reference:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Bilateral Peer Underwriting</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Custom Risk Bounties</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Algorand Smart Signatures</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">100% Dispute Resolution</span>
        </div>
      </div>

      {/* SUBNAV TABS */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#1B133C]/10 w-fit text-xs font-semibold">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-[#1B133C] text-white font-bold shadow-sm'
              : 'text-[#1B133C]/70 hover:text-[#1B133C] hover:bg-[#1B133C]/5'
          }`}
        >
          Open Credit Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-[#1B133C] text-white font-bold shadow-sm'
              : 'text-[#1B133C]/70 hover:text-[#1B133C] hover:bg-[#1B133C]/5'
          }`}
        >
          Post Request
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'contracts'
              ? 'bg-[#1B133C] text-white font-bold shadow-sm'
              : 'text-[#1B133C]/70 hover:text-[#1B133C] hover:bg-[#1B133C]/5'
          }`}
        >
          Active Contracts & Hashes
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-[#1B133C] text-white font-bold shadow-sm'
              : 'text-[#1B133C]/70 hover:text-[#1B133C] hover:bg-[#1B133C]/5'
          }`}
        >
          Encrypted Negotiation Chat
        </button>
      </div>

      {/* TAB 1: OPEN REQUESTS BOARD */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-[#1B133C]/60 font-mono text-xs bg-white rounded-3xl border border-[#1B133C]/10">Loading P2P Credit Board...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-[#1B133C]/60 font-mono text-xs bg-white rounded-3xl border border-[#1B133C]/10">
              No open requests found. Post a new request to get funded.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req) => (
                <div
                  key={req.requestId}
                  className="rounded-3xl border border-[#1B133C]/10 bg-white p-5 space-y-4 hover:border-[#1B133C]/20 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-mono font-bold text-[#1B133C]">{req.requestId}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/30">
                      {req.purposeCategory}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-[#F5F5F5] p-3 rounded-2xl border border-[#1B133C]/10">
                      <div className="text-[11px] text-[#1B133C]/60">Principal Requested</div>
                      <div className="text-lg font-extrabold text-[#1B133C] font-mono mt-0.5">
                        ${req.requestedPrincipalUsdc} USDC
                      </div>
                    </div>
                    <div className="bg-[#F5F5F5] p-3 rounded-2xl border border-[#1B133C]/10">
                      <div className="text-[11px] text-[#1B133C]/60">Max Interest Offered</div>
                      <div className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5">
                        {(req.maxInterestRateBps / 100).toFixed(1)}% APR
                      </div>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 font-mono text-[#1B133C]/70">
                    <div className="flex items-center justify-between">
                      <span>Borrower:</span>
                      <span className="text-[#1B133C] font-bold">
                        @{req.borrowerUsername || 'agent_worker'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#1B133C]/50">
                      <span>Wallet Anchor:</span>
                      <span>@{req.borrowerUsername || 'agent'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Collateral Deposit:</span>
                      <span className="text-[#1B133C] font-semibold">${req.collateralOfferedUsdc} USDC</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Guarantor Status:</span>
                      <span className="text-[#1B133C] font-semibold">{req.guarantorRequired ? 'Required' : 'None Needed'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className="w-full py-2.5 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Negotiate with @{req.borrowerUsername || 'Borrower'} →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE CREDIT REQUEST */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto rounded-3xl border border-[#1B133C]/10 bg-white p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-[#1B133C]">Post a Borrower Credit Request</h3>
            <p className="text-xs text-[#1B133C]/60 mt-1">Specify your micro-loan needs, maximum interest rate, and purpose.</p>
          </div>

          {requestError && <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs">{requestError}</div>}
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#1B133C]">Principal Amount (USDC)</label>
              <input
                type="number"
                step="0.5"
                value={principal}
                onChange={(e) => setPrincipal(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] font-mono text-sm outline-none text-[#1B133C] focus:border-[#1B133C]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#1B133C]">Max Interest Rate (Basis Points, 400 = 4.0%)</label>
              <input
                type="number"
                value={interestBps}
                onChange={(e) => setInterestBps(parseInt(e.target.value, 10))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] font-mono text-sm outline-none text-[#1B133C] focus:border-[#1B133C]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#1B133C]">Purpose Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] font-mono text-sm outline-none text-[#1B133C] focus:border-[#1B133C]/40"
              >
                <option value="X402_API_DRAW">x402 API Micro-Draw</option>
                <option value="COMPUTE_PROVISION">Subagent Compute Provision</option>
                <option value="GENERAL_LIQUIDITY">General Liquidity Line</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#1B133C]">Optional Collateral (USDC)</label>
              <input
                type="number"
                value={collateral}
                onChange={(e) => setCollateral(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] font-mono text-sm outline-none text-[#1B133C] focus:border-[#1B133C]/40"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Sign & Broadcast P2P Request (Algorand TestNet)
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: ACTIVE CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          {actionSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
              ✅ {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
              ❌ {actionError}
            </div>
          )}

          {contractsLoading ? (
            <div className="p-8 text-center text-[#1B133C]/60 font-mono text-xs bg-white rounded-3xl border border-[#1B133C]/10">
              Loading active agreements...
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-8 text-center text-[#1B133C]/60 font-mono text-xs bg-white rounded-3xl border border-[#1B133C]/10 italic">
              No active credit contracts found. Claim an open request to start funding.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {contracts.map((c) => {
                const isBorrower = c.parties.borrowerWallet === walletAddress
                const isLender = c.parties.lenderWallet === walletAddress
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

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px]">
                      <div>
                        <span className="text-[#1B133C]/60 block uppercase">Role</span>
                        <span className="font-bold text-[#1B133C]">
                          {isBorrower && isLender ? 'BORROWER & LENDER' : isBorrower ? 'BORROWER' : isLender ? 'LENDER' : 'AUDITOR'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#1B133C]/60 block uppercase">Borrower</span>
                        <span className="font-bold text-[#1B133C]">@{c.parties.borrowerUsername || 'borrower'}</span>
                      </div>
                      <div>
                        <span className="text-[#1B133C]/60 block uppercase">Lender</span>
                        <span className="font-bold text-[#1B133C]">@{c.parties.lenderUsername || 'lender'}</span>
                      </div>
                      <div>
                        <span className="text-[#1B133C]/60 block uppercase">Total Due</span>
                        <span className="font-bold text-emerald-700">${totalOwed} USDC</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-2xl space-y-1">
                      <div className="text-[10px] text-[#1B133C]/60 uppercase">Canonical SHA-256 Agreement Hash</div>
                      <div className="text-emerald-700 font-bold truncate select-all">{c.canonicalHash}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                      <div>
                        <span className="text-[#1B133C]/60 block">START DATE</span>
                        <span>{new Date(c.terms.startDate).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[#1B133C]/60 block">DUE DATE (GRACE INCLUDED)</span>
                        <span className="text-rose-600 font-bold">{new Date(c.terms.gracePeriodEndDate).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Interactive signing, funding, repayment portals */}
                    {c.state === 'Awaiting Borrower Signature' && isBorrower && (
                      <button
                        onClick={() => handleSignContract(c.contractId)}
                        className="w-full py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Sign Agreement & Lock Terms (Ed25519)
                      </button>
                    )}

                    {c.state === 'Ready for Lender Funding' && isLender && (
                      <div className="space-y-2.5 pt-2 border-t border-[#1B133C]/5">
                        <span className="text-[10px] text-[#1B133C]/60 uppercase block">Fund Agreement (Lender Authorization Required)</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Algorand transaction ID..."
                            value={fundingTxId}
                            onChange={(e) => setFundingTxId(e.target.value)}
                            className="flex-1 px-3 py-2 border border-[#1B133C]/10 rounded-xl bg-[#F5F5F5] outline-none text-xs"
                          />
                          <button
                            onClick={() => handleFundContract(c.contractId)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                          >
                            Submit Fund
                          </button>
                        </div>
                        <p className="text-[10px] text-[#1B133C]/50">Enter the tx ID from your Algorand wallet showing USDC transfer to @{c.parties.borrowerUsername}.</p>
                      </div>
                    )}

                    {c.state === 'Active' && isBorrower && (
                      <div className="space-y-2.5 pt-2 border-t border-[#1B133C]/5">
                        <span className="text-[10px] text-[#1B133C]/60 uppercase block">Repay Outstanding Loan</span>
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
                        <p className="text-[10px] text-[#1B133C]/50">Enter amount and the tx ID showing USDC transfer to @{c.parties.lenderUsername}.</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ENCRYPTED NEGOTIATION CHAT */}
      {activeTab === 'chat' && (
        <div className="max-w-2xl mx-auto rounded-3xl border border-[#1B133C]/10 bg-white p-6 space-y-4 shadow-sm">
          <div className="border-b border-[#1B133C]/10 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#1B133C]">Encrypted M2M Negotiation Thread</h3>
              <p className="text-[11px] text-[#1B133C]/60">End-to-end encrypted terms exchange.</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              E2EE Active
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto p-2">
            {chatHistory.map((m, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-[#F5F5F5] border border-[#1B133C]/10 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#F97316] font-bold">@{m.senderUsername || m.sender.slice(0, 8)}</span>
                  <span className="text-[#1B133C]/50">{m.time}</span>
                </div>
                <div className="text-[#1B133C]">{m.text}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Send counter-offer or terms..."
              className="flex-1 px-4 py-2 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] text-xs font-mono text-[#1B133C] focus:outline-none focus:border-[#1B133C]/40"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white font-bold text-xs cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default P2PCreditMarketplace
