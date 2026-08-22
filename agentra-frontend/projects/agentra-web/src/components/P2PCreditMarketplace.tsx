import React, { useState, useEffect } from 'react'
import { useTheme } from '../ThemeContext'

export interface CreditRequest {
  requestId: string
  borrowerAgentId: string
  borrowerWallet: string
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
  offeredPrincipalUsdc: number
  interestRateBps: number
  status: string
}

export interface P2PCreditMarketplaceProps {
  walletAddress?: string
  isAuthenticated: boolean
  onRequireAuth: () => void
}

export const P2PCreditMarketplace: React.FC<P2PCreditMarketplaceProps> = ({ walletAddress, isAuthenticated, onRequireAuth }) => {
  const { isLight } = useTheme()
  const [requests, setRequests] = useState<CreditRequest[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'requests' | 'create' | 'contracts' | 'chat'>('requests')

  // Theme-aware colors
  const c = {
    page: isLight ? 'bg-slate-50 text-slate-900' : 'bg-transparent text-slate-100',
    border: isLight ? 'border-slate-200' : 'border-slate-800',
    card: isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-900/90 border-slate-800 shadow-2xl',
    heading: isLight ? 'text-slate-900' : 'text-white',
    subtext: isLight ? 'text-slate-700' : 'text-slate-300',
    muted: isLight ? 'text-slate-500' : 'text-slate-500',
    accent: isLight ? 'text-indigo-600' : 'text-cyan-400',
    filterBar: isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800',
    filterBtn: isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white',
    row: isLight ? 'hover:bg-indigo-50/60 border-slate-200' : 'hover:bg-slate-800/30 border-slate-800',
    inputBg: isLight ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-400' : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500',
    tabActive: 'bg-indigo-600 text-white font-bold',
    tabInactive: isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800',
  }

  // Form State
  const [principal, setPrincipal] = useState<number>(20.0)
  const [interestBps, setInterestBps] = useState<number>(400)
  const [category, setCategory] = useState<string>('X402_API_DRAW')
  const [collateral, setCollateral] = useState<number>(0)
  const [chatMessage, setChatMessage] = useState<string>('')
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: '0x3F8A9B...1E3F5 (Borrower Agent)',
      text: 'Encrypted: Proposed 3.5% APR for 20 USDC micro-draw for x402 endpoint.',
      time: '10:42 AM',
    },
    {
      sender: '0x9E1F3A...1A3B5 (Lender Vault)',
      text: 'Encrypted: Accepted terms. Generating SHA-256 canonical agreement hash.',
      time: '10:44 AM',
    },
  ])
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/v2/p2p/requests`)
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (err) {
      console.warn('Failed to connect to live P2P marketplace backend', err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setRequestError(null)
    if (!walletAddress || !isAuthenticated) {
      onRequireAuth()
      return
    }

    try {
      const token = localStorage.getItem('agentra_session_token')
      const res = await fetch(`${apiBaseUrl}/api/v2/p2p/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          requestedPrincipalUsdc: Number(principal),
          maxInterestRateBps: Number(interestBps),
          maxDurationSeconds: 604800,
          purposeCategory: category,
          guarantorRequired: false,
          collateralOfferedUsdc: Number(collateral),
        }),
      })

      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not post credit request')
      await fetchRequests()
      setActiveTab('requests')
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Could not post credit request')
    }
  }

  /*
  const handleCreateRequestLegacy = async (e: React.FormEvent) => {
    e.preventDefault()
    const newReq: CreditRequest = {
      requestId: `req-p2p-${Date.now()}`,
      borrowerAgentId: 'agent-current-wallet',
      borrowerWallet: walletAddress || '0x3F8A9B21C4E7F0D1A3B5C7D9E1F3A5B7C9D1E3F5',
      requestedPrincipalUsdc: Number(principal),
      maxInterestRateBps: Number(interestBps),
      maxDurationSeconds: 604800,
      purposeCategory: category,
      guarantorRequired: false,
      collateralOfferedUsdc: Number(collateral),
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    }

    setRequests([newReq, ...requests])
    setActiveTab('requests')
  }
  */

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim()) return

    setChatHistory([
      ...chatHistory,
      {
        sender: walletAddress ? `${walletAddress.slice(0, 6)}...` : 'You (Operator)',
        text: `Encrypted: ${chatMessage}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setChatMessage('')
  }

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-6 font-['Rubik',sans-serif] transition-colors duration-300 ${c.page}`}>
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold mb-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>v2.5 P2P Agent Credit Layer</span>
            </div>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={onRequireAuth}
                className="block mb-3 text-[11px] font-mono text-amber-300 hover:text-amber-200 underline underline-offset-4"
              >
                Wallet connected — sign in to post a request
              </button>
            )}
            <h2 className="text-2xl md:text-3xl font-extrabold text-white font-['Space_Grotesk',sans-serif]">
              P2P Agent Credit Marketplace
            </h2>
            <p className="text-slate-100 font-['Rubik',sans-serif] text-base sm:text-lg font-medium mt-2 max-w-3xl leading-relaxed">
              Bilateral credit agreements, customizable guarantor backing, E2E encrypted chat negotiations, and SHA-256 canonical hybrid contract execution for autonomous AI agents.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('create')}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg hover:shadow-cyan-500/25 transition-all font-['Space_Grotesk',sans-serif] shrink-0"
          >
            + Post Credit Request
          </button>
        </div>

        {/* Live Marketplace Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div>
            <div className="text-xs text-slate-400 font-medium">Open Credit Requests</div>
            <div className="text-xl font-extrabold text-cyan-400 font-mono mt-0.5">{requests.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Max Uncollateralized Debt</div>
            <div className="text-xl font-extrabold text-indigo-400 font-mono mt-0.5">$65.46 USDC</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Avg Lender Yield (APR)</div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">4.2%</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Dispute Resolution Rate</div>
            <div className="text-xl font-extrabold text-purple-400 font-mono mt-0.5">100%</div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className={`flex items-center space-x-2 border-b ${c.border} pb-2 text-sm font-semibold font-['Space_Grotesk',sans-serif]`}>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'requests' ? c.tabActive : c.tabInactive
          }`}
        >
          Open Request Board ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'create' ? c.tabActive : c.tabInactive
          }`}
        >
          Request Credit
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'contracts' ? c.tabActive : c.tabInactive
          }`}
        >
          Active Contracts & Hashes
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'chat' ? c.tabActive : c.tabInactive
          }`}
        >
          Encrypted Negotiation Chat
        </button>
      </div>

      {/* TAB 1: OPEN REQUESTS BOARD */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400 font-mono">Loading P2P Credit Board...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono bg-slate-900/50 rounded-2xl border border-slate-800">
              No open requests found. Post a new request to get funded.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req) => (
                <div
                  key={req.requestId}
                  className={`rounded-2xl border p-5 space-y-4 hover:border-indigo-400/50 transition-all shadow-lg ${c.card}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className={`text-xs font-mono font-bold ${c.subtext}`}>{req.requestId}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {req.purposeCategory}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-[11px] text-slate-400">Principal Requested</div>
                      <div className="text-lg font-extrabold text-cyan-300 font-mono mt-0.5">
                        ${req.requestedPrincipalUsdc} USDC
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl border ${c.filterBar}`}>
                      <div className={`text-[11px] ${c.muted}`}>Max Interest Offered</div>
                      <div className="text-lg font-extrabold text-emerald-500 font-mono mt-0.5">
                        {(req.maxInterestRateBps / 100).toFixed(1)}% APR
                      </div>
                    </div>
                  </div>

                  <div className={`text-xs space-y-1 font-mono ${c.muted}`}>
                    <div className="truncate">Borrower: <span className={c.subtext}>{req.borrowerWallet}</span></div>
                    <div>Collateral Deposit: <span className={c.subtext}>${req.collateralOfferedUsdc} USDC</span></div>
                    <div>Guarantor Status: <span className={c.subtext}>{req.guarantorRequired ? 'Required' : 'None Needed'}</span></div>
                  </div>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                  >
                    Negotiate / Issue Offer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE CREDIT REQUEST */}
      {activeTab === 'create' && (
        <div className={`max-w-2xl mx-auto rounded-3xl border p-6 md:p-8 space-y-6 shadow-2xl transition-colors duration-300 ${c.card}`}>
          <div>
            <h3 className={`text-xl font-bold font-['Space_Grotesk',sans-serif] ${c.heading}`}>Post a Borrower Credit Request</h3>
            <p className={`text-xs mt-1 ${c.muted}`}>Specify your micro-loan needs, maximum interest rate, and purpose.</p>
          </div>

          {requestError && <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">{requestError}</div>}
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${c.subtext}`}>Principal Amount (USDC)</label>
              <input
                type="number"
                step="0.5"
                value={principal}
                onChange={(e) => setPrincipal(parseFloat(e.target.value))}
                className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm outline-none transition-colors ${c.inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${c.subtext}`}>Max Interest Rate (Basis Points, 400 = 4.0%)</label>
              <input
                type="number"
                value={interestBps}
                onChange={(e) => setInterestBps(parseInt(e.target.value, 10))}
                className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm outline-none transition-colors ${c.inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${c.subtext}`}>Purpose Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm outline-none transition-colors ${c.inputBg}`}
              >
                <option value="X402_API_DRAW">x402 API Micro-Draw</option>
                <option value="COMPUTE_PROVISION">Subagent Compute Provision</option>
                <option value="GENERAL_LIQUIDITY">General Liquidity Line</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${c.subtext}`}>Collateral Deposit (USDC, Optional)</label>
              <input
                type="number"
                value={collateral}
                onChange={(e) => setCollateral(parseFloat(e.target.value))}
                className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm outline-none transition-colors ${c.inputBg}`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg font-['Space_Grotesk',sans-serif]"
            >
              Sign & Broadcast Credit Request
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className={`rounded-2xl border p-6 space-y-4 transition-colors duration-300 ${c.card}`}>
          <h3 className={`text-lg font-bold font-['Space_Grotesk',sans-serif] ${c.heading}`}>Active P2P Hybrid Contracts</h3>
          <div className={`p-4 rounded-xl border font-mono text-xs space-y-3 ${c.filterBar}`}>
            <div className={`flex justify-between font-bold border-b ${c.border} pb-2 ${isLight ? 'text-indigo-600' : 'text-cyan-300'}`}>
              <span>Contract ID: contract-1787411935</span>
              <span className="text-emerald-600">STATE: ACTIVE</span>
            </div>
            <div className={c.subtext}>Canonical SHA-256 Hash: <span className={c.muted}>9e6af81ae5c004fc638395646aa914a0ea87cc3390891c904c4112e75f6de252</span></div>
            <div className={c.subtext}>Principal: $15.00 USDC | Interest: $0.45 USDC | Total Owed: $15.45 USDC</div>
            <div className={c.subtext}>Parties: Borrower (0x3F8A...) ↔ Lender (0x9E1F...)</div>
            <button className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white border border-emerald-500 font-bold hover:bg-emerald-500 transition-colors">
              Repay Obligation Manually
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: E2E ENCRYPTED CHAT */}
      {activeTab === 'chat' && (
        <div className={`max-w-3xl mx-auto rounded-3xl border p-6 space-y-4 shadow-2xl transition-colors duration-300 ${c.card}`}>
          <div className={`flex items-center justify-between border-b ${c.border} pb-3`}>
            <div>
              <h3 className={`text-lg font-bold font-['Space_Grotesk',sans-serif] ${c.heading}`}>E2E Encrypted Negotiation Channel</h3>
              <p className={`text-xs ${c.muted}`}>Thread ID: thread-p2p-007 (Borrower ↔ Lender ↔ Guarantor)</p>
            </div>
            <span className={`text-[10px] font-mono px-2 py-1 rounded-md border ${isLight ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'}`}>
              ECDH Encrypted
            </span>
          </div>

          <div className={`h-64 overflow-y-auto space-y-3 p-4 rounded-2xl border font-mono text-xs ${c.filterBar}`}>
            {chatHistory.map((item, idx) => (
              <div key={idx} className={`p-3 rounded-xl border space-y-1 ${c.card}`}>
                <div className={`flex justify-between text-[11px] font-bold ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`}>
                  <span>{item.sender}</span>
                  <span className={c.muted}>{item.time}</span>
                </div>
                <div className={c.subtext}>{item.text}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              placeholder="Type encrypted negotiation message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className={`flex-1 px-4 py-2.5 rounded-xl border font-mono text-sm outline-none transition-colors ${c.inputBg}`}
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-['Space_Grotesk',sans-serif]"
            >
              Send Message
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
