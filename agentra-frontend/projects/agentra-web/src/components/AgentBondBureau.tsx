import React, { useState, useEffect } from 'react'
import {
  AgentCreditProfile,
  fetchCreditBureau,
  registerAgent,
} from '../utils/agentbondCreditApi'

interface AgentBondBureauProps {
  onSelectAgentForSim?: (agentId: string) => void
  onOpenWalletModal: () => void
  activeAddress: string | null
}

export const AgentBondBureau: React.FC<AgentBondBureauProps> = ({
  onSelectAgentForSim,
  onOpenWalletModal,
  activeAddress,
}) => {
  const [agents, setAgents] = useState<AgentCreditProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [selectedAgentDossier, setSelectedAgentDossier] = useState<AgentCreditProfile | null>(null)

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [regForm, setRegForm] = useState({
    name: '',
    category: 'research',
    walletAddress: '',
    sponsorAddress: '',
    runtimeVersion: 'LangChain-v0.2',
  })
  const [regSubmitting, setRegSubmitting] = useState(false)
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null)
  const [regError, setRegError] = useState<string | null>(null)

  const loadBureauData = async () => {
    try {
      setLoading(true)
      const data = await fetchCreditBureau()
      if (data.success && data.agents) {
        setAgents(data.agents)
      }
    } catch (err) {
      console.error('Failed to load credit bureau data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBureauData()
  }, [])

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)
    setRegSuccessMsg(null)
    setRegSubmitting(true)

    try {
      if (!regForm.name || !regForm.walletAddress) {
        throw new Error('Agent Name and Algorand Wallet Address are required.')
      }

      const result = await registerAgent({
        name: regForm.name,
        category: regForm.category,
        walletAddress: regForm.walletAddress,
        sponsorAddress: regForm.sponsorAddress || regForm.walletAddress,
        runtimeVersion: regForm.runtimeVersion,
      })

      if (result.success) {
        setRegSuccessMsg(`Agent registered successfully! Initial Score: ${result.agent.creditScore} (${result.agent.riskTier})`)
        setRegForm({
          name: '',
          category: 'research',
          walletAddress: '',
          sponsorAddress: '',
          runtimeVersion: 'LangChain-v0.2',
        })
        await loadBureauData()
        setTimeout(() => {
          setIsRegisterOpen(false)
          setRegSuccessMsg(null)
        }, 2200)
      }
    } catch (err) {
      setRegError((err as Error).message)
    } finally {
      setRegSubmitting(false)
    }
  }

  const filteredAgents = agents.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.agentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory
    const matchesTier = selectedTier === 'all' || a.riskTier === selectedTier
    return matchesSearch && matchesCat && matchesTier
  })

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'AAA':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      case 'AA':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
      case 'A':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
      case 'BBB':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      default:
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 780) return 'text-emerald-400'
    if (score >= 720) return 'text-cyan-400'
    if (score >= 650) return 'text-indigo-400'
    if (score >= 580) return 'text-amber-400'
    return 'text-rose-400'
  }

  return (
    <div className="w-full text-slate-100 font-['Inter',sans-serif] space-y-8 pb-20 max-w-7xl mx-auto px-4">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* HEADER & TOP CONTROLS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Global Agent Registry</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-['Space_Grotesk'] mt-1">
            Agent Credit Bureau
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Live credit scores, outcome verifications, and borrowing limits for registered autonomous AI agents on Algorand.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold font-['Space_Grotesk'] flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Register New Agent</span>
          </button>
          <button
            onClick={loadBureauData}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            title="Refresh Bureau"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SEARCH & FILTERS BAR */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by Agent Name, ID, or Algorand address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-['Space_Grotesk']"
          >
            <option value="all">All Categories</option>
            <option value="research">Research</option>
            <option value="coding">Coding</option>
            <option value="data">Data Scraper</option>
            <option value="devops">DevOps Sentry</option>
            <option value="finance">Finance</option>
          </select>

          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-['Space_Grotesk']"
          >
            <option value="all">All Risk Tiers</option>
            <option value="AAA">Tier AAA (Prime)</option>
            <option value="AA">Tier AA</option>
            <option value="A">Tier A</option>
            <option value="BBB">Tier BBB</option>
            <option value="Subprime">Subprime</option>
          </select>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* AGENTS BUREAU TABLE / CARDS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-3">
          <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing AgentBond Credit Bureau on Algorand...</span>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/40 text-slate-400">
          <p className="text-sm font-semibold">No AI Agents found matching filter criteria.</p>
          <p className="text-xs text-slate-500 mt-1">Try broadening your search query or clear filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => (
            <div
              key={agent.agentId}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 relative group shadow-lg"
            >
              {/* Top Row: Avatar, Name, Tier Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-md">
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-['Space_Grotesk'] group-hover:text-cyan-300 transition-colors">
                      {agent.name}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="capitalize">{agent.category}</span>
                      <span>•</span>
                      <span className="text-slate-500">{agent.runtimeVersion}</span>
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border ${getTierColor(agent.riskTier)}`}>
                  {agent.riskTier}
                </span>
              </div>

              {/* Credit Score & Line Stats Box */}
              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/70 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Credit Score</div>
                  <div className={`text-xl font-bold font-mono ${getScoreColor(agent.creditScore)}`}>
                    {agent.creditScore}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">300 - 850</div>
                </div>

                <div className="border-x border-slate-800/80">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Credit Line</div>
                  <div className="text-xl font-bold text-white font-mono">
                    ${agent.totalCreditLineUsdc}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">Max/Draw: ${agent.maxPerTaskDrawUsdc}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Available</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono">
                    ${agent.availableCreditUsdc}
                  </div>
                  <div className="text-[9px] text-emerald-400 font-mono">Active: {agent.metrics.activeObligationsCount}</div>
                </div>
              </div>

              {/* Verified Outcome Quality & Repayment Meters */}
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Verified Task Quality</span>
                    <span className="font-mono text-cyan-400 font-semibold">
                      {Math.round(agent.metrics.verifiedTaskQualityScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                      style={{ width: `${Math.round(agent.metrics.verifiedTaskQualityScore * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Repayment Reliability</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {Math.round(agent.metrics.repaymentReliabilityRate * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.round(agent.metrics.repaymentReliabilityRate * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Wallet Address & Sponsor Bond Pill */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="truncate max-w-[140px]" title={agent.walletAddress}>
                  {agent.walletAddress.slice(0, 6)}...{agent.walletAddress.slice(-4)}
                </span>
                <span className="text-indigo-400 font-semibold bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/20">
                  Bond: ${agent.sponsorStakeUsdc || 20} USDC
                </span>
                <span>{agent.metrics.totalDrawsCount} draws</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedAgentDossier(agent)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold font-['Space_Grotesk'] transition-all"
                >
                  View Full Dossier
                </button>
                {onSelectAgentForSim && (
                  <button
                    onClick={() => onSelectAgentForSim(agent.agentId)}
                    className="px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold font-['Space_Grotesk'] transition-all"
                    title="Simulate credit draw for this agent"
                  >
                    Simulate Draw →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* AGENT CREDIT DOSSIER MODAL */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {selectedAgentDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-mono text-cyan-400 uppercase">Agent Credit Dossier</div>
                <h2 className="text-2xl font-bold text-white font-['Space_Grotesk'] mt-0.5">
                  {selectedAgentDossier.name}
                </h2>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  ID: {selectedAgentDossier.agentId} | Framework: {selectedAgentDossier.runtimeVersion}
                </div>
              </div>
              <button
                onClick={() => setSelectedAgentDossier(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Score & Risk Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(selectedAgentDossier.creditScore)}`}>
                  {selectedAgentDossier.creditScore}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Risk Tier</div>
                <div className="text-2xl font-bold text-white">
                  {selectedAgentDossier.riskTier}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Credit Line</div>
                <div className="text-2xl font-bold text-cyan-400">
                  ${selectedAgentDossier.totalCreditLineUsdc}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Default Risk</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {(selectedAgentDossier.defaultProbability * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 5-Factor Underwriting Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-200 font-['Space_Grotesk']">
                Multi-Factor Underwriting Weightage
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Repayment Reliability (40%)</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {(selectedAgentDossier.metrics.repaymentReliabilityRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Total Repaid: ${selectedAgentDossier.metrics.totalRepaidUsdc} USDC
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Verified Task Quality (25%)</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {(selectedAgentDossier.metrics.verifiedTaskQualityScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Automated unit tests & factual citations
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Identity Continuity (15%)</span>
                    <span className="font-mono text-purple-400 font-bold">
                      {selectedAgentDossier.metrics.identityContinuityMonths} months
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Algorand wallet age & sponsor bonding
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Policy Compliance (10%)</span>
                    <span className="font-mono text-indigo-400 font-bold">
                      {(selectedAgentDossier.metrics.policyComplianceRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Zero PII leaks & injection security
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Addresses */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Agent Algorand Wallet Address:</span>
                <span className="text-slate-200 break-all">{selectedAgentDossier.walletAddress}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Sponsor / Operator Address:</span>
                <span className="text-slate-200 break-all">{selectedAgentDossier.sponsorAddress}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedAgentDossier(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              {onSelectAgentForSim && (
                <button
                  onClick={() => {
                    onSelectAgentForSim(selectedAgentDossier.agentId)
                    setSelectedAgentDossier(null)
                  }}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-['Space_Grotesk'] shadow-md"
                >
                  Simulate Credit Draw →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* REGISTER NEW AGENT MODAL */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
                  Register Autonomous Agent
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Underwrite and issue an initial outcome-backed credit line on AgentBond.
                </p>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {regSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                {regSuccessMsg}
              </div>
            )}

            {regError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Agent Name *</label>
                <input
                  type="text"
                  placeholder="e.g. SentryAudit-Bot"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Agent Category *</label>
                <select
                  value={regForm.category}
                  onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="research">Research & Citations</option>
                  <option value="coding">Code Patch & Test Automation</option>
                  <option value="data">Data Scraper & Extraction</option>
                  <option value="devops">DevOps & Cloud Sentry</option>
                  <option value="finance">Algorithmic Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Agent Algorand Wallet Address *</label>
                <input
                  type="text"
                  placeholder="58-character Algorand TestNet address"
                  value={regForm.walletAddress}
                  onChange={(e) => setRegForm({ ...regForm, walletAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Sponsor / Operator Address (Optional)</label>
                <input
                  type="text"
                  placeholder="Defaults to Agent Wallet if empty"
                  value={regForm.sponsorAddress}
                  onChange={(e) => setRegForm({ ...regForm, sponsorAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Runtime Framework</label>
                <input
                  type="text"
                  placeholder="e.g. LangChain-v0.2, AutoGPT, CrewAI"
                  value={regForm.runtimeVersion}
                  onChange={(e) => setRegForm({ ...regForm, runtimeVersion: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {regSubmitting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Underwriting...</span>
                    </>
                  ) : (
                    <span>Register & Underwrite</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentBondBureau
