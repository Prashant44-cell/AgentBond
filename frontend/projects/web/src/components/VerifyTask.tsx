import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { verifyAgentTask, evaluateTaskLocally, VerifyTaskResponse } from '../utils/api'

interface AgentBondVerifyProps {
  onOpenWalletModal: () => void
}

const PRESETS = [
  {
    id: 'invoice',
    title: '🧾 Invoice Risk',
    expectedBadge: 'High Risk • Suspicious',
    task: 'Should I pay this invoice?',
    content: 'Vendor says bank details changed today. Payment is urgent. Sender email domain does not match company name.',
    sourceUrl: 'https://vendor-invoices.xyz/pay/88392',
  },
  {
    id: 'seller',
    title: '🛍️ Product Seller Risk',
    expectedBadge: 'High Risk • Suspicious',
    task: 'Should the agent buy this product?',
    content: '90% discount, no seller address, no refund terms, external payment requested.',
    sourceUrl: 'https://cheap-deals-liquidation.top/item/4090',
  },
  {
    id: 'policy',
    title: '📜 Cancellation Policy Risk',
    expectedBadge: 'Medium Risk • Review Before Action',
    task: 'Can the agent accept this policy?',
    content: 'Cancellation allowed only within 2 hours. 40% hidden restocking fee applies.',
    sourceUrl: 'https://enterprise-saas.com/terms/section-4',
  },
]

