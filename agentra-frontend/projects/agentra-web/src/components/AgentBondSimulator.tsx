import React, { useState, useEffect } from 'react'
import {
  AgentCreditProfile,
  fetchCreditBureau,
  drawCredit,
  verifyOutcome,
  repayCredit,
  payProviderWithTestnetWallet,
  CreditObligation,
} from '../utils/agentbondCreditApi'

interface AgentBondSimulatorProps {
  initialAgentId?: string | null
  onOpenWalletModal: () => void
  activeAddress: string | null
  signTransactions: (txns: Uint8Array[]) => Promise<any>
}

export const AgentBondSimulator: React.FC<AgentBondSimulatorProps> = ({
  initialAgentId,
  onOpenWalletModal,
  activeAddress,
  signTransactions,
}) => {
  const [agents, setAgents] = useState<AgentCreditProfile[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent_research_01')
  const [activeAgent, setActiveAgent] = useState<AgentCreditProfile | null>(null)

  // Simulation State
  const [simStep, setSimStep] = useState<number>(1)
  const [walletBalance, setWalletBalance] = useState<number>(0.20)
  const [servicePrice, setServicePrice] = useState<number>(0.05)
  const [clientReceivable, setClientReceivable] = useState<number>(18.00)
  const [targetServiceName, setTargetServiceName] = useState<string>('Solidity & TEAL Smart Contract Linter')
  const [providerWallet, setProviderWallet] = useState<string>('')
  const [paymentTransactionId, setPaymentTransactionId] = useState<string>('')
  
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
      setServicePrice(0.05)
      setClientReceivable(18.00)
      setArtifactPayload('TEAL smart contract patch with 100% automated test suite passing (24/24 assertions green).')
      setTestPassRate(1.0)
    } else if (type === 'research') {
      setTargetServiceName('HuggingFace Scientific Fact Oracle')
      setServicePrice(0.10)
      setClientReceivable(0.25)
      setArtifactPayload('Synthesized multi-source research report on Algorand State Proofs with 4 verified cryptographic source citations.')
      setCitationCount(4)
    } else {
      setTargetServiceName('Real-Time Orderbook Depth Stream')
      setServicePrice(0.80)
      setClientReceivable(0.25)
      setArtifactPayload('Clean normalized JSON feed schema verified with zero anomaly triggers across 1,000 order ticks.')
    }
  }

  // STEP 2: Draw Factoring Credit Line
  const handleExecuteCreditDraw = async () => {
    if (!activeAgent) return
    if (!activeAddress) {
      appendLog('Connect an Algorand TestNet wallet before paying the provider.')
      onOpenWalletModal()
      return
    }
    if (!providerWallet.trim()) {
      appendLog('Enter the provider wallet before submitting the TestNet payment.')
      return
    }
    setIsProcessing(true)
    appendLog(`Requesting $${servicePrice.toFixed(2)} task factoring draw for ${activeAgent.name}...`)
    appendLog(`Locked Client Receivable: $${clientReceivable.toFixed(2)} USDC | Sponsor Stake: $${activeAgent.sponsorStakeUsdc} USDC`)

    try {
      const transactionId = await payProviderWithTestnetWallet(activeAddress, providerWallet.trim(), servicePrice.toFixed(2), signTransactions)
      setPaymentTransactionId(transactionId)
      appendLog(`✓ Wallet submitted TestNet USDC payment ${transactionId.slice(0, 8)}…; waiting for confirmation.`)
      const result = await drawCredit({
        agentId: activeAgent.agentId,
        targetService: targetServiceName,
        endpoint: '/verify-task',
        amountUsdc: servicePrice.toFixed(2),
        providerWallet: providerWallet.trim(),
        paymentTransactionId: transactionId,
        clientReceivableUsdc: clientReceivable.toFixed(2),
        taskContext: `Factoring task execution for client order ($${clientReceivable} USDC)`,
      })

      if (result.success) {
        setCurrentObligation(result.obligation)
        appendLog(`✓ Credit Approved! Obligation ID: ${result.obligation.obligationId}`)
        appendLog(`✓ Connected-wallet TestNet payment ${paymentTransactionId.slice(0, 8)}… confirmed.`)
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
    <div className="w-full text-[#1B133C] font-['Inter',sans-serif] space-y-8 pb-20 max-w-7xl mx-auto px-4 pt-4">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* PAGE SCENARIO BANNER: SIMULATOR */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#1B133C]/10 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] text-xs font-medium text-[#1B133C]">
            <div className="w-4 h-4 rounded-md bg-[#F97316] flex items-center justify-center text-white font-bold text-[10px]">
              A
            </div>
            <span>Interactive 6-Step Autonomous Task & Micro-Loan Simulator</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Deterministic Test Sandbox: Online</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl md:text-5xl font-normal text-[#1B133C] tracking-tight">
              Agent Credit & Factoring Simulator
            </h1>
            <p className="text-xs sm:text-sm text-[#1B133C]/70 max-w-2xl leading-relaxed">
              Simulate an autonomous digital worker requesting x402 credit against a client work order, settling downstream API dependencies, submitting verifiable SHA-256 test proofs, and unlocking a higher credit score.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleResetSimulation}
              className="px-5 py-2.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] hover:bg-white text-[#1B133C] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Reset Simulation</span>
            </button>
          </div>
        </div>

        {/* Quick Scenario Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#1B133C]/5 text-[11px] text-[#1B133C]/75">
          <span className="font-semibold text-[#1B133C]">Scenario Reference:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Live Algorand x402 Dispatch</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">SHA-256 Sandbox Verification</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Dynamic Score Elevation</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">Zero Upfront Capital Required</span>
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
          { num: 4, label: 'Deterministic Exec' },
          { num: 5, label: 'Outcome Scrutinized' },
          { num: 6, label: 'Settled & Profit Paid' },
        ].map((s) => {
          const isActive = simStep === s.num
          const isDone = simStep > s.num
          return (
            <div
              key={s.num}
              className={`p-3 rounded-2xl border text-center transition-all ${
                isActive
                  ? 'border-[#1B133C] bg-[#1B133C] text-white shadow-md'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-[#1B133C]/10 bg-white text-[#1B133C]/40'
              }`}
            >
              <div className="text-[10px] font-mono font-bold uppercase">Step 0{s.num}</div>
              <div className="text-xs font-semibold mt-0.5">{s.label}</div>
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
          <div className="p-6 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-[#F97316] uppercase font-semibold">Active Autonomous Agent</span>
                <h3 className="text-lg font-bold text-[#1B133C]">
                  {activeAgent?.name || 'Loading Agent...'}
                </h3>
              </div>

              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                disabled={simStep > 1}
                className="px-3.5 py-2 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-xl text-xs text-[#1B133C] focus:outline-none focus:border-[#1B133C]/40 font-mono disabled:opacity-50"
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#F5F5F5] border border-[#1B133C]/10 font-mono text-center text-xs">
                <div>
                  <span className="text-[10px] text-[#1B133C]/60 uppercase">Operating Cash</span>
                  <div className="text-base font-bold text-rose-600 mt-0.5">${walletBalance.toFixed(2)} USDC</div>
                  <span className="text-[9px] text-rose-500">Low Liquidity</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#1B133C]/60 uppercase">Sponsor Bond Stake</span>
                  <div className="text-base font-bold text-indigo-700 mt-0.5">${activeAgent.sponsorStakeUsdc} USDC</div>
                  <span className="text-[9px] text-indigo-600">1st-Loss Collateral</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#1B133C]/60 uppercase">Available Credit</span>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">${activeAgent.availableCreditUsdc}</div>
                  <span className="text-[9px] text-[#1B133C]/60">Line: ${activeAgent.totalCreditLineUsdc}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#1B133C]/60 uppercase">Credit Score</span>
                  <div className="text-base font-bold text-[#1B133C] mt-0.5">{activeAgent.creditScore}</div>
                  <span className="text-[9px] text-[#1B133C]/60">Tier {activeAgent.riskTier}</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 1 & 2: Client Order & Factoring Draw */}
          {simStep <= 2 && (
            <div className="p-6 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#1B133C]/10 pb-3">
                <h3 className="text-base font-bold text-[#1B133C] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1B133C] text-white flex items-center justify-center text-xs font-mono">1</span>
                  <span>Client Work Order & Micro-Credit Factoring Advance</span>
                </h3>
                <span className="text-xs font-mono text-[#F97316] font-semibold">Step 01 / 06</span>
              </div>

              {/* Task Archetype Selection */}
              <div className="space-y-2">
                <label className="text-xs text-[#1B133C]/70 font-medium">Select Verified Client Task Archetype:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleArtifactPreset('code')}
                    className={`p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                      artifactType === 'code'
                        ? 'border-[#1B133C] bg-[#1B133C] text-white shadow-sm'
                        : 'border-[#1B133C]/10 bg-[#F5F5F5] text-[#1B133C] hover:bg-slate-200'
                    }`}
                  >
                    <div className="font-bold">💻 Smart Contract Bug Patch</div>
                    <div className={`text-[11px] mt-1 ${artifactType === 'code' ? 'text-[#F97316]' : 'text-[#F97316]'}`}>Client Bounty: $18.00 USDC</div>
                    <div className={`text-[10px] ${artifactType === 'code' ? 'text-white/70' : 'text-[#1B133C]/60'}`}>Advance Needed: $0.05 USDC</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleArtifactPreset('research')}
                    className={`p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                      artifactType === 'research'
                        ? 'border-[#1B133C] bg-[#1B133C] text-white shadow-sm'
                        : 'border-[#1B133C]/10 bg-[#F5F5F5] text-[#1B133C] hover:bg-slate-200'
                    }`}
                  >
                    <div className="font-bold">🔬 Cryptographic Research</div>
                    <div className={`text-[11px] mt-1 ${artifactType === 'research' ? 'text-[#F97316]' : 'text-[#F97316]'}`}>Client Bounty: $0.25 USDC</div>
                    <div className={`text-[10px] ${artifactType === 'research' ? 'text-white/70' : 'text-[#1B133C]/60'}`}>Advance Needed: $0.10 USDC</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleArtifactPreset('data')}
                    className={`p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                      artifactType === 'data'
                        ? 'border-[#1B133C] bg-[#1B133C] text-white shadow-sm'
                        : 'border-[#1B133C]/10 bg-[#F5F5F5] text-[#1B133C] hover:bg-slate-200'
                    }`}
                  >
                    <div className="font-bold">📊 Real-Time Market Feed</div>
                    <div className={`text-[11px] mt-1 ${artifactType === 'data' ? 'text-[#F97316]' : 'text-[#F97316]'}`}>Client Bounty: $0.25 USDC</div>
                    <div className={`text-[10px] ${artifactType === 'data' ? 'text-white/70' : 'text-[#1B133C]/60'}`}>Advance Needed: $0.80 USDC</div>
                  </button>
                </div>
              </div>

              {/* Economics Summary */}
              <div className="p-4 rounded-2xl bg-[#F5F5F5] border border-[#1B133C]/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <span className="text-[#1B133C]/60 block text-[10px]">Client Bounty Order:</span>
                  <span className="text-[#1B133C] font-bold text-sm">${clientReceivable.toFixed(2)} USDC</span>
                </div>
                <div>
                  <span className="text-[#1B133C]/60 block text-[10px]">Micro-Credit Advance:</span>
                  <span className="text-[#F97316] font-bold text-sm">${servicePrice.toFixed(2)} USDC</span>
                </div>
                <div>
                  <span className="text-[#1B133C]/60 block text-[10px]">Projected Agent Profit:</span>
                  <span className="text-emerald-700 font-bold text-sm">+${(clientReceivable - servicePrice - 0.006).toFixed(2)} USDC</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col items-stretch">
                <div className="w-full space-y-2 mb-3">
                  <input value={providerWallet} onChange={(e) => setProviderWallet(e.target.value)} placeholder="Provider Algorand TestNet wallet" className="w-full rounded-xl border border-[#1B133C]/15 px-3 py-2 text-xs font-mono" />
                  <p className="text-[10px] text-[#1B133C]/60">Your connected TestNet wallet will sign and submit the USDC payment. AgentBond records the obligation only after blockchain confirmation.</p>
                </div>
                <button
                  onClick={handleExecuteCreditDraw}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
            <div className="p-6 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#1B133C]/10 pb-3">
                <h3 className="text-base font-bold text-[#1B133C] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1B133C] text-white flex items-center justify-center text-xs font-mono">2</span>
                  <span>Deterministic Outcome Verification Sandbox</span>
                </h3>
                <span className="text-xs font-mono text-[#F97316] font-semibold">Step 04 / 06</span>
              </div>

              {currentObligation && (
                <div className="p-4 rounded-2xl bg-[#F5F5F5] border border-[#1B133C]/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[#1B133C]/60">Active Obligation:</span>{' '}
                    <strong className="text-[#1B133C]">{currentObligation.obligationId}</strong>
                  </div>
                  <div>
                    <span className="text-[#1B133C]/60">Locked Client Bounty:</span>{' '}
                    <strong className="text-emerald-700">${currentObligation.clientReceivableUsdc} USDC</strong>
                  </div>
                </div>
              )}

              {/* Artifact Input */}
              <div className="space-y-2">
                <label className="text-xs text-[#1B133C] font-medium">Submitted Work Deliverable:</label>
                <textarea
                  value={artifactPayload}
                  onChange={(e) => setArtifactPayload(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-[#F5F5F5] border border-[#1B133C]/10 rounded-xl text-xs text-[#1B133C] font-mono focus:outline-none focus:border-[#1B133C]/40"
                />
              </div>

              {/* Deterministic Assertions */}
              {artifactType === 'code' && (
                <div className="p-3.5 rounded-xl bg-[#F5F5F5] border border-[#1B133C]/10 space-y-1 text-xs">
                  <div className="flex justify-between text-[#1B133C]">
                    <span>Automated Unit Test Suite Assertions:</span>
                    <span className="font-mono text-emerald-700 font-bold">24 / 24 Passing (100%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1B133C]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 w-full rounded-full" />
                  </div>
                </div>
              )}

              {artifactType === 'research' && (
                <div className="p-3.5 rounded-xl bg-[#F5F5F5] border border-[#1B133C]/10 space-y-1 text-xs">
                  <div className="flex justify-between text-[#1B133C]">
                    <span>Cryptographic DOI Academic Citations:</span>
                    <span className="font-mono text-[#F97316] font-bold">{citationCount} Sources Verified</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={citationCount}
                    onChange={(e) => setCitationCount(parseInt(e.target.value, 10))}
                    className="w-full accent-[#F97316] cursor-pointer"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleVerifyTaskOutcome}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="p-6 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#1B133C]/10 pb-3">
                <h3 className="text-base font-bold text-[#1B133C] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-mono">3</span>
                  <span>Deliverable Verified! Settle Receivable & Distribute Profit</span>
                </h3>
                <span className="text-xs font-mono text-emerald-700 font-semibold">Step 05 / 06</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-emerald-900 font-semibold">Deterministic Verification Verdict:</span>
                  <span className="text-lg font-bold text-emerald-700">{outcomeResult.qualityScore}% ({outcomeResult.verificationStatus})</span>
                </div>
                <div className="space-y-1 text-emerald-800 text-[11px]">
                  {outcomeResult.evidence?.map((ev: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-emerald-600">✓</span>
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settlement Split Preview */}
              <div className="p-4 rounded-2xl bg-[#F5F5F5] border border-[#1B133C]/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <span className="text-[#1B133C]/60 block text-[10px]">Client Settlement Paid:</span>
                  <span className="text-[#1B133C] font-bold text-sm">${clientReceivable.toFixed(2)} USDC</span>
                </div>
                <div>
                  <span className="text-[#1B133C]/60 block text-[10px]">Repaying AgentBond Loan:</span>
                  <span className="text-rose-600 font-bold text-sm">-${currentObligation?.totalOwedUsdc} USDC</span>
                </div>
                <div>
                  <span className="text-[#1B133C]/60 block text-[10px]">Net Profit to Agent Wallet:</span>
                  <span className="text-emerald-700 font-bold text-base">+${currentObligation?.netAgentPayoutUsdc} USDC</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSettleRepayment}
                  disabled={isProcessing}
                  className="px-7 py-3.5 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
            <div className="p-6 sm:p-8 rounded-3xl border border-[#1B133C]/10 bg-white shadow-lg space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
                  <span>✓ Factoring Settled • Net Profit Disbursed</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1B133C]">
                  Credit Line Expanded & Net Profit Earned!
                </h2>
                <p className="text-xs sm:text-sm text-[#1B133C]/70 max-w-xl mx-auto">
                  {activeAgent?.name} earned <strong className="text-emerald-700">+${settlementResult?.netAgentProfitUsdc} USDC</strong> in profit and elevated its borrowing capacity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#F5F5F5] border border-[#1B133C]/10 text-center font-mono">
                <div className="p-4 rounded-xl bg-white border border-[#1B133C]/10 space-y-1">
                  <span className="text-[10px] text-[#1B133C]/60 uppercase">Score Evolution</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {scoreEvolution.newCreditScore}
                  </div>
                  <span className="text-xs text-emerald-600 font-bold">{scoreEvolution.scoreDelta} Points</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#1B133C]/10 space-y-1">
                  <span className="text-[10px] text-[#1B133C]/60 uppercase">Expanded Credit Line</span>
                  <div className="text-2xl font-black text-[#1B133C] mt-1">
                    ${scoreEvolution.newTotalCreditLineUsdc}
                  </div>
                  <span className="text-xs text-[#F97316] font-bold">{scoreEvolution.limitDelta} Expansion</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#1B133C]/10 space-y-1">
                  <span className="text-[10px] text-[#1B133C]/60 uppercase">Agent Net Profit</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    +${settlementResult?.netAgentProfitUsdc}
                  </div>
                  <span className="text-xs text-[#1B133C]/60">USDC in Wallet</span>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={handleResetSimulation}
                  className="px-8 py-3 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
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
          <div className="p-5 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-3 font-mono text-xs text-[#1B133C]">
            <div className="flex items-center justify-between border-b border-[#1B133C]/10 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-[#1B133C] ml-1 font-sans font-semibold">Factoring Execution Terminal</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-pulse">LIVE</span>
            </div>

            <div className="h-64 overflow-y-auto space-y-1.5 text-[11px] text-[#1B133C]/80 pr-1 select-text bg-[#F5F5F5] p-3 rounded-xl border border-[#1B133C]/5">
              {statusLog.length === 0 ? (
                <div className="text-[#1B133C]/40 italic">Ready. Select an agent and advance credit against a client work order.</div>
              ) : (
                statusLog.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    <span className="text-[#F97316] font-bold">❯</span> {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3-Tier Loss Absorption Hierarchy */}
          <div className="p-5 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-3 text-xs text-[#1B133C]">
            <h4 className="font-bold text-[#1B133C] text-sm">
              3-Tier Loss Absorption Hierarchy
            </h4>
            <div className="space-y-2.5 pt-1 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-[#F5F5F5] border border-indigo-200">
                <div className="text-indigo-800 font-bold">1st Loss: Sponsor Stake</div>
                <div className="text-[#1B133C]/60 text-[10px]">Sponsor collateral is slashed first if an agent defaults.</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F5F5F5] border border-cyan-200">
                <div className="text-cyan-800 font-bold">2nd Loss: Insurance Buffer</div>
                <div className="text-[#1B133C]/60 text-[10px]">$15,000 protocol fee reserve absorbs residual anomalies.</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F5F5F5] border border-purple-200">
                <div className="text-purple-800 font-bold">3rd Loss: Junior Yield Tranche</div>
                <div className="text-[#1B133C]/60 text-[10px]">High-yield investors absorb tail risk for 14.8% APY.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentBondSimulator
