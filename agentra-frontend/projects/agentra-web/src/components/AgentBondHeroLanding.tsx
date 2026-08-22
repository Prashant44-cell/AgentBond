import React from 'react'

interface AgentBondHeroLandingProps {
  onNavigateTab: (tab: string) => void
  onOpenWalletModal: () => void
  activeAddress: string | null
}

export const AgentBondHeroLanding: React.FC<AgentBondHeroLandingProps> = ({
  onNavigateTab,
  onOpenWalletModal,
  activeAddress,
}) => {
  return (
    <div className="w-full text-slate-100 font-['Inter',sans-serif] space-y-16 pb-20">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 1. HERO SECTION */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-6 md:pt-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto">
        {/* Glowing Ambient Background Blurs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[280px] bg-indigo-600/15 rounded-full blur-[110px] pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/3 w-[320px] h-[180px] bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none -z-10" />

        {/* Top Feature Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/50 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.2)] mb-6 text-xs font-mono text-indigo-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Outcome-Backed Machine-to-Machine Credit Protocol</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-300 font-semibold">x402 on Algorand</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-['Space_Grotesk',sans-serif] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] max-w-4xl">
          Trust & Credit Lines for <br />
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Autonomous AI Agents
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Enable autonomous software agents to borrow micro-credit for APIs, compute, and data, settle later via x402, and unlock higher borrowing limits strictly through <strong className="text-slate-200">independently verified work quality</strong>.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigateTab('simulator')}
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-semibold text-sm shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 font-['Space_Grotesk']"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Launch Credit Simulator</span>
          </button>

          <button
            onClick={() => onNavigateTab('bureau')}
            className="px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 font-semibold text-sm backdrop-blur-md hover:border-slate-600 transition-all font-['Space_Grotesk'] flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Explore Agent Bureau</span>
          </button>

          <button
            onClick={() => onNavigateTab('pools')}
            className="px-6 py-3.5 rounded-xl border border-indigo-500/20 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 font-semibold text-sm backdrop-blur-md transition-all font-['Space_Grotesk'] flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>Stake in Vaults (8.45% APY)</span>
          </button>
        </div>

        {/* Live Protocol Highlights Ticker */}
        <div className="mt-12 w-full grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col items-center justify-center p-3 border-r border-slate-800/80 last:border-0">
            <span className="text-xs text-slate-400 font-medium">Total Credit Extended</span>
            <span className="text-xl sm:text-2xl font-bold text-white font-mono mt-0.5">$842,500</span>
            <span className="text-[10px] text-emerald-400 font-mono mt-0.5">▲ +18.4% 30d</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 border-r border-slate-800/80 last:border-0">
            <span className="text-xs text-slate-400 font-medium">Active Agent Fleets</span>
            <span className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono mt-0.5">142 Agents</span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">LangChain, AutoGPT, CrewAI</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 border-r border-slate-800/80 last:border-0">
            <span className="text-xs text-slate-400 font-medium">Outcome Verifications</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-0.5">99.4% Pass</span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Automated Test & Citations</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3">
            <span className="text-xs text-slate-400 font-medium">Vault Net Yield</span>
            <span className="text-xl sm:text-2xl font-bold text-indigo-400 font-mono mt-0.5">8.45% APY</span>
            <span className="text-[10px] text-indigo-300 font-mono mt-0.5">Algorand USDC Pool</span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 2. THE PROBLEM & USP: WHY AGENTS NEED OUTCOME-BACKED CREDIT */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-['Space_Grotesk']">
            The Fundamental Flaw in Existing Agent Financing
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Current systems either require manual wallet prefunding or score credit solely on transaction volume. 
            An agent repaying $0.01 test loans does not prove it delivers valuable code or truthful research.
          </p>
        </div>

        {/* 3-Column Comparative Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Prepaid Wallets */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl space-y-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              ✕
            </div>
            <h3 className="text-lg font-semibold text-white font-['Space_Grotesk']">1. Prepaid Agent Wallets</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Developers must manually fund agent wallets. If the balance reaches $0 during a critical pipeline, the agent immediately crashes and stalls production.
            </p>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-rose-400">
              ❌ Blocked autonomous execution<br />
              ❌ High idle capital requirement
            </div>
          </div>

          {/* Card 2: Generic Credit Bureaus */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl space-y-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              ⚠
            </div>
            <h3 className="text-lg font-semibold text-white font-['Space_Grotesk']">2. Generic Scoring Bureaus</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Existing protocols (Kojiru, ClawCredit, Valeo) calculate credit scores strictly from raw payment volume and wallet age, ignoring actual agent output quality.
            </p>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-amber-400">
              ❌ Vulnerable to hallucinating bots<br />
              ❌ Low-utility spam creates fake credit
            </div>
          </div>

          {/* Card 3: AgentBond (The Solution) */}
          <div className="p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-indigo-950/60 to-slate-900/80 backdrop-blur-xl space-y-4 relative shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold">
              AgentBond USP
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold">
              ✓
            </div>
            <h3 className="text-lg font-semibold text-white font-['Space_Grotesk']">3. Outcome-Backed Credit</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              AgentBond increases borrowing limits <strong>only when submitted work artifacts pass independent verification</strong> (unit test passes, citation checks, policy invariants).
            </p>
            <div className="pt-2 border-t border-cyan-500/20 text-[11px] font-mono text-cyan-300">
              ✓ Continuous uninterrupted workflows<br />
              ✓ Verifiable work quality drives financial trust
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 3. MULTI-FACTOR OUTCOME UNDERWRITING FORMULA */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-2xl shadow-2xl relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Multi-Factor Underwriting</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] mt-1">
                The AgentBond Credit Score (300 – 850)
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                Tier AAA: 780+ ($250 Line)
              </span>
              <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold">
                Tier AA: 720+ ($100 Line)
              </span>
            </div>
          </div>

          {/* Factor Weight Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 flex flex-col justify-between space-y-2">
              <div className="text-2xl font-black text-indigo-400 font-mono">40%</div>
              <div className="text-xs font-semibold text-slate-200">Repayment Reliability</div>
              <div className="text-[11px] text-slate-400">On-time micro-debt settlement and turnover speed.</div>
            </div>

            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex flex-col justify-between space-y-2">
              <div className="text-2xl font-black text-cyan-400 font-mono">25%</div>
              <div className="text-xs font-semibold text-slate-200">Verified Task Quality</div>
              <div className="text-[11px] text-slate-400">Automated test passes, verified citations, zero hallucination.</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 flex flex-col justify-between space-y-2">
              <div className="text-2xl font-black text-purple-400 font-mono">15%</div>
              <div className="text-xs font-semibold text-slate-200">Identity Continuity</div>
              <div className="text-[11px] text-slate-400">SIWA wallet maturity, sponsor stake, runtime provenance.</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 flex flex-col justify-between space-y-2">
              <div className="text-2xl font-black text-emerald-400 font-mono">10%</div>
              <div className="text-xs font-semibold text-slate-200">Policy Compliance</div>
              <div className="text-[11px] text-slate-400">Zero PII leaks, injection immunity, and SLA adherence.</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 flex flex-col justify-between space-y-2">
              <div className="text-2xl font-black text-amber-400 font-mono">10%</div>
              <div className="text-xs font-semibold text-slate-200">Service Diversity</div>
              <div className="text-[11px] text-slate-400">Breadth of tools consumed across x402 ecosystem.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 4. STEP-BY-STEP PROTOCOL FLOW */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">End-to-End Architecture</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] mt-1">
            How AgentBond Executes in Real Time
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl relative space-y-3">
            <div className="text-xs font-mono text-indigo-400 font-bold">STAGE 01</div>
            <h3 className="text-base font-semibold text-white font-['Space_Grotesk']">Credit Draw Request</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Agent needs a $2.00 API with only $0.20 balance. It calls <code className="text-cyan-300 font-mono">POST /api/credit/draw</code> to request a task credit line.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl relative space-y-3">
            <div className="text-xs font-mono text-cyan-400 font-bold">STAGE 02</div>
            <h3 className="text-base font-semibold text-white font-['Space_Grotesk']">Instant x402 Settlement</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AgentBond verifies credit limits, disburses USDC to the service provider immediately via x402, and locks an active loan obligation.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl relative space-y-3">
            <div className="text-xs font-mono text-purple-400 font-bold">STAGE 03</div>
            <h3 className="text-base font-semibold text-white font-['Space_Grotesk']">Outcome Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Agent submits the output artifact (code patch, research brief). The Outcome Verifier independently scores quality (e.g. 96%).
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl relative space-y-3">
            <div className="text-xs font-mono text-emerald-400 font-bold">STAGE 04</div>
            <h3 className="text-base font-semibold text-white font-['Space_Grotesk']">Repayment & Upgrade</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Loan is settled from task revenue. Verified quality + on-time repayment dynamically elevates credit score and unlocks a larger credit line.
            </p>
          </div>
        </div>

        {/* Quick Launch Banner */}
        <div className="mt-10 p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-cyan-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-white font-semibold font-['Space_Grotesk'] text-lg">Ready to see AgentBond in action?</div>
            <div className="text-xs text-slate-400">Simulate a live AI agent drawing credit, verifying output, and upgrading its score.</div>
          </div>
          <button
            onClick={() => onNavigateTab('simulator')}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-['Space_Grotesk'] transition-all whitespace-nowrap shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            Launch 6-Step Simulator →
          </button>
        </div>
      </section>
    </div>
  )
}

export default AgentBondHeroLanding
