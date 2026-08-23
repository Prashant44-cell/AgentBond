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

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'AAA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'AA':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      case 'A':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'BBB':
        return 'bg-amber-50 text-amber-800 border-amber-200'
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 780) return 'text-emerald-600'
    if (score >= 720) return 'text-cyan-600'
    if (score >= 650) return 'text-indigo-600'
    if (score >= 580) return 'text-amber-600'
    return 'text-rose-600'
  }

  return (
    <div className="w-full text-[#1B133C] font-['Inter',sans-serif] space-y-8 pb-20 max-w-7xl mx-auto px-4 pt-4">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* PAGE SCENARIO BANNER: CREDIT BUREAU */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#1B133C]/10 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] text-xs font-medium text-[#1B133C]">
            <div className="w-4 h-4 rounded-md bg-[#F97316] flex items-center justify-center text-white font-bold text-[10px]">
              A
            </div>
            <span>Fleet Verification & Autonomous Credit Registry</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Algorand TestNet Sync: Active</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl md:text-5xl font-normal text-[#1B133C] tracking-tight">
              Autonomous Agent Credit Bureau
            </h1>
            <p className="text-xs sm:text-sm text-[#1B133C]/70 max-w-2xl leading-relaxed">
              Live credit scoring, outcome verification metrics, and borrowing limits for registered autonomous AI agents on Algorand. Limits increase strictly through verifiable task quality.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white text-xs font-semibold font-['Inter'] flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Register New Agent</span>
            </button>
            <button
              onClick={loadBureauData}
              className="p-2.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] hover:bg-white text-[#1B133C] transition-all cursor-pointer shadow-xs"
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

        {/* Quick Scenario Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#1B133C]/5 text-[11px] text-[#1B133C]/75">
          <span className="font-semibold text-[#1B133C]">Scenario Reference:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">142 Registered Fleets</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">$842,500 Total Limit</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">99.4% Verified Pass Rate</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Multi-Factor Underwriting (300-850)</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SEARCH & FILTERS BAR */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl border border-[#1B133C]/10 bg-white shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <svg
            className="w-4 h-4 text-[#1B133C]/40 absolute left-3.5 top-1/2 -translate-y-1/2"
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
            className="w-full pl-10 pr-4 py-2 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-xl text-xs text-[#1B133C] placeholder-[#1B133C]/40 focus:outline-none focus:border-[#1B133C]/30 font-mono"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-xl text-xs text-[#1B133C] focus:outline-none focus:border-[#1B133C]/30 font-medium"
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
            className="px-3 py-2 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-xl text-xs text-[#1B133C] focus:outline-none focus:border-[#1B133C]/30 font-medium"
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
        <div className="p-12 text-center text-[#1B133C]/60 font-mono text-xs flex items-center justify-center gap-3 bg-white rounded-3xl border border-[#1B133C]/10">
          <span className="w-4 h-4 border-2 border-[#1B133C] border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing AgentBond Credit Bureau on Algorand...</span>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="p-12 text-center border border-[#1B133C]/10 rounded-3xl bg-white text-[#1B133C]/60">
          <p className="text-sm font-semibold text-[#1B133C]">No AI Agents found matching filter criteria.</p>
          <p className="text-xs text-[#1B133C]/60 mt-1">Try broadening your search query or clear filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => (
            <div
              key={agent.agentId}
              className="p-5 rounded-2xl border border-[#1B133C]/10 bg-white hover:border-[#1B133C]/20 transition-all flex flex-col justify-between space-y-4 relative group shadow-xs hover:shadow-md"
            >
              {/* Top Row: Avatar, Name, Tier Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1B133C] text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1B133C] group-hover:text-[#F97316] transition-colors">
                      {agent.name}
                    </h3>
                    <div className="text-[11px] font-mono text-[#1B133C]/60 flex items-center gap-1.5 mt-0.5">
                      <span className="capitalize">{agent.category}</span>
                      <span>•</span>
                      <span>{agent.runtimeVersion}</span>
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border ${getTierBadge(agent.riskTier)}`}>
                  {agent.riskTier}
                </span>
              </div>

              {/* Credit Score & Line Stats Box */}
              <div className="p-3.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-[#1B133C]/60 uppercase font-mono">Credit Score</div>
                  <div className={`text-xl font-bold font-mono ${getScoreColor(agent.creditScore)}`}>
                    {agent.creditScore}
                  </div>
                  <div className="text-[9px] text-[#1B133C]/50 font-mono">300 - 850</div>
                </div>

                <div className="border-x border-[#1B133C]/10">
                  <div className="text-[10px] text-[#1B133C]/60 uppercase font-mono">Credit Line</div>
                  <div className="text-xl font-bold text-[#1B133C] font-mono">
                    ${agent.totalCreditLineUsdc}
                  </div>
                  <div className="text-[9px] text-[#1B133C]/60 font-mono">Max/Draw: ${agent.maxPerTaskDrawUsdc}</div>
                </div>

                <div>
                  <div className="text-[10px] text-[#1B133C]/60 uppercase font-mono">Available</div>
                  <div className="text-xl font-bold text-emerald-700 font-mono">
                    ${agent.availableCreditUsdc}
                  </div>
                  <div className="text-[9px] text-emerald-600 font-mono">Active: {agent.metrics.activeObligationsCount}</div>
                </div>
              </div>

              {/* Verified Outcome Quality & Repayment Meters */}
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-[#1B133C]/70 mb-1">
                    <span>Verified Task Quality</span>
                    <span className="font-mono text-[#1B133C] font-bold">
                      {Math.round(agent.metrics.verifiedTaskQualityScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1B133C]/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-[#F97316] rounded-full"
                      style={{ width: `${Math.round(agent.metrics.verifiedTaskQualityScore * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#1B133C]/70 mb-1">
                    <span>Repayment Reliability</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {Math.round(agent.metrics.repaymentReliabilityRate * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1B133C]/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.round(agent.metrics.repaymentReliabilityRate * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Wallet Address & Sponsor Bond Pill */}
              <div className="pt-2 border-t border-[#1B133C]/10 flex items-center justify-between text-[10px] font-mono text-[#1B133C]/60">
                <span className="truncate max-w-[140px]" title={agent.walletAddress}>
                  {agent.walletAddress.slice(0, 6)}...{agent.walletAddress.slice(-4)}
                </span>
                <span className="text-[#1B133C] font-semibold bg-[#F5F5F5] px-1.5 py-0.5 rounded border border-[#1B133C]/10">
                  Bond: ${agent.sponsorStakeUsdc || 20} USDC
                </span>
                <span>{agent.metrics.totalDrawsCount} draws</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedAgentDossier(agent)}
                  className="flex-1 py-2 rounded-xl border border-[#1B133C]/15 bg-[#F5F5F5] hover:bg-[#1B133C]/5 text-[#1B133C] text-xs font-semibold transition-all cursor-pointer"
                >
                  View Full Dossier
                </button>
                {onSelectAgentForSim && (
                  <button
                    onClick={() => onSelectAgentForSim(agent.agentId)}
                    className="px-3 py-2 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white text-xs font-semibold transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B133C]/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-[#1B133C]/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-[#1B133C]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#1B133C]/10 pb-4">
              <div>
                <div className="text-xs font-mono text-[#F97316] uppercase font-semibold">Agent Credit Dossier</div>
                <h2 className="text-2xl font-bold text-[#1B133C] mt-0.5">
                  {selectedAgentDossier.name}
                </h2>
                <div className="text-xs font-mono text-[#1B133C]/60 mt-1">
                  ID: {selectedAgentDossier.agentId} | Framework: {selectedAgentDossier.runtimeVersion}
                </div>
              </div>
              <button
                onClick={() => setSelectedAgentDossier(null)}
                className="p-2 rounded-lg bg-[#F5F5F5] hover:bg-slate-200 text-[#1B133C] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Score & Risk Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#F5F5F5] border border-[#1B133C]/10 text-center font-mono">
              <div>
                <div className="text-[10px] text-[#1B133C]/60 uppercase">Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(selectedAgentDossier.creditScore)}`}>
                  {selectedAgentDossier.creditScore}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#1B133C]/60 uppercase">Risk Tier</div>
                <div className="text-2xl font-bold text-[#1B133C]">
                  {selectedAgentDossier.riskTier}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#1B133C]/60 uppercase">Credit Line</div>
                <div className="text-2xl font-bold text-[#1B133C]">
                  ${selectedAgentDossier.totalCreditLineUsdc}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#1B133C]/60 uppercase">Default Risk</div>
                <div className="text-2xl font-bold text-emerald-700">
                  {(selectedAgentDossier.defaultProbability * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 5-Factor Underwriting Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1B133C]">
                Multi-Factor Underwriting Weightage
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F5F5F5] border border-[#1B133C]/10 space-y-1">
                  <div className="flex justify-between text-[#1B133C]/70">
                    <span>Repayment Reliability (40%)</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {(selectedAgentDossier.metrics.repaymentReliabilityRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-[#1B133C]/60">
                    Total Repaid: ${selectedAgentDossier.metrics.totalRepaidUsdc} USDC
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F5F5] border border-[#1B133C]/10 space-y-1">
                  <div className="flex justify-between text-[#1B133C]/70">
                    <span>Verified Task Quality (25%)</span>
                    <span className="font-mono text-[#F97316] font-bold">
                      {(selectedAgentDossier.metrics.verifiedTaskQualityScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-[#1B133C]/60">
                    Automated unit tests & factual citations
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F5F5] border border-[#1B133C]/10 space-y-1">
                  <div className="flex justify-between text-[#1B133C]/70">
                    <span>Identity Continuity (15%)</span>
                    <span className="font-mono text-indigo-700 font-bold">
                      {selectedAgentDossier.metrics.identityContinuityMonths} months
                    </span>
                  </div>
                  <div className="text-[11px] text-[#1B133C]/60">
                    Algorand wallet age & sponsor bonding
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F5F5] border border-[#1B133C]/10 space-y-1">
                  <div className="flex justify-between text-[#1B133C]/70">
                    <span>Policy Compliance (10%)</span>
                    <span className="font-mono text-[#1B133C] font-bold">
                      {(selectedAgentDossier.metrics.policyComplianceRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-[#1B133C]/60">
                    Zero PII leaks & injection security
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Addresses */}
            <div className="p-4 rounded-xl bg-[#F5F5F5] border border-[#1B133C]/10 text-xs font-mono space-y-2">
              <div>
                <span className="text-[#1B133C]/60 block text-[10px] uppercase">Agent Algorand Wallet Address:</span>
                <span className="text-[#1B133C] font-semibold break-all">{selectedAgentDossier.walletAddress}</span>
              </div>
              <div>
                <span className="text-[#1B133C]/60 block text-[10px] uppercase">Sponsor / Operator Address:</span>
                <span className="text-[#1B133C] font-semibold break-all">{selectedAgentDossier.sponsorAddress}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedAgentDossier(null)}
                className="px-5 py-2.5 rounded-xl bg-[#F5F5F5] hover:bg-slate-200 text-[#1B133C] text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              {onSelectAgentForSim && (
                <button
                  onClick={() => {
                    onSelectAgentForSim(selectedAgentDossier.agentId)
                    setSelectedAgentDossier(null)
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white font-bold text-xs shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B133C]/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-[#1B133C]/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-[#1B133C]">
            <div className="flex items-start justify-between border-b border-[#1B133C]/10 pb-3">
              <div>
                <h2 className="text-xl font-bold text-[#1B133C]">
                  Register Autonomous Agent
                </h2>
                <p className="text-xs text-[#1B133C]/60 mt-0.5">
                  Underwrite and issue an initial outcome-backed credit line on AgentBond.
                </p>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1.5 rounded-lg bg-[#F5F5F5] hover:bg-slate-200 text-[#1B133C] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {regSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
                {regSuccessMsg}
              </div>
            )}

            {regError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#1B133C] font-medium mb-1">Agent Name *</label>
                <input
                  type="text"
                  placeholder="e.g. SentryAudit-Bot"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-xl text-[#1B133C] focus:outline-none focus:border-[#1B133C]/40"
                  required
                />
              </div>

              <div>
                <label className="block text-[#1B133C] font-medium mb-1">Agent Category *</label>
                <select
                  value={regForm.category}
                  onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-xl text-[#1B133C] focus:outline-none focus:border-[#1B133C]/40"
                >
                  <option value="research">Research & Citations</option>
                  <option value="coding">Code Patch & Test Automation</option>
                  <option value="data">Data Scraper & Extraction</option>
                  <option value="devops">DevOps & Cloud Sentry</option>
                  <option value="finance">Algorithmic Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-[#1B133C] font-medium mb-1">Agent Algorand Wallet Address *</label>
                <input
                  type="text"
                  placeholder="58-character Algorand TestNet address"
                  value={regForm.walletAddress}
                  onChange={(e) => setRegForm({ ...regForm, walletAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-xl text-[#1B133C] focus:outline-none focus:border-[#1B133C]/40"
                  required
                />
              </div>

              <div>
                <label className="block text-[#1B133C] font-medium mb-1">Sponsor / Operator Address (Optional)</label>
                <input
                  type="text"
                  placeholder="Defaults to Agent Wallet if empty"
                  value={regForm.sponsorAddress}
                  onChange={(e) => setRegForm({ ...regForm, sponsorAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-xl text-[#1B133C] focus:outline-none focus:border-[#1B133C]/40"
                />
              </div>

              <div>
                <label className="block text-[#1B133C] font-medium mb-1">Runtime Framework</label>
                <input
                  type="text"
                  placeholder="e.g. LangChain-v0.2, AutoGPT, CrewAI"
                  value={regForm.runtimeVersion}
                  onChange={(e) => setRegForm({ ...regForm, runtimeVersion: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-xl text-[#1B133C] focus:outline-none focus:border-[#1B133C]/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F5F5F5] text-[#1B133C] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="px-6 py-2 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
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
