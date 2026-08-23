import React, { useState, useEffect } from 'react'
import { VerificationReceipt, fetchProfileData } from '../utils/auth'
import { Activity, ArrowUpRight, WalletCards } from 'lucide-react'

interface AgentBondTransactionsProps {
  activeAddress: string | null
  username?: string
  onOpenWalletModal?: () => void
}

export const AgentBondTransactions: React.FC<AgentBondTransactionsProps> = ({
  activeAddress,
  username,
}) => {
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

  return (
    <div className="w-full text-[#1B133C] font-['Inter',sans-serif] space-y-8 pb-20 max-w-7xl mx-auto px-4 pt-4">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* PAGE SCENARIO BANNER: TRANSACTIONS & AUDIT */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#1B133C]/10 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] text-xs font-medium text-[#1B133C]">
            <div className="w-4 h-4 rounded-md bg-[#F97316] flex items-center justify-center text-white font-bold text-[10px]">
              A
            </div>
            <span>Immutable Algorand Ledger & Cryptographic Verification Proofs</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Block Finality: 3.3s Instant</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl md:text-5xl font-normal text-[#1B133C] tracking-tight">
              Protocol Transactions & Verification Audit
            </h1>
            <p className="text-xs sm:text-sm text-[#1B133C]/70 max-w-2xl leading-relaxed">
              Explore real-time transaction blocks, x402 micro-settlements, outcome verification hash proofs, and credit line changes on Algorand TestNet.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] text-xs font-mono text-[#1B133C]">
              Total Receipts: <span className="font-bold text-[#1B133C]">{displayReceipts.length}</span>
            </div>
          </div>
        </div>

        {/* Quick Scenario Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#1B133C]/5 text-[11px] text-[#1B133C]/75">
          <span className="font-semibold text-[#1B133C]">Scenario Reference:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Sub-Second Finality</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Verifiable Artifact Hashes</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">USDC Transaction Explorer</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Zero Data Tampering</span>
        </div>
      </div>

      {/* TRANSACTION PAGE SUMMARY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-3xl border border-[#1B133C]/10 bg-white p-6 shadow-sm overflow-hidden relative">
          <div className="relative flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#1B133C]/60">
                <Activity size={13} className="text-[#F97316]" />
                Settlement Velocity
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1B133C] mt-2">USDC Activity This Week</h2>
              <p className="text-xs text-[#1B133C]/60 mt-1">Paid verification calls and settled x402 receipts.</p>
            </div>
            <span className="px-3 py-1.5 rounded-full border border-[#1B133C]/10 bg-[#F5F5F5] text-[10px] font-mono text-[#1B133C]">7D / TESTNET</span>
          </div>
          <div className="relative h-44 flex items-end gap-2 sm:gap-4 border-b border-dashed border-[#1B133C]/20 px-2 pb-0">
            {[32, 48, 28, 62, 45, 76, 58].map((height, index) => (
              <div key={index} className="flex-1 h-full flex items-end group">
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-slate-200 via-indigo-200 to-[#1B133C] transition-all duration-300 group-hover:from-indigo-400 group-hover:to-[#1B133C]"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-mono mt-3 text-[#1B133C]/60">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => <span key={day}>{day}</span>)}
          </div>
        </div>

        <div className="rounded-3xl border border-[#1B133C]/10 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#1B133C]/60">
              <WalletCards size={13} className="text-[#F97316]" />
              Active Wallet
            </div>
            <ArrowUpRight size={16} className="text-[#1B133C]/40" />
          </div>
          <div className="mt-8">
            <div className="text-4xl font-semibold tracking-tight text-[#1B133C]">{displayReceipts.length}</div>
            <div className="text-xs text-[#1B133C]/60 mt-1">receipts in this view</div>
          </div>
          <div className="mt-8 p-3 rounded-2xl border border-[#1B133C]/10 bg-[#F5F5F5] font-mono text-[11px]">
            <div className="uppercase text-[9px] tracking-widest text-[#1B133C]/60">Connected Operator</div>
            <div className={`truncate mt-1 ${activeAddress ? 'text-[#1B133C] font-semibold' : 'text-[#1B133C]/40'}`}>
              {username ? `@${username}` : activeAddress ? `${activeAddress.slice(0, 8)}...${activeAddress.slice(-6)}` : 'Connect wallet to view private receipts'}
            </div>
            {activeAddress && (
              <div className="truncate text-[10px] text-[#1B133C]/50 mt-0.5">
                {activeAddress.slice(0, 10)}...{activeAddress.slice(-6)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="p-6 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1B133C]/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#1B133C]">
              On-Chain Verification Receipts
            </h3>
            <p className="text-xs text-[#1B133C]/60 mt-0.5">
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
                  receiptFilter === f
                    ? 'bg-[#1B133C] text-white font-bold'
                    : 'text-[#1B133C]/70 hover:text-[#1B133C]'
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
              <tr className="border-b border-[#1B133C]/10 text-[10px] uppercase text-[#1B133C]/60">
                <th className="pb-3 font-semibold">Receipt / Tx Hash</th>
                <th className="pb-3 font-semibold">Service / Endpoint</th>
                <th className="pb-3 font-semibold">Outcome Decision</th>
                <th className="pb-3 font-semibold text-right">Amount (USDC)</th>
                <th className="pb-3 font-semibold text-right">Timestamp</th>
                <th className="pb-3 font-semibold text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B133C]/10 text-[#1B133C]">
              {filteredReceipts.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-slate-50">
                  <td className="py-3 font-bold flex items-center gap-2 text-[#1B133C]">
                    <span>{r.txHash || r.id}</span>
                    <button
                      onClick={() => handleCopy(r.txHash || r.id)}
                      className="text-[10px] text-[#1B133C]/50 hover:text-[#1B133C] cursor-pointer"
                    >
                      {copiedText === (r.txHash || r.id) ? 'Copied!' : 'Copy'}
                    </button>
                  </td>
                  <td className="py-3 text-[#1B133C]">{r.service}</td>
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
                  <td className="py-3 text-right text-emerald-700 font-bold">
                    ${r.amountUsdc || '0.01'}
                  </td>
                  <td className="py-3 text-right text-[#1B133C]/60">
                    {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => setSelectedReceipt(r)}
                      className="px-2.5 py-1 rounded-lg text-[10px] bg-[#F5F5F5] hover:bg-slate-200 text-[#1B133C] transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B133C]/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[#1B133C]/10 bg-white p-6 space-y-4 shadow-2xl text-[#1B133C]">
            <div className="flex items-center justify-between border-b border-[#1B133C]/10 pb-3">
              <h3 className="text-base font-bold text-[#1B133C]">
                Verification Proof Receipt
              </h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-sm text-[#1B133C]/60 hover:text-rose-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono text-[#1B133C]">
              <div>
                <span className="block text-[10px] text-[#1B133C]/60">Receipt ID</span>
                <span className="font-bold text-[#1B133C]">{selectedReceipt.id}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[#1B133C]/60">Service Endpoint</span>
                <span className="text-[#1B133C]">{selectedReceipt.service}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[#1B133C]/60">On-Chain Tx Hash</span>
                <span className="break-all text-[#1B133C]">{selectedReceipt.txHash}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[#1B133C]/60">Evidence Log</span>
                <div className="p-3 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] space-y-1 mt-1">
                  {selectedReceipt.evidence?.map((ev, i) => (
                    <div key={i}>• {ev}</div>
                  )) || <div>• Verified outcome pass</div>}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F5F5F5] hover:bg-slate-200 text-[#1B133C] transition-colors cursor-pointer"
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

export default AgentBondTransactions
