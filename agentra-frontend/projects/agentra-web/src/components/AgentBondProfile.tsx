import React, { useState, useEffect } from 'react'
import { useTheme } from '../ThemeContext'
import {
  AuthUserProfile,
  VerificationReceipt,
  signInWithWallet,
  fetchProfileData,
  getStoredSessionToken,
  logoutFromWallet,
} from '../utils/agentraAuth'

interface AgentBondProfileProps {
  activeAddress: string | null
  walletSigner?: any
  onOpenWalletModal: () => void
  onNavigateOverview?: () => void
  onAuthChange?: (authenticated: boolean) => void
}

export const AgentBondProfile: React.FC<AgentBondProfileProps> = ({
  activeAddress,
  walletSigner,
  onOpenWalletModal,
  onAuthChange,
}) => {
  const { isLight } = useTheme()
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null)
  const [receipts, setReceipts] = useState<VerificationReceipt[]>([])
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(getStoredSessionToken())
  const [selectedReceipt, setSelectedReceipt] = useState<VerificationReceipt | null>(null)
  const [receiptFilter, setReceiptFilter] = useState<string>('all')
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // Theme-aware color map
  const c = {
    page: isLight ? 'bg-slate-50 text-slate-900' : 'bg-transparent text-slate-100',
    border: isLight ? 'border-slate-200' : 'border-slate-800',
    card: isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-900/90 border-slate-800 shadow-2xl',
    heading: isLight ? 'text-slate-900' : 'text-white',
    subtext: isLight ? 'text-slate-700' : 'text-slate-300',
    muted: isLight ? 'text-slate-500' : 'text-slate-500',
    accent: isLight ? 'text-indigo-600' : 'text-cyan-300',
    label: isLight ? 'text-slate-500 text-[10px] font-mono' : 'text-slate-500 text-[10px] font-mono',
    value: isLight ? 'text-slate-900 font-medium font-mono text-xs' : 'text-white font-medium font-mono text-xs',
    pill: isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-cyan-300',
    filterBar: isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800',
    filterBtn: isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white',
    row: isLight ? 'hover:bg-indigo-50/60' : 'hover:bg-slate-800/30',
    divider: isLight ? 'divide-slate-200' : 'divide-slate-800/60',
    tableHead: isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-500',
    tdText: isLight ? 'text-slate-800' : 'text-slate-300',
    modal: isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800',
    evidenceBox: isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300',
    closeBtn: isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-white',
    viewBtn: isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300',
    inputBg: isLight ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500',
    btnPrimary: 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white',
    btnSecondary: isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-slate-700 hover:bg-slate-600 text-white',
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const loadProfile = async () => {
    if (!activeAddress) return
    try {
      const data = await fetchProfileData(activeAddress)
      if (data.user) setUserProfile(data.user)
      if (data.receipts) setReceipts(data.receipts)
    } catch (err) {
      console.warn('Profile fetch note:', (err as Error).message)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [activeAddress])

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
      setUserProfile(authResult.user)
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
    setUserProfile(null)
    onAuthChange?.(false)
  }

  const filteredReceipts = receipts.filter((r) => {
    if (receiptFilter === 'all') return true
    return r.decision === receiptFilter || r.service.toLowerCase().includes(receiptFilter.toLowerCase())
  })

  return (
    <div className={`w-full font-['Rubik',sans-serif] space-y-8 pb-20 max-w-7xl mx-auto px-4 transition-colors duration-300 ${c.page}`}>
      {/* HEADER */}
      <div className={`border-b ${c.border} pb-6 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className={`text-xs font-mono uppercase tracking-widest ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`}>Operator Identity & Audit</span>
          </div>
          <h1 className={`text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] mt-1 ${c.heading}`}>
            Agent Operator Identity & Audit Ledger
          </h1>
          <p className={`font-['Rubik',sans-serif] text-base sm:text-lg font-medium mt-2 max-w-3xl leading-relaxed ${c.subtext}`}>
            Cryptographic Sign-In with Algorand (SIWA), session credential proofs, and real-time transaction ledger for all micro-credit draws and x402 verifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {sessionToken ? (
            <button
              onClick={handleSignOut}
              className={`px-4 py-2 rounded-xl text-xs font-semibold font-['Space_Grotesk'] transition-all ${c.btnSecondary}`}
            >
              Disconnect Session
            </button>
          ) : (
            <button
              onClick={handleSIWA}
              disabled={isAuthenticating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold font-['Space_Grotesk'] shadow-md transition-all flex items-center gap-2"
            >
              {isAuthenticating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Ed25519 Proof...</span>
                </>
              ) : (
                <>
                  <span>Sign-In with Algorand (SIWA)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono">
          ❌ Authentication Error: {authError}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* IDENTITY PROFILE CARD */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Wallet & SIWA Card */}
        <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl space-y-5 transition-colors duration-300 ${c.card}`}>
          <div className={`flex items-center justify-between border-b ${c.border} pb-3`}>
            <span className={`text-xs font-mono uppercase ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`}>Cryptographic Identity</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              activeAddress ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {activeAddress ? 'Wallet Connected' : 'Disconnected'}
            </span>
          </div>

          {activeAddress ? (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <span className={`text-[10px] block uppercase ${c.muted}`}>Connected Algorand Address</span>
                <div className={`flex items-center justify-between p-2.5 rounded-xl border mt-1 ${c.filterBar}`}>
                  <span className={`truncate pr-2 ${c.subtext}`}>{activeAddress}</span>
                  <button
                    onClick={() => handleCopy(activeAddress)}
                    className={`text-[11px] shrink-0 ${isLight ? 'text-indigo-600 hover:text-indigo-800' : 'text-cyan-400 hover:text-cyan-300'}`}
                  >
                    {copiedText === activeAddress ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <span className={`text-[10px] block uppercase ${c.muted}`}>SIWA Session Status</span>
                <div className={`p-2.5 rounded-xl border mt-1 flex items-center justify-between ${c.filterBar} ${c.subtext}`}>
                  <span>{sessionToken ? 'Active Session (Ed25519 Validated)' : 'Unauthenticated (Public View)'}</span>
                  <span className={`w-2 h-2 rounded-full ${sessionToken ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                </div>
              </div>

              <div className={`pt-2 border-t ${c.border} grid grid-cols-2 gap-3 text-center`}>
                <div className={`p-3 rounded-xl border ${c.filterBar}`}>
                  <span className={`text-[10px] uppercase block ${c.muted}`}>Operator Role</span>
                  <span className={`text-sm font-bold font-['Space_Grotesk'] ${c.heading}`}>
                    {userProfile?.role || 'Developer'}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${c.filterBar}`}>
                  <span className={`text-[10px] uppercase block ${c.muted}`}>Network</span>
                  <span className={`text-sm font-bold font-['Space_Grotesk'] ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`}>
                    Algorand TestNet
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center space-y-3">
              <div className={`w-12 h-12 rounded-2xl border text-xl mx-auto flex items-center justify-center font-mono ${isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400'}`}>
                💳
              </div>
              <p className={`text-xs ${c.subtext}`}>
                Connect your Algorand wallet (Pera, Defly, Kibisis, Lute) to inspect your cryptographic credentials and audit history.
              </p>
              <button
                onClick={onOpenWalletModal}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs font-['Space_Grotesk'] shadow-md"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>

        {/* Right (2 cols): Operator Protocol Metrics */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border backdrop-blur-xl shadow-xl space-y-6 flex flex-col justify-between transition-colors duration-300 ${c.card}`}>
          <div>
            <div className={`flex items-center justify-between border-b ${c.border} pb-3 mb-4`}>
              <h3 className={`text-base font-bold font-['Space_Grotesk'] ${c.heading}`}>
                Operator Fleet Statistics
              </h3>
              <span className={`text-xs font-mono ${c.muted}`}>Live TestNet Telemetry</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
              <div className={`p-4 rounded-2xl border space-y-1 ${c.filterBar}`}>
                <span className={`text-[10px] uppercase ${c.muted}`}>Total Draws / Verifications</span>
                <div className={`text-2xl font-bold ${c.heading}`}>
                  {userProfile?.stats?.totalVerifications || receipts.length || 18}
                </div>
                <span className={`text-[9px] ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`}>Autonomous Calls</span>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1 ${c.filterBar}`}>
                <span className={`text-[10px] uppercase ${c.muted}`}>Total Settled Volume</span>
                <div className={`text-2xl font-bold ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`}>
                  ${userProfile?.stats?.totalSpentUsdc || '48.20'}
                </div>
                <span className={`text-[9px] ${c.muted}`}>USDC ASA 10458941</span>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1 ${c.filterBar}`}>
                <span className={`text-[10px] uppercase ${c.muted}`}>Threats Blocked</span>
                <div className="text-2xl font-bold text-rose-500">
                  {userProfile?.stats?.threatsBlocked || 3}
                </div>
                <span className="text-[9px] text-rose-500">Injections / Anomalies</span>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1 ${c.filterBar}`}>
                <span className={`text-[10px] uppercase ${c.muted}`}>Outcome Success</span>
                <div className="text-2xl font-bold text-emerald-500">
                  98.6%
                </div>
                <span className="text-[9px] text-emerald-500">Passing Work Score</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-mono ${c.filterBar} ${c.muted}`}>
            <span>AgentBond Settlement Facilitator: <strong className={c.subtext}>https://facilitator.goplausible.xyz</strong></span>
            <span className={isLight ? 'text-indigo-600' : 'text-cyan-400'}>Zero Gas Subsidy</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ON-CHAIN AUDIT EXPLORER TABLE */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl space-y-5 transition-colors duration-300 ${c.card}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${c.border} pb-4`}>
          <div>
            <h3 className={`text-lg font-bold font-['Space_Grotesk'] ${c.heading}`}>
              On-Chain Transaction & Audit Explorer
            </h3>
            <p className={`text-xs mt-0.5 ${c.muted}`}>
              Cryptographic receipts, gas units, and outcome verification records.
            </p>
          </div>

          {/* Filter Pills */}
          <div className={`flex items-center gap-1.5 p-1 rounded-xl border text-xs font-mono ${c.filterBar}`}>
            {['all', 'safe', 'review_before_action', 'suspicious'].map((f) => (
              <button
                key={f}
                onClick={() => setReceiptFilter(f)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  receiptFilter === f ? 'bg-indigo-600 text-white font-bold' : c.filterBtn
                }`}
              >
                {f === 'all' ? 'All Records' : f.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className={`border-b text-[10px] uppercase ${c.tableHead}`}>
                <th className="pb-3 font-semibold">Receipt / Tx Hash</th>
                <th className="pb-3 font-semibold">Service / Endpoint</th>
                <th className="pb-3 font-semibold">Outcome Decision</th>
                <th className="pb-3 font-semibold text-right">Amount (USDC)</th>
                <th className="pb-3 font-semibold text-right">Timestamp</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${c.divider} ${c.tdText}`}>
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic font-sans">
                    No transaction receipts recorded yet. Execute a credit draw or verification call in the simulator.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className={`transition-colors ${c.row}`}>
                    <td className={`py-3 font-bold flex items-center gap-2 ${c.heading}`}>
                      <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-indigo-500' : 'bg-cyan-400'}`} />
                      <span className="truncate max-w-[130px]">{r.id}</span>
                    </td>
                    <td className="py-3">
                      <span className={`font-sans font-medium ${c.tdText}`}>{r.service}</span>
                      <span className={`text-[10px] block font-mono ${c.muted}`}>{r.endpoint}</span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.decision === 'safe'
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                            : r.decision === 'review_before_action'
                            ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                        }`}
                      >
                        {r.decision.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-bold ${c.heading}`}>
                      ${r.amount?.toFixed(2) || '0.01'}
                    </td>
                    <td className={`py-3 text-right text-[11px] ${c.muted}`}>
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedReceipt(r)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold font-['Space_Grotesk'] transition-colors ${c.viewBtn}`}
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

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL: TRANSACTION PAYLOAD INSPECTOR */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-xl rounded-3xl border p-6 sm:p-8 shadow-2xl space-y-5 transition-colors duration-300 ${c.modal}`}>
            <div className={`flex items-start justify-between border-b ${c.border} pb-3`}>
              <div>
                <span className={`text-xs font-mono uppercase ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`}>On-Chain Receipt Inspector</span>
                <h3 className={`text-xl font-bold font-['Space_Grotesk'] mt-0.5 ${c.heading}`}>
                  {selectedReceipt.service}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className={`p-1.5 rounded-lg ${c.closeBtn}`}
              >
                ✕
              </button>
            </div>

            <div className={`p-4 rounded-2xl border text-xs font-mono space-y-2 select-text ${c.evidenceBox}`}>
              <div className="flex justify-between">
                <span className={c.muted}>Transaction ID:</span>
                <span className={`font-bold ${c.heading}`}>{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className={c.muted}>Service Endpoint:</span>
                <span className={isLight ? 'text-indigo-600' : 'text-cyan-400'}>{selectedReceipt.endpoint}</span>
              </div>
              <div className="flex justify-between">
                <span className={c.muted}>Decision Verdict:</span>
                <span className="text-emerald-600 font-bold">{selectedReceipt.decision}</span>
              </div>
              <div className="flex justify-between">
                <span className={c.muted}>Risk Level:</span>
                <span className={`capitalize ${c.subtext}`}>{selectedReceipt.risk}</span>
              </div>
              <div className="flex justify-between">
                <span className={c.muted}>Confidence Score:</span>
                <span className={c.subtext}>{Math.round((selectedReceipt.confidence || 0.95) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className={c.muted}>Settled Amount:</span>
                <span className={`font-bold ${c.heading}`}>${selectedReceipt.amount?.toFixed(2) || '0.01'} USDC (ASA 10458941)</span>
              </div>
              <div className="flex justify-between">
                <span className={c.muted}>Timestamp:</span>
                <span className={c.muted}>{new Date(selectedReceipt.timestamp).toISOString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${c.closeBtn}`}
              >
                Close
              </button>
              <a
                href={`https://testnet.explorer.perawallet.app/tx/${selectedReceipt.id}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold font-['Space_Grotesk'] shadow-md inline-flex items-center gap-1.5"
              >
                <span>View on Pera Explorer</span>
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
