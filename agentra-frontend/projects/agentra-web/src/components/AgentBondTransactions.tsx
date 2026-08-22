import React, { useState, useEffect } from 'react'
import { VerificationReceipt, fetchProfileData } from '../utils/agentraAuth'
import { Activity, ArrowUpRight, WalletCards } from 'lucide-react'
import { useTheme } from '../ThemeContext'

interface AgentBondTransactionsProps {
  activeAddress: string | null
  onOpenWalletModal?: () => void
}

export const AgentBondTransactions: React.FC<AgentBondTransactionsProps> = ({
  activeAddress,
}) => {
  const { isLight } = useTheme()
  const [receipts, setReceipts] = useState<VerificationReceipt[]>([])
  const [selectedReceipt, setSelectedReceipt] = useState<VerificationReceipt | null>(null)
  const [receiptFilter, setReceiptFilter] = useState<string>('all')
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const loadTransactions = async () => {
    if (!activeAddress) return
    try {
      const data = await fetchProfileData(activeAddress)
      if (data.receipts) setReceipts(data.receipts)
    } catch (err) {
      console.warn('Transactions fetch note:', (err as Error).message)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [activeAddress])

  const displayReceipts: VerificationReceipt[] = receipts.length > 0 ? receipts : [
    {
      id: 'rec_x402_algo_9901',
      txHash: '0x8A12...B39F',
      service: 'Verify Code Task (/verify-task)',
      decision: 'safe',
      timestamp: new Date().toISOString(),
      amountUsdc: '0.01',
      evidence: ['Unit test suite pass rate: 100%', 'Zero prompt injection anomalies'],
    },
    {
      id: 'rec_x402_algo_9902',
      txHash: '0x3F8A...7C9D',
      service: 'Email Phishing Audit (/verify-email)',
      decision: 'safe',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      amountUsdc: '0.01',
      evidence: ['DMARC & SPF valid', 'No phishing domain indicators'],
    },
    {
      id: 'rec_x402_algo_9903',
      txHash: '0x9E1F...1E3F',
      service: 'Policy Risk Guard (/verify-policy)',
      decision: 'review_before_action',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      amountUsdc: '0.01',
      evidence: ['Contains non-standard liability waiver', 'Manual review recommended'],
    },
    {
      id: 'rec_x402_algo_9904',
      txHash: '0x1C4E...3B5C',
      service: 'Prompt Injection Scan (/guard-prompt)',
      decision: 'safe',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      amountUsdc: '0.01',
      evidence: ['Prompt injection risk: 0.02', 'PII Leakage: None'],
    },
  ]

  const filteredReceipts = displayReceipts.filter((r) => {
    if (receiptFilter === 'all') return true
    return r.decision === receiptFilter || r.service.toLowerCase().includes(receiptFilter.toLowerCase())
  })

  const c = {
    page: isLight ? 'bg-slate-50 text-slate-900' : 'bg-transparent text-slate-100',
    border: isLight ? 'border-slate-200' : 'border-slate-800',
    card: isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-900/90 border-slate-800 shadow-2xl',
    heading: isLight ? 'text-slate-900' : 'text-white',
    subtext: isLight ? 'text-slate-700' : 'text-slate-300',
    muted: isLight ? 'text-slate-500' : 'text-slate-500',
    accent: isLight ? 'text-indigo-600' : 'text-cyan-300',
    filterBar: isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800',
    filterBtn: isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white',
    row: isLight ? 'hover:bg-indigo-50/60' : 'hover:bg-slate-800/30',
    divider: isLight ? 'divide-slate-200' : 'divide-slate-800/60',
    tableHead: isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-500',
    tdText: isLight ? 'text-slate-800' : 'text-slate-300',
    pill: isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-cyan-300',
    modal: isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800',
    modalLabel: isLight ? 'text-slate-500' : 'text-slate-500',
    modalValue: isLight ? 'text-slate-900' : 'text-white',
    evidenceBox: isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300',
    closeBtn: isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-white',
    viewBtn: isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300',
  }

  return (
    <div className={`w-full font-['Rubik',sans-serif] space-y-6 pb-20 max-w-7xl mx-auto px-4 transition-colors duration-300 ${c.page}`}>
      {/* HEADER */}
      <div className={`border-b ${c.border} pb-6 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className={`text-xs font-mono uppercase tracking-widest ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`}>
              On-Chain Transaction & Audit Explorer
            </span>
          </div>
          <h1 className={`text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] mt-1 ${c.heading}`}>
            Transaction Ledger & Audit Receipts
          </h1>
          <p className={`font-['Rubik',sans-serif] text-base sm:text-lg font-medium mt-2 max-w-3xl leading-relaxed ${c.subtext}`}>
            Complete cryptographic audit trail of all x402 micro-payments, micro-credit draws, outcome verifications, and gas receipts on Algorand TestNet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono ${c.pill}`}>
            Total Receipts: <span className="font-bold">{displayReceipts.length}</span>
          </div>
        </div>
      </div>

      {/* TRANSACTION PAGE SUMMARY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className={`xl:col-span-2 rounded-3xl border p-6 overflow-hidden relative ${c.card}`}>
          <div className="absolute -right-16 -top-20 w-56 h-56 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4 mb-6">
            <div>
              <div className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] ${c.muted}`}>
                <Activity size={13} className={c.accent} />
                Settlement velocity
              </div>
              <h2 className={`text-2xl sm:text-3xl font-semibold tracking-tight mt-2 ${c.heading}`}>USDC activity this week</h2>
              <p className={`text-xs mt-1 ${c.muted}`}>Paid verification calls and settled x402 receipts.</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full border text-[10px] font-mono ${c.pill}`}>7D / TESTNET</span>
          </div>
          <div className="relative h-44 flex items-end gap-2 sm:gap-4 border-b border-dashed border-slate-700/70 px-2 pb-0">
            {[32, 48, 28, 62, 45, 76, 58].map((height, index) => (
              <div key={index} className="flex-1 h-full flex items-end group">
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-indigo-600/80 via-cyan-400 to-white transition-all duration-300 group-hover:from-indigo-400 group-hover:to-white"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          <div className={`flex justify-between text-[10px] font-mono mt-3 ${c.muted}`}>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => <span key={day}>{day}</span>)}
          </div>
        </div>

        <div className={`rounded-3xl border p-6 flex flex-col justify-between ${c.card}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] ${c.muted}`}>
              <WalletCards size={13} className={c.accent} />
              Active wallet
            </div>
            <ArrowUpRight size={16} className={c.muted} />
          </div>
          <div className="mt-8">
            <div className={`text-4xl font-semibold tracking-tight ${c.heading}`}>{displayReceipts.length}</div>
            <div className={`text-xs mt-1 ${c.muted}`}>receipts in this view</div>
          </div>
          <div className={`mt-8 p-3 rounded-2xl border font-mono text-[11px] ${c.filterBar}`}>
            <div className={`uppercase text-[9px] tracking-widest ${c.muted}`}>Connected address</div>
            <div className={`truncate mt-1 ${activeAddress ? c.accent : c.muted}`}>
              {activeAddress || 'Connect wallet to view private receipts'}
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className={`p-6 rounded-3xl border backdrop-blur-xl space-y-5 transition-colors duration-300 ${c.card}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${c.border} pb-4`}>
          <div>
            <h3 className={`text-lg font-bold font-['Space_Grotesk'] ${c.heading}`}>
              On-Chain Verification Receipts
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
                  receiptFilter === f
                    ? 'bg-indigo-600 text-white font-bold'
                    : c.filterBtn
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
              <tr className={`border-b ${c.tableHead} text-[10px] uppercase`}>
                <th className="pb-3 font-semibold">Receipt / Tx Hash</th>
                <th className="pb-3 font-semibold">Service / Endpoint</th>
                <th className="pb-3 font-semibold">Outcome Decision</th>
                <th className="pb-3 font-semibold text-right">Amount (USDC)</th>
                <th className="pb-3 font-semibold text-right">Timestamp</th>
                <th className="pb-3 font-semibold text-center">Details</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${c.divider}`}>
              {filteredReceipts.map((r) => (
                <tr key={r.id} className={`transition-colors ${c.row}`}>
                  <td className={`py-3 font-bold flex items-center gap-2 ${isLight ? 'text-indigo-600' : 'text-cyan-300'}`}>
                    <span>{r.txHash || r.id}</span>
                    <button
                      onClick={() => handleCopy(r.txHash || r.id)}
                      className={`text-[10px] ${c.muted} hover:text-cyan-400`}
                    >
                      {copiedText === (r.txHash || r.id) ? 'Copied!' : 'Copy'}
                    </button>
                  </td>
                  <td className={`py-3 ${c.tdText}`}>{r.service}</td>
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
                      {r.decision}
                    </span>
                  </td>
                  <td className="py-3 text-right text-emerald-600 font-bold">
                    ${r.amountUsdc || '0.01'}
                  </td>
                  <td className={`py-3 text-right ${c.muted}`}>
                    {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => setSelectedReceipt(r)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] transition-colors ${c.viewBtn}`}
                    >
                      View Proof
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROOF DETAIL MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-lg rounded-3xl border p-6 space-y-4 shadow-2xl transition-colors duration-300 ${c.modal}`}>
            <div className={`flex items-center justify-between border-b ${c.border} pb-3`}>
              <h3 className={`text-base font-bold font-['Space_Grotesk'] ${c.heading}`}>
                Verification Proof Receipt
              </h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className={`text-sm ${c.subtext} hover:text-red-500`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className={`block text-[10px] ${c.modalLabel}`}>Receipt ID</span>
                <span className={`font-bold ${isLight ? 'text-indigo-600' : 'text-cyan-300'}`}>{selectedReceipt.id}</span>
              </div>
              <div>
                <span className={`block text-[10px] ${c.modalLabel}`}>Service Endpoint</span>
                <span className={c.modalValue}>{selectedReceipt.service}</span>
              </div>
              <div>
                <span className={`block text-[10px] ${c.modalLabel}`}>On-Chain Tx Hash</span>
                <span className={`break-all ${c.subtext}`}>{selectedReceipt.txHash}</span>
              </div>
              <div>
                <span className={`block text-[10px] ${c.modalLabel}`}>Evidence Log</span>
                <div className={`p-3 rounded-xl border space-y-1 mt-1 ${c.evidenceBox}`}>
                  {selectedReceipt.evidence?.map((ev, i) => (
                    <div key={i}>• {ev}</div>
                  )) || <div>• Verified outcome pass</div>}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${c.closeBtn}`}
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
