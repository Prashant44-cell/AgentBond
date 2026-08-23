import React, { useState, useEffect } from 'react'

interface AgentRequestPortalProps {
  activeAddress: string | null
  onOpenWalletModal: () => void
}

interface SubmittedRequest {
  timestamp: string
  requestId: string
  agentName: string
  workflowRisk: string
  verificationChecks: string
  proposedFeeUsdc: string
  organization: string
  walletAddress: string
  contactEmail: string
  status: string
}

export const AgentRequestPortal: React.FC<AgentRequestPortalProps> = ({
  activeAddress,
  onOpenWalletModal,
}) => {
  const [agentName, setAgentName] = useState<string>('')
  const [workflowRisk, setWorkflowRisk] = useState<string>('')
  const [verificationChecks, setVerificationChecks] = useState<string>('')
  const [proposedFeeUsdc, setProposedFeeUsdc] = useState<string>('0.01')
  const [organization, setOrganization] = useState<string>('')
  const [contactEmail, setContactEmail] = useState<string>('')

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [recentRequests, setRecentRequests] = useState<SubmittedRequest[]>([])

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/agent-requests`)
      if (res.ok) {
        const data = await res.json()
        setRecentRequests(data.requests || [])
      }
    } catch (err) {
      console.warn('Could not fetch agent requests:', err)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [apiBaseUrl])

  const handleApplyPreset = (preset: {
    name: string
    risk: string
    checks: string
    fee: string
  }) => {
    setAgentName(preset.name)
    setWorkflowRisk(preset.risk)
    setVerificationChecks(preset.checks)
    setProposedFeeUsdc(preset.fee)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitSuccess(null)
    setSubmitError(null)

    try {
      const payload = {
        agentName: agentName.trim(),
        workflowRisk: workflowRisk.trim(),
        verificationChecks: verificationChecks.trim(),
        proposedFeeUsdc: proposedFeeUsdc.trim() || '0.01',
        organization: organization.trim() || 'Community Developer',
        walletAddress: activeAddress || 'Anonymous / Unconnected',
        contactEmail: contactEmail.trim() || 'N/A',
      }

      const res = await fetch(`${apiBaseUrl}/api/agent-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to submit agent request')
      }

      const data = await res.json()
      setSubmitSuccess(`✅ Request ${data.requestId} successfully logged to backend Excel database!`)
      setAgentName('')
      setWorkflowRisk('')
      setVerificationChecks('')
      setOrganization('')
      setContactEmail('')
      await fetchRequests()
    } catch (err) {
      setSubmitError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const REQUEST_PRESETS = [
    {
      label: 'Treasury Multi-Sig Guard',
      name: 'Treasury Multi-Sig Approval Guard',
      risk: 'Autonomous treasury agent approving large USDC transfers above $50,000 threshold.',
      checks: 'Validates destination address age, multi-sig quorum signatures, and daily treasury spending velocity.',
      fee: '0.05',
    },
    {
      label: 'Vendor Onboarding KYC Auditor',
      name: 'Vendor Onboarding & Tax ID Auditor',
      risk: 'Procurement agent onboarding new suppliers and entering routing details into ERP.',
      checks: 'Verifies VAT/Tax ID against government registry, checks OFAC sanctions, and flags shell company registrations.',
      fee: '0.02',
    },
    {
      label: 'Payroll Batch Anomaly Detector',
      name: 'Autonomous Payroll Verification Agent',
      risk: 'Automated agent executing end-of-month employee wage disbursements.',
      checks: 'Scans for duplicate bank routing numbers, sudden 50%+ wage spikes, and ghost employee payroll entries.',
      fee: '0.01',
    },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">🤖</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Request a Custom AI Verification Agent
              </h2>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                Excel Logged
              </span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Need a custom verification engine for your company’s autonomous workflows? Submit your specification below. All requests are automatically parsed and structured directly into our backend Excel database for rapid engineering deployment.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Connected Submitter</span>
            <span className="text-xs font-mono text-cyan-300 font-bold">
              {activeAddress ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'Guest Submitter'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Request Form & Specification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Submission Form */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Quick Presets */}
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-2">
              ⚡ 1-Click Request Templates
            </span>
            <div className="flex flex-wrap gap-2">
              {REQUEST_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 transition-colors"
                >
                  ⚡ {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Proposed Agent Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Treasury Multi-Sig Guard"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Proposed Micro-Fee (USDC per check)
                </label>
                <input
                  type="text"
                  placeholder="0.01"
                  value={proposedFeeUsdc}
                  onChange={(e) => setProposedFeeUsdc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Workflow & Irreversible Risk Scenario <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe what action the AI agent is performing and what risks need pre-action verification (e.g. vendor payment, contract signing, booking)..."
                value={workflowRisk}
                onChange={(e) => setWorkflowRisk(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Required Verification Checks & Heuristics
              </label>
              <textarea
                rows={2}
                placeholder="Specific fraud flags, domain checks, or models required..."
                value={verificationChecks}
                onChange={(e) => setVerificationChecks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Organization / Team (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp Treasury Team"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Email (optional)
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {submitSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <span>{submitSuccess}</span>
                <button type="button" onClick={() => setSubmitSuccess(null)} className="text-emerald-400">✕</button>
              </div>
            )}

            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <span>⚠️ {submitError}</span>
                <button type="button" onClick={() => setSubmitError(null)} className="text-rose-400">✕</button>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                All requests append to <code className="text-cyan-400 font-mono">agent_requests.csv</code>
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/20 font-bold px-6"
              >
                {isSubmitting ? 'Recording Specification...' : '📥 Submit Agent Specification'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Excel Database Status & Architecture */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-bold text-sm flex items-center gap-2">
                <span>📊</span> Excel Backend Schema
              </h4>
              <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Active Sync
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every submission writes structured rows with deterministic cryptographic request IDs into the server’s backend Excel repository.
            </p>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-[11px] font-mono text-slate-400">
              <div className="text-cyan-300 font-semibold uppercase text-[10px]">Excel File Columns:</div>
              <div className="space-y-1">
                <div>• Timestamp (ISO 8601)</div>
                <div>• RequestID (REQ-XXXX)</div>
                <div>• AgentName</div>
                <div>• WorkflowRisk</div>
                <div>• VerificationChecks</div>
                <div>• ProposedFeeUSDC</div>
                <div>• Organization</div>
                <div>• WalletAddress</div>
                <div>• Status</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Logged Requests Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <span>📋</span> Logged Custom Agent Specifications ({recentRequests.length})
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Live from server database
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                <th className="py-2.5 px-3">Request ID</th>
                <th className="py-2.5 px-3">Agent Name</th>
                <th className="py-2.5 px-3">Workflow Risk Description</th>
                <th className="py-2.5 px-3">Proposed Fee</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {recentRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                    No custom agent requests logged yet. Use the form above to submit your first specification!
                  </td>
                </tr>
              ) : (
                recentRequests.map((req, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-cyan-400 font-bold">{req.requestId}</td>
                    <td className="py-3 px-3 font-semibold text-white font-sans">{req.agentName}</td>
                    <td className="py-3 px-3 text-slate-300 font-sans max-w-xs truncate">{req.workflowRisk}</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">${req.proposedFeeUsdc} USDC</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] text-right font-mono">
                      {new Date(req.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AgentRequestPortal
