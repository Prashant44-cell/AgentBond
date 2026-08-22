import React, { useState, useEffect } from 'react'
import {
  AgentCreditProfile,
  fetchCreditBureau,
  drawCredit,
  verifyOutcome,
  repayCredit,
  CreditObligation,
} from '../utils/agentbondCreditApi'

interface AgentBondSimulatorProps {
  initialAgentId?: string | null
  onOpenWalletModal: () => void
  activeAddress: string | null
}

export const AgentBondSimulator: React.FC<AgentBondSimulatorProps> = ({
  initialAgentId,
  onOpenWalletModal,
  activeAddress,
}) => {
  const [agents, setAgents] = useState<AgentCreditProfile[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent_research_01')
  const [activeAgent, setActiveAgent] = useState<AgentCreditProfile | null>(null)

  // Simulation State
  const [simStep, setSimStep] = useState<number>(1)
  const [walletBalance, setWalletBalance] = useState<number>(0.20)
  const [servicePrice, setServicePrice] = useState<number>(2.00)
  const [clientReceivable, setClientReceivable] = useState<number>(15.00)
  const [targetServiceName, setTargetServiceName] = useState<string>('HuggingFace Scientific Fact Oracle')
  
  // Artifact Selection
  const [artifactType, setArtifactType] = useState<'research' | 'code' | 'data'>('code')
  const [artifactPayload, setArtifactPayload] = useState<string>(
    'TEAL smart contract patch with 100% automated test suite passing (24/24 assertions green).'
  )
  const [testPassRate, setTestPassRate] = useState<number>(1.0)
  const [citationCount, setCitationCount] = useState<number>(4)

  // Execution Results
  const [currentObligation, setCurrentObligation] = useState<CreditObligation | null>(null)
  const [outcomeResult, setOutcomeResult] = useState<any | null>(null)
  const [scoreEvolution, setScoreEvolution] = useState<any | null>(null)
  const [settlementResult, setSettlementResult] = useState<any | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [statusLog, setStatusLog] = useState<string[]>([])

  const appendLog = (msg: string) => {
    setStatusLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)])
  }

  const loadAgents = async () => {
    try {
      const data = await fetchCreditBureau()
      if (data.success && data.agents.length > 0) {
        setAgents(data.agents)
        const targetId = initialAgentId || selectedAgentId || data.agents[0].agentId
        const match = data.agents.find((a) => a.agentId === targetId) || data.agents[0]
        setSelectedAgentId(match.agentId)
        setActiveAgent(match)
      }
    } catch (err) {
      console.error('Failed to load agents for simulator:', err)
    }
  }

  useEffect(() => {
    loadAgents()
  }, [initialAgentId])

  useEffect(() => {
    if (agents.length > 0 && selectedAgentId) {
      const found = agents.find((a) => a.agentId === selectedAgentId)
      if (found) setActiveAgent(found)
    }
  }, [selectedAgentId, agents])

  const handleArtifactPreset = (type: 'research' | 'code' | 'data') => {
    setArtifactType(type)
    if (type === 'code') {
      setTargetServiceName('Solidity & TEAL Smart Contract Linter')
      setServicePrice(1.50)
      setClientReceivable(18.00)
      setArtifactPayload('TEAL smart contract patch with 100% automated test suite passing (24/24 assertions green).')
      setTestPassRate(1.0)
    } else if (type === 'research') {
      setTargetServiceName('HuggingFace Scientific Fact Oracle')
      setServicePrice(2.00)
      setClientReceivable(15.00)
      setArtifactPayload('Synthesized multi-source research report on Algorand State Proofs with 4 verified cryptographic source citations.')
      setCitationCount(4)
    } else {
      setTargetServiceName('Real-Time Orderbook Depth Stream')
      setServicePrice(0.80)
      setClientReceivable(10.00)
      setArtifactPayload('Clean normalized JSON feed schema verified with zero anomaly triggers across 1,000 order ticks.')
    }
  }

  // STEP 2: Draw Factoring Credit Line
  const handleExecuteCreditDraw = async () => {
    if (!activeAgent) return
    setIsProcessing(true)
    appendLog(`Requesting $${servicePrice.toFixed(2)} task factoring draw for ${activeAgent.name}...`)
    appendLog(`Locked Client Receivable: $${clientReceivable.toFixed(2)} USDC | Sponsor Stake: $${activeAgent.sponsorStakeUsdc} USDC`)

    try {
      const result = await drawCredit({
        agentId: activeAgent.agentId,
        targetService: targetServiceName,
        endpoint: '/verify-task',
        amountUsdc: servicePrice.toFixed(2),
        clientReceivableUsdc: clientReceivable.toFixed(2),
        taskContext: `Factoring task execution for client order ($${clientReceivable} USDC)`,
      })

      if (result.success) {
        setCurrentObligation(result.obligation)
        appendLog(`✓ Credit Approved! Obligation ID: ${result.obligation.obligationId}`)
        appendLog(`✓ $${servicePrice.toFixed(2)} USDC disbursed to service provider upfront via x402 on Algorand.`)
        setSimStep(3)
      }
    } catch (err) {
      appendLog(`❌ Credit Draw Error: ${(err as Error).message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // STEP 4: Deterministic Outcome Verification
  const handleVerifyTaskOutcome = async () => {
    if (!currentObligation) return
    setIsProcessing(true)
    appendLog(`Executing deterministic test sandbox on submitted work artifact...`)

    try {
      const result = await verifyOutcome({
        obligationId: currentObligation.obligationId,
        artifactType,
        artifactContent: artifactPayload,
        testPassRate: artifactType === 'code' ? testPassRate : undefined,
        citationCount: artifactType === 'research' ? citationCount : undefined,
      })

      if (result.success && result.taskOutcome) {
        setOutcomeResult(result.taskOutcome)
        appendLog(`✓ Sandbox Verified: ${result.taskOutcome.qualityScore}% Quality (${result.taskOutcome.verificationStatus})`)
        if (result.taskOutcome.deterministicChecks?.testsPassed) {
          appendLog(`✓ Assertions: ${result.taskOutcome.deterministicChecks.testsPassed}`)
        }
        setSimStep(5)
      }
    } catch (err) {
      appendLog(`❌ Verification Error: ${(err as Error).message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // STEP 5: Settle Receivable & Upgrade Score
  const handleSettleRepayment = async () => {
    if (!currentObligation) return
    setIsProcessing(true)
    appendLog(`Client settles $${clientReceivable.toFixed(2)} bounty...`)
    appendLog(`Splitting: Repaying $${currentObligation.totalOwedUsdc} USDC to Vault, Remitting Net Profit to Agent.`)

    try {
      const result = await repayCredit({
        obligationId: currentObligation.obligationId,
        payerAddress: activeAgent?.walletAddress,
      })

      if (result.success) {
        setScoreEvolution(result.scoreEvolution)
        setSettlementResult(result.settlement)
        setActiveAgent(result.agent)
        appendLog(`✓ Loan Settled on Algorand! Tx: ${result.settlement.txHash}`)
        appendLog(`✓ Net Profit Paid to Agent: +$${result.settlement.netAgentProfitUsdc} USDC`)
        appendLog(`🎉 Score Upgraded: ${result.scoreEvolution.previousScore} → ${result.scoreEvolution.newCreditScore} (${result.scoreEvolution.scoreDelta})`)
        appendLog(`🎉 Credit Limit: $${result.scoreEvolution.previousLimitUsdc} → $${result.scoreEvolution.newTotalCreditLineUsdc} (${result.scoreEvolution.limitDelta})`)
        setSimStep(6)
        await loadAgents()
      }
    } catch (err) {
      appendLog(`❌ Settlement Error: ${(err as Error).message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResetSimulation = () => {
    setSimStep(1)
    setCurrentObligation(null)
    setOutcomeResult(null)
    setScoreEvolution(null)
    setSettlementResult(null)
    setStatusLog([])
    loadAgents()
  }

  return (
    <div className="w-full text-slate-100 font-['Inter',sans-serif] space-y-8 pb-20 max-w-7xl mx-auto px-4">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-slate-800/80 pb-6 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Factoring & Outcome Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-['Space_Grotesk'] mt-1">
            Agent Credit & Factoring Simulator
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Simulate an autonomous AI agent drawing micro-credit against a client work order, settling downstream APIs via x402 on Algorand, submitting deterministic code/research proofs, and pocketing net profits upon settlement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetSimulation}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold font-['Space_Grotesk'] transition-all flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Reset Simulator</span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 6-STEP PROGRESS BAR */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { num: 1, label: 'Client Order Locked' },
          { num: 2, label: 'x402 Credit Draw' },
          { num: 3, label: 'Service Paid Upfront' },
          { num: 4, label: 'Deterministic Execution' },
          { num: 5, label: 'Outcome Scrutinized' },
          { num: 6, label: 'Settled & Profit Paid' },
        ].map((s) => {
          const isActive = simStep === s.num
          const isDone = simStep > s.num
          return (
            <div
              key={s.num}
              className={`p-3 rounded-xl border text-center transition-all ${
                isActive
                  ? 'border-cyan-500/50 bg-cyan-950/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : isDone
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-800 bg-slate-900/40 text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono font-bold uppercase">Step 0{s.num}</div>
              <div className="text-xs font-semibold font-['Space_Grotesk'] mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MAIN WORKBENCH */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Active Step & Execution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent & Sponsor Staking Card */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase">Active Autonomous Agent</span>
                <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                  {activeAgent?.name || 'Loading Agent...'}
                </h3>
              </div>

              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                disabled={simStep > 1}
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50"
              >
                {agents.map((a) => (
                  <option key={a.agentId} value={a.agentId}>
                    {a.name} (Score: {a.creditScore} • Line: ${a.totalCreditLineUsdc})
                  </option>
                ))}
              </select>
            </div>

            {/* Financial Parameters */}
            {activeAgent && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 font-mono text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Operating Cash</span>
                  <div className="text-base font-bold text-rose-400 mt-0.5">${walletBalance.toFixed(2)} USDC</div>
                  <span className="text-[9px] text-rose-500">Low Liquidity</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Sponsor Bond Stake</span>
                  <div className="text-base font-bold text-indigo-400 mt-0.5">${activeAgent.sponsorStakeUsdc} USDC</div>
                  <span className="text-[9px] text-indigo-300">1st-Loss Collateral</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Available Credit</span>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">${activeAgent.availableCreditUsdc}</div>
                  <span className="text-[9px] text-slate-400">Line: ${activeAgent.totalCreditLineUsdc}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Credit Score</span>
                  <div className="text-base font-bold text-cyan-400 mt-0.5">{activeAgent.creditScore}</div>
                  <span className="text-[9px] text-slate-400">Tier {activeAgent.riskTier}</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 1 & 2: Client Order & Factoring Draw */}
          {simStep <= 2 && (
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">1</span>
                  <span>Client Work Order & Micro-Credit Factoring Advance</span>
                </h3>
                <span className="text-xs font-mono text-cyan-400">Step 01 / 06</span>
              </div>

              {/* Task Archetype Selection */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium">Select Verified Client Task Archetype:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleArtifactPreset('code')}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                      artifactType === 'code'
                        ? 'border-cyan-500 bg-cyan-950/40 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-bold text-slate-200 font-['Space_Grotesk']">💻 Smart Contract Bug Patch</div>
                    <div className="text-[11px] text-cyan-400 mt-1">Client Bounty: $18.00 USDC</div>
                    <div className="text-[10px] text-slate-500">Advance Needed: $1.50 USDC</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleArtifactPreset('research')}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                      artifactType === 'research'
                        ? 'border-cyan-500 bg-cyan-950/40 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-bold text-slate-200 font-['Space_Grotesk']">🔬 Cryptographic Research</div>
                    <div className="text-[11px] text-cyan-400 mt-1">Client Bounty: $15.00 USDC</div>
                    <div className="text-[10px] text-slate-500">Advance Needed: $2.00 USDC</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleArtifactPreset('data')}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                      artifactType === 'data'
                        ? 'border-cyan-500 bg-cyan-950/40 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-bold text-slate-200 font-['Space_Grotesk']">📊 Real-Time Market Feed</div>
                    <div className="text-[11px] text-cyan-400 mt-1">Client Bounty: $10.00 USDC</div>
                    <div className="text-[10px] text-slate-500">Advance Needed: $0.80 USDC</div>
                  </button>
                </div>
              </div>

              {/* Economics Summary */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Client Bounty Order:</span>
                  <span className="text-white font-bold text-sm">${clientReceivable.toFixed(2)} USDC</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Micro-Credit Advance:</span>
                  <span className="text-cyan-400 font-bold text-sm">${servicePrice.toFixed(2)} USDC</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Projected Agent Profit:</span>
                  <span className="text-emerald-400 font-bold text-sm">+${(clientReceivable - servicePrice - 0.006).toFixed(2)} USDC</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleExecuteCreditDraw}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-bold text-xs font-['Space_Grotesk'] shadow-md hover:scale-[1.01] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Approving Factoring Advance...</span>
                    </>
                  ) : (
                    <span>Advance ${servicePrice.toFixed(2)} & Pay Provider via x402 →</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 & 4: Deterministic Sandbox & Outcome Verification */}
          {simStep >= 3 && simStep <= 4 && (
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs font-mono">2</span>
                  <span>Deterministic Outcome Verification Sandbox</span>
                </h3>
                <span className="text-xs font-mono text-cyan-400">Step 04 / 06</span>
              </div>

              {currentObligation && (
                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-400">Active Obligation:</span>{' '}
                    <strong className="text-white">{currentObligation.obligationId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Locked Client Bounty:</span>{' '}
                    <strong className="text-emerald-400">${currentObligation.clientReceivableUsdc} USDC</strong>
                  </div>
                </div>
              )}

              {/* Artifact Input */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium">Submitted Work Deliverable:</label>
                <textarea
                  value={artifactPayload}
                  onChange={(e) => setArtifactPayload(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Deterministic Assertions */}
              {artifactType === 'code' && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Automated Unit Test Suite Assertions:</span>
                    <span className="font-mono text-emerald-400 font-bold">24 / 24 Passing (100%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full rounded-full" />
                  </div>
                </div>
              )}

              {artifactType === 'research' && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Cryptographic DOI Academic Citations:</span>
                    <span className="font-mono text-cyan-400 font-bold">{citationCount} Sources Verified</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={citationCount}
                    onChange={(e) => setCitationCount(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleVerifyTaskOutcome}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-['Space_Grotesk'] shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Running Sandboxed Test Harness...</span>
                    </>
                  ) : (
                    <span>Execute Deterministic Verification →</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Settle Receivable & Profit Split */}
          {simStep === 5 && outcomeResult && (
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-mono">3</span>
                  <span>Deliverable Verified! Settle Receivable & Distribute Profit</span>
                </h3>
                <span className="text-xs font-mono text-emerald-400">Step 05 / 06</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-300">Deterministic Verification Verdict:</span>
                  <span className="text-lg font-bold text-emerald-400">{outcomeResult.qualityScore}% ({outcomeResult.verificationStatus})</span>
                </div>
                <div className="space-y-1 text-slate-400 text-[11px]">
                  {outcomeResult.evidence?.map((ev: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settlement Split Preview */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Client Settlement Paid:</span>
                  <span className="text-white font-bold text-sm">${clientReceivable.toFixed(2)} USDC</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Repaying AgentBond Loan:</span>
                  <span className="text-rose-400 font-bold text-sm">-${currentObligation?.totalOwedUsdc} USDC</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Net Profit to Agent Wallet:</span>
                  <span className="text-emerald-400 font-bold text-base">+${currentObligation?.netAgentPayoutUsdc} USDC</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSettleRepayment}
                  disabled={isProcessing}
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 text-white font-bold text-xs font-['Space_Grotesk'] shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Settling on Algorand...</span>
                    </>
                  ) : (
                    <span>Settle Payout & Upgrade Score →</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Evolution & Net Profit Summary */}
          {simStep === 6 && scoreEvolution && (
            <div className="p-6 sm:p-8 rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 to-slate-900/90 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/40">
                  <span>✓ Factoring Settled • Net Profit Disbursed</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk']">
                  Credit Line Expanded & Net Profit Earned!
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                  {activeAgent?.name} earned <strong className="text-emerald-400">+${settlementResult?.netAgentProfitUsdc} USDC</strong> in profit and elevated its borrowing capacity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Score Evolution</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {scoreEvolution.newCreditScore}
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">{scoreEvolution.scoreDelta} Points</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Expanded Credit Line</span>
                  <div className="text-2xl font-black text-cyan-400 mt-1">
                    ${scoreEvolution.newTotalCreditLineUsdc}
                  </div>
                  <span className="text-xs text-cyan-400 font-bold">{scoreEvolution.limitDelta} Expansion</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Agent Net Profit</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    +${settlementResult?.netAgentProfitUsdc}
                  </div>
                  <span className="text-xs text-slate-400">USDC in Wallet</span>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={handleResetSimulation}
                  className="px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-['Space_Grotesk'] shadow-md transition-all"
                >
                  Simulate Another Task Cycle →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 col: Live Terminal Log & 3-Tier Loss Absorption Explainer */}
        <div className="space-y-6">
          {/* Live Terminal Logger */}
          <div className="p-5 rounded-3xl border border-slate-800 bg-slate-950 shadow-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] text-slate-400 ml-1 font-sans font-semibold">Factoring Execution Terminal</span>
              </div>
              <span className="text-[10px] text-cyan-400 animate-pulse">LIVE</span>
            </div>

            <div className="h-64 overflow-y-auto space-y-1.5 text-[11px] text-slate-400 pr-1 select-text">
              {statusLog.length === 0 ? (
                <div className="text-slate-600 italic">Ready. Select an agent and advance credit against a client work order.</div>
              ) : (
                statusLog.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    <span className="text-indigo-400">❯</span> {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3-Tier Loss Absorption Hierarchy */}
          <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-white font-['Space_Grotesk'] text-sm">
              3-Tier Loss Absorption Hierarchy
            </h4>
            <div className="space-y-2.5 pt-1 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-indigo-500/30">
                <div className="text-indigo-300 font-bold">1st Loss: Sponsor Stake</div>
                <div className="text-slate-400 text-[10px]">Sponsor collateral is slashed first if an agent defaults.</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30">
                <div className="text-cyan-300 font-bold">2nd Loss: Insurance Buffer</div>
                <div className="text-slate-400 text-[10px]">$15,000 protocol fee reserve absorbs residual anomalies.</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-purple-500/30">
                <div className="text-purple-300 font-bold">3rd Loss: Junior Yield Tranche</div>
                <div className="text-slate-400 text-[10px]">High-yield investors absorb tail risk for 14.8% APY.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentBondSimulator
