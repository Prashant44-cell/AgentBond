import React, { useState } from 'react'

interface AgentBondSDKPlaygroundProps {
  onOpenWalletModal: () => void
  activeAddress: string | null
}

export const AgentBondSDKPlayground: React.FC<AgentBondSDKPlaygroundProps> = () => {
  const [selectedLang, setSelectedLang] = useState<'python' | 'typescript'>('python')
  const [cliInput, setCliInput] = useState('')
  const [cliOutput, setCliOutput] = useState<string[]>([
    '🤖 AgentBond CLI v1.0.0 (Algorand TestNet / x402 Protocol)',
    'Type "help" to see available terminal commands, or try "agentbond status".',
  ])

  const pythonCode = `import asyncio
from agentbond import AgentBondClient

async def main():
    # 1. Initialize Agent with Algorand Key / Signer
    client = AgentBondClient(
        agent_id="ResearchAgent-Alpha",
        wallet_address="LGMP4QUQ5RB553RZEP6TQHUQDOBJCDOYXHT5AGCAKB6B4TIE5IXA5HMKZA",
        api_base="https://api.agentbond.network"
    )

    # 2. Check Credit Bureau Status & Score
    profile = await client.get_credit_profile()
    print(f"Credit Score: {profile.credit_score} | Limit: \${profile.credit_line}")

    # 3. Draw Credit when balance is low for an x402 API
    draw_res = await client.draw_credit(
        target_service="HuggingFace Research Verifier",
        amount_usdc=2.00,
        task_context="Analyzing Algorand State Proofs"
    )
    print(f"Credit Approved! Obligation ID: {draw_res.obligation_id}")

    # 4. Perform Task & Submit Artifact to Outcome Verifier
    outcome = await client.submit_task_outcome(
        obligation_id=draw_res.obligation_id,
        artifact_type="research",
        artifact_content="Synthesized report with 4 verified DOI citation links",
        citation_count=4
    )
    print(f"Outcome Verified: {outcome.quality_score}% ({outcome.status})")

    # 5. Settle Repayment & Upgrade Score
    repay_res = await client.repay_obligation(draw_res.obligation_id)
    print(f"New Credit Score: {repay_res.new_credit_score} ({repay_res.score_delta})")

asyncio.run(main())`

  const tsCode = `import { AgentBondClient } from '@agentbond/sdk';

async function runAutonomousPipeline() {
  // 1. Initialize Agent Client
  const agent = new AgentBondClient({
    agentId: 'CoderBot-Prime',
    walletAddress: 'LGMP4QUQ5RB553RZEP6TQHUQDOBJCDOYXHT5AGCAKB6B4TIE5IXA5HMKZA',
    apiBase: 'https://api.agentbond.network',
  });

  // 2. Request Task Credit Line
  const draw = await agent.drawCredit({
    targetService: 'TEAL Linter & Verifier',
    amountUsdc: 1.50,
  });

  console.log('Disbursed via x402 on Algorand. Obligation:', draw.obligationId);

  // 3. Submit Code Artifact to Outcome Verifier
  const verification = await agent.verifyOutcome({
    obligationId: draw.obligationId,
    artifactType: 'code',
    testPassRate: 0.98,
    artifactContent: 'TEAL smart contract patch with 100% test coverage.',
  });

  console.log('Outcome Quality Score:', verification.qualityScore);

  // 4. Repay & Expand Credit Limit
  const settlement = await agent.repay(draw.obligationId);
  console.log('New Limit: \$' + settlement.newTotalCreditLineUsdc);
}

runAutonomousPipeline();`

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cmd = cliInput.trim()
    if (!cmd) return

    const newOutputs = [...cliOutput, `❯ ${cmd}`]

    if (cmd === 'clear') {
      setCliOutput([])
      setCliInput('')
      return
    } else if (cmd === 'help') {
      newOutputs.push('Available Commands:')
      newOutputs.push('  agentbond status             - View connected network & vault health')
      newOutputs.push('  agentbond bureau:list        - List top autonomous AI agents by credit tier')
      newOutputs.push('  agentbond credit:draw        - Simulate drawing a $2.00 micro-credit line')
      newOutputs.push('  agentbond task:verify        - Run independent outcome verifier on test artifact')
      newOutputs.push('  agentbond credit:repay       - Settle active obligation & upgrade credit score')
      newOutputs.push('  clear                        - Clear terminal output')
    } else if (cmd.startsWith('agentbond status')) {
      newOutputs.push('✓ Protocol: AgentBond Machine-to-Machine Credit')
      newOutputs.push('✓ Network: Algorand TestNet (USDC ASA 10458941)')
      newOutputs.push('✓ Active Vault TVL: $250,000.00 USDC')
      newOutputs.push('✓ Default Rate: 0.12% | Net APY: 8.45%')
    } else if (cmd.startsWith('agentbond bureau')) {
      newOutputs.push('Top Registered Agents in Bureau:')
      newOutputs.push('  1. CoderBot-Prime        [Score: 810 | Tier: AAA | Limit: $250]')
      newOutputs.push('  2. ResearchAgent-Alpha   [Score: 742 | Tier: AA  | Limit: $100]')
      newOutputs.push('  3. DataScraper-Sentry    [Score: 655 | Tier: A   | Limit: $50]')
      newOutputs.push('  4. DevOpsGuardian-99     [Score: 590 | Tier: BBB | Limit: $20]')
    } else if (cmd.startsWith('agentbond credit:draw')) {
      newOutputs.push('⚡ [Underwriting] Checking credit limit & default risk for ResearchAgent-Alpha...')
      newOutputs.push('✓ Credit Approved: $2.00 USDC disbursed to service provider via x402.')
      newOutputs.push('✓ Obligation ID: ob_cli_9941_a7x (DueDate: 24hr settlement)')
    } else if (cmd.startsWith('agentbond task:verify')) {
      newOutputs.push('🔍 [Outcome Verifier] Scrutinizing submitted work artifact...')
      newOutputs.push('✓ Automated Tests: 100% Passing (24/24 assertions)')
      newOutputs.push('✓ Citation Integrity: 4 DOI sources confirmed')
      newOutputs.push('✓ Quality Score: 96% (verified_pass)')
    } else if (cmd.startsWith('agentbond credit:repay')) {
      newOutputs.push('💳 [Settlement] Repaying $2.006 USDC from earned revenue on Algorand...')
      newOutputs.push('✓ Transaction Hash: tx_algo_settle_804192')
      newOutputs.push('🎉 Score Upgrade: 742 → 810 (+68 pts) | Credit Line: $100 → $250 (+$150)')
    } else {
      newOutputs.push(`Command not recognized: "${cmd}". Type "help" for a list of commands.`)
    }

    setCliOutput(newOutputs)
    setCliInput('')
  }

  return (
    <div className="w-full text-slate-100 font-['Inter',sans-serif] space-y-8 pb-20 max-w-7xl mx-auto px-4">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-slate-800/80 pb-6 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Agent Integration Kit</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-['Space_Grotesk'] mt-1">
            AgentBond Developer SDK & CLI
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Integrate outcome-backed credit into your LangChain, AutoGPT, CrewAI, or custom Python & TypeScript autonomous agent pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedLang('python')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-['Space_Grotesk'] transition-all ${
              selectedLang === 'python'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Python SDK
          </button>
          <button
            onClick={() => setSelectedLang('typescript')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-['Space_Grotesk'] transition-all ${
              selectedLang === 'typescript'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            TypeScript SDK
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* CODE & TERMINAL SPLIT */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Code Snippet Card */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-xs font-mono text-cyan-400">
                {selectedLang === 'python' ? 'agentbond_quickstart.py' : 'agentbond_quickstart.ts'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">MIT License</span>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed select-text max-h-[460px]">
              <code>{selectedLang === 'python' ? pythonCode : tsCode}</code>
            </pre>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Install: <code className="text-white">{selectedLang === 'python' ? 'pip install agentbond' : 'npm i @agentbond/sdk'}</code></span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedLang === 'python' ? pythonCode : tsCode)
                alert('Code copied to clipboard!')
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
            >
              Copy Snippet
            </button>
          </div>
        </div>

        {/* Right: Live Interactive CLI */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-950 shadow-xl space-y-4 flex flex-col justify-between font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-400 font-semibold font-sans ml-1 text-xs">Interactive AgentBond CLI Terminal</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">READY</span>
          </div>

          {/* Terminal Output */}
          <div className="h-[380px] overflow-y-auto space-y-1.5 text-slate-300 p-2 select-text">
            {cliOutput.map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith('❯')
                    ? 'text-cyan-400 font-bold'
                    : line.startsWith('✓') || line.startsWith('🎉')
                    ? 'text-emerald-400'
                    : line.startsWith('⚡') || line.startsWith('🔍')
                    ? 'text-indigo-400'
                    : 'text-slate-400'
                }
              >
                {line}
              </div>
            ))}
          </div>

          {/* Terminal Input Form */}
          <form onSubmit={handleCliSubmit} className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <span className="text-cyan-400 font-bold">❯</span>
            <input
              type="text"
              placeholder="Type a command (e.g. agentbond status, help, clear)..."
              value={cliInput}
              onChange={(e) => setCliInput(e.target.value)}
              className="flex-1 bg-transparent text-white focus:outline-none text-xs font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px]"
            >
              Run
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AgentBondSDKPlayground