export const AgentBondVerify: React.FC<AgentBondVerifyProps> = ({ onOpenWalletModal }) => {
  const { activeAddress, signTransactions } = useWallet()

  const [task, setTask] = useState<string>(PRESETS[0].task)
  const [content, setContent] = useState<string>(PRESETS[0].content)
  const [sourceUrl, setSourceUrl] = useState<string>(PRESETS[0].sourceUrl)
  const [activePreset, setActivePreset] = useState<string>('invoice')

  const [loading, setLoading] = useState<boolean>(false)
  const [paymentStep, setPaymentStep] = useState<string>('')
  const [result, setResult] = useState<VerifyTaskResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [copiedJson, setCopiedJson] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual')

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.id)
    setTask(preset.task)
    setContent(preset.content)
    setSourceUrl(preset.sourceUrl)
    setError('')
  }

  // Real x402 on-chain payment verification
  const handleVerifyOnChain = async () => {
    if (!activeAddress) {
      onOpenWalletModal()
      return
    }

    if (!signTransactions) {
      setError('Connected wallet provider does not support transaction signing.')
      return
    }

    if (!task.trim()) {
      setError('Please enter a verification task query.')
      return
    }

    if (!content.trim()) {
      setError('Please provide content/text to verify.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setPaymentStep('1. Sending request & receiving x402 Payment Challenge...')

    try {
      const signer = {
        address: activeAddress,
        signTransactions: signTransactions,
      }

      setPaymentStep('2. Awaiting signature: Sign 0.01 USDC on Algorand TestNet...')

      const data = await verifyAgentTask(signer, {
        task: task.trim(),
        content: content.trim(),
        sourceUrl: sourceUrl.trim() || undefined,
      })

      setPaymentStep('3. Payment verified & inference analyzed!')
      setResult(data)
    } catch (err: any) {
      console.error('AgentBond verification error:', err)
      const message = err?.message || 'Verification request failed'
      if (message.includes('User rejected') || message.includes('cancelled') || message.includes('blocked')) {
        setError('Transaction was cancelled in the wallet. Payment was not completed.')
      } else if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        setError('Cannot reach AgentBond server at http://localhost:4021. Ensure the backend server is running.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
      setPaymentStep('')
    }
  }

  // Instant sandbox / evaluator mode (useful for testing & judges)
  const handleRunEvaluation = () => {
    if (!task.trim() || !content.trim()) {
      setError('Please provide both task and content.')
      return
    }
    setLoading(true)
    setError('')
    setTimeout(() => {
      const simulated = evaluateTaskLocally({
        task: task.trim(),
        content: content.trim(),
        sourceUrl: sourceUrl.trim() || undefined,
      })
      setResult(simulated)
      setLoading(false)
    }, 250)
  }

  const handleCopyJson = () => {
    if (!result) return
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Network & Service Banner */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20">
            ⚡
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-bold tracking-wide text-sm sm:text-base">AgentBond Verify Layer</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                x402 Protocol
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Network: <span className="text-slate-200 font-medium">Algorand TestNet</span> • Asset: <span className="text-emerald-400 font-medium">USDC ($0.01 / check)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activeAddress ? (
            <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-mono font-medium">
                {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="btn btn-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/25 font-semibold text-xs px-4"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Preset Selectors */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span>✨</span> One-Click Verification Presets
          </label>
          <span className="text-xs text-slate-400">Click any preset to populate</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              type="button"
              className={`text-left p-3.5 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
                activePreset === preset.id
                  ? 'bg-slate-800/90 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="font-semibold text-white text-sm flex items-center justify-between">
                <span>{preset.title}</span>
                {activePreset === preset.id && (
                  <span className="text-cyan-400 text-xs font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">{preset.expectedBadge}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Form Workspace */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Agent Decision Intent / Task
          </label>
          <input
            type="text"
            value={task}
            onChange={(e) => {
              setTask(e.target.value)
              setActivePreset('')
            }}
            placeholder="e.g. Should I pay this invoice? / Should the agent buy this product?"
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-medium"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Content / Data Payload to Scrutinize
            </label>
            <span className="text-xs text-slate-400 font-mono">{content.length} chars</span>
          </div>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              setActivePreset('')
            }}
            placeholder="Paste invoice text, product description, policy agreement, email body, or contract terms..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 text-slate-200 placeholder-slate-500 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-y"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Source Origin / Reference URL <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://example.com/invoice/123"
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2 text-slate-300 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
          />
        </div>

        {/* Action Buttons & Payment Status */}
        <div className="pt-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <button
              onClick={handleVerifyOnChain}
              disabled={loading || !task.trim() || !content.trim()}
              className="sm:col-span-8 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base tracking-wide shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  <span>Processing x402 Verification...</span>
                </>
              ) : (
                <>
                  <span>🛡️ Pay $0.01 USDC & Verify</span>
                  <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">
                    x402 Algorand
                  </span>
                </>
              )}
            </button>

            <button
              onClick={handleRunEvaluation}
              disabled={loading || !task.trim() || !content.trim()}
              className="sm:col-span-4 py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              title="Instant dry-run verification without wallet signature"
            >
              <span>⚡ Fast Dry-Run</span>
            </button>
          </div>

          {/* Payment Progress Message */}
          {paymentStep && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs flex items-center space-x-2 animate-fade-in">
              <span className="loading loading-spinner loading-xs text-cyan-400" />
              <span className="font-mono">{paymentStep}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start space-x-2.5">
              <span className="text-rose-400 text-base leading-none">⚠️</span>
              <div>
                <p className="font-semibold text-rose-300">Verification Request Error</p>
                <p className="mt-0.5 text-rose-200/90">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Result Section */}
      {result && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 animate-fade-in">
          {/* Header & Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-sm font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-white font-bold text-base sm:text-lg">Structured Verification Report</h3>
                <p className="text-slate-400 text-xs">
                  Service: <code className="text-cyan-400 font-mono">{result.service}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex text-xs">
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'visual'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Visual Report
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'json'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Agent JSON
                </button>
              </div>

              <button
                onClick={handleCopyJson}
                className="btn btn-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
              >
                {copiedJson ? '✓ Copied' : '📋 Copy JSON'}
              </button>
            </div>
          </div>

          {activeTab === 'visual' ? (
            <div className="space-y-4">
              {/* Decision & Risk Verdict Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
                  result.decision === 'safe'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : result.decision === 'suspicious'
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className="text-3xl">
                    {result.decision === 'safe' ? '🛡️' : result.decision === 'suspicious' ? '🚨' : '⚠️'}
                  </div>
                  <div>
                    <div className="text-xs uppercase font-bold tracking-wider opacity-80">
                      Decision Verdict
                    </div>
                    <div className="text-lg sm:text-xl font-extrabold uppercase tracking-wide">
                      {result.decision.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Risk Level</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-xs uppercase ${
                        result.risk === 'low'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : result.risk === 'high'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {result.risk} Risk
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Confidence</span>
                    <span className="font-bold text-white text-sm">
                      {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Executive Summary
                </h4>
                <p className="text-slate-200 text-sm leading-relaxed">{result.summary}</p>
              </div>

              {/* Evidence Points */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Identified Evidence & Signals ({result.evidence?.length || 0})
                </h4>
                <div className="space-y-2">
                  {result.evidence?.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-300">
                      <span className="text-cyan-400 font-bold leading-relaxed">•</span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Action */}
              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1 flex items-center gap-1.5">
                  <span>🤖</span> Recommended Autonomous Agent Action
                </h4>
                <p className="text-slate-200 text-xs sm:text-sm font-mono font-medium bg-slate-950/80 p-3 rounded-lg border border-slate-800 mt-2 text-indigo-100">
                  {result.recommendedAction}
                </p>
              </div>

              {/* Metadata Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 border-t border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <span>Model:</span>
                  <code className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-mono">
                    {result.modelUsed}
                  </code>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Payment:</span>
                  <span className="text-emerald-400 font-semibold">{result.paidVia}</span>
                </div>
                <div>
                  <span>Time: {new Date(result.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <pre className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto max-h-96">
                <code>{JSON.stringify(result, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AgentBondVerify
