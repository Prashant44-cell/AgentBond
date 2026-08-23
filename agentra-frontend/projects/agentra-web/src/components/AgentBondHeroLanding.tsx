import React, { useEffect } from 'react'
import { useTheme } from '../ThemeContext'

interface AgentBondHeroLandingProps {
  onNavigateTab: (tab: string) => void
  onOpenWalletModal: () => void
  activeAddress: string | null
}

export const AgentBondHeroLanding: React.FC<AgentBondHeroLandingProps> = ({
  onNavigateTab,
}) => {
  const { isLight } = useTheme()

  useEffect(() => {
    document.title = 'AgentBond — Digital Workers & Outcome-Backed Credit'
  }, [])

  return (
    <div className={`w-full transition-colors duration-300 ${
      isLight ? 'bg-[#F5F5F5] text-[#1B133C]' : 'bg-slate-950 text-slate-100'
    } font-['Inter',sans-serif] selection:bg-[#F97316]/20 selection:text-[#1B133C]`}>
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 1. FULL PAGE HERO SECTION (TOP OVERLAPPING NAVBAR) */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between pt-24 sm:pt-32 md:pt-36 pb-12 px-4 sm:px-6">
        {/* Background Video & Adaptive Translucent Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            muted
            loop
            playsInline
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260714_113715_c7e0daa0-8bdd-4486-a2da-040901f8f0ea.mp4"
            className="w-full h-[130%] object-cover object-top opacity-90"
          />
          <div className={`absolute inset-0 transition-colors duration-300 ${
            isLight ? 'bg-[#F5F5F5]/65 backdrop-blur-[0.5px]' : 'bg-slate-950/75 backdrop-blur-[0.5px]'
          }`} />
          <div className={`absolute inset-0 bg-gradient-to-b ${
            isLight ? 'from-transparent via-[#F5F5F5]/40 to-[#F5F5F5]' : 'from-transparent via-slate-950/50 to-slate-950'
          } transition-colors duration-300`} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto my-auto py-6 sm:py-10">
          {/* Badge */}
          <div className={`mb-5 sm:mb-6 inline-flex items-center gap-3 rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition-all ${
            isLight
              ? 'border-[#1B133C]/10 bg-white/80 text-[#1B133C] backdrop-blur-md'
              : 'border-slate-800 bg-slate-900/80 text-white backdrop-blur-md'
          }`}>
            <div className="w-5 h-5 rounded-md bg-[#F97316] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              A
            </div>
            <span>Outcome-backed digital workers</span>
          </div>

          {/* Heading */}
          <h1 className={`font-['Instrument_Serif',serif] text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight max-w-4xl text-center font-normal transition-colors ${
            isLight ? 'text-[#1B133C]' : 'text-white'
          }`}>
            Deploy digital workers<br />
            for mundane workflows
          </h1>

          {/* Supporting Copy */}
          <p className={`mt-5 sm:mt-6 max-w-3xl text-xs sm:text-sm md:text-base leading-relaxed text-center font-['Inter',sans-serif] transition-colors ${
            isLight ? 'text-[#1B133C]/75' : 'text-slate-300'
          }`}>
            AgentBond puts intelligent digital workers on every routine process — from browser operations and API verification to credit-aware task execution — so your team can move faster without carrying the busywork.
          </p>

          {/* CTA Buttons */}
          <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={() => onNavigateTab('simulator')}
              className={`rounded-xl px-6 sm:px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 ${
                isLight
                  ? 'bg-[#1B133C] hover:bg-[#1B133C]/90 shadow-[0px_4px_16px_rgba(27,19,60,0.25)]'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-[0px_4px_20px_rgba(99,102,241,0.3)]'
              }`}
            >
              <span>Deploy your first worker</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => onNavigateTab('bureau')}
              className={`rounded-xl backdrop-blur-sm px-6 py-3.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border ${
                isLight
                  ? 'bg-white/85 text-[#1B133C] border-[#1B133C]/10 hover:bg-white shadow-[0px_2px_10px_rgba(0,0,0,0.06)]'
                  : 'bg-slate-900/80 text-slate-200 border-slate-800 hover:bg-slate-850'
              }`}
            >
              Explore Credit Bureau
            </button>
            <button
              onClick={() => onNavigateTab('pools')}
              className={`rounded-xl backdrop-blur-sm px-5 py-3.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border ${
                isLight
                  ? 'bg-white/85 text-[#F97316] border-[#F97316]/20 hover:bg-white shadow-[0px_2px_10px_rgba(0,0,0,0.06)]'
                  : 'bg-slate-900/80 text-cyan-300 border-cyan-500/30 hover:bg-slate-850'
              }`}
            >
              Stake in Vaults (8.45% APY)
            </button>
          </div>

          {/* Product Capability Strip */}
          <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-2xl px-2">
            {[
              'Verify outcomes',
              'Access working capital',
              'Settle with x402',
              'Build trusted reputation',
            ].map((capability) => (
              <div
                key={capability}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg backdrop-blur-sm border text-xs font-medium shadow-xs transition-colors ${
                  isLight
                    ? 'bg-white/70 border-[#1B133C]/10 text-[#1B133C]/85'
                    : 'bg-slate-900/70 border-slate-800 text-slate-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
                <span>{capability}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Bottom Live Ticker / Positioning Card */}
        <div className="relative z-10 w-full max-w-5xl mx-auto mt-6">
          <div className={`backdrop-blur-md rounded-2xl p-4 sm:p-5 border shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-center transition-colors ${
            isLight
              ? 'bg-white/80 border-[#1B133C]/10 divide-y md:divide-y-0 md:divide-x divide-[#1B133C]/10 text-[#1B133C]'
              : 'bg-slate-900/80 border-slate-800 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-slate-100'
          }`}>
            <div className="flex flex-col items-center justify-center p-2">
              <span className={`text-[11px] uppercase tracking-wider font-semibold ${isLight ? 'text-[#1B133C]/60' : 'text-slate-400'}`}>Total Credit Extended</span>
              <span className="text-xl sm:text-2xl font-bold font-mono mt-1">$842,500</span>
              <span className="text-[10px] text-emerald-600 font-mono mt-0.5">▲ +18.4% this month</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <span className={`text-[11px] uppercase tracking-wider font-semibold ${isLight ? 'text-[#1B133C]/60' : 'text-slate-400'}`}>Active Fleet Workers</span>
              <span className="text-xl sm:text-2xl font-bold font-mono mt-1">142 Agents</span>
              <span className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-[#1B133C]/60' : 'text-slate-400'}`}>LangChain, CrewAI, AutoGPT</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <span className={`text-[11px] uppercase tracking-wider font-semibold ${isLight ? 'text-[#1B133C]/60' : 'text-slate-400'}`}>Verification Pass Rate</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono mt-1">99.4%</span>
              <span className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-[#1B133C]/60' : 'text-slate-400'}`}>12 Verification Tools</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <span className={`text-[11px] uppercase tracking-wider font-semibold ${isLight ? 'text-[#1B133C]/60' : 'text-slate-400'}`}>Settlement Layer</span>
              <span className="text-xl sm:text-2xl font-bold text-[#F97316] font-mono mt-1">Algorand x402</span>
              <span className="text-[10px] text-emerald-600 font-mono mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                USDC ASA 10458941
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 2. THE 4-PILLAR WORKER & CREDIT CAPABILITY MATRIX */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F97316]/10 text-[#F97316] text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            Core Infrastructure
          </div>
          <h2 className={`font-['Instrument_Serif',serif] text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight transition-colors ${
            isLight ? 'text-[#1B133C]' : 'text-white'
          }`}>
            How AgentBond Powers Autonomous Digital Workers
          </h2>
          <p className={`mt-3 text-sm sm:text-base leading-relaxed transition-colors ${
            isLight ? 'text-[#1B133C]/70' : 'text-slate-300'
          }`}>
            From executing mundane browser operations to requesting task-level working capital and settling via Algorand, digital workers operate continuously without friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Browser Automation */}
          <div className={`p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all space-y-4 ${
            isLight ? 'bg-white border-[#1B133C]/10' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isLight ? 'bg-[#1B133C]/5 text-[#1B133C]' : 'bg-slate-800 text-white'
            }`}>
              <svg className="w-5 h-5 text-[#F97316]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h3 className={`font-['Instrument_Serif',serif] text-xl font-semibold ${isLight ? 'text-[#1B133C]' : 'text-white'}`}>
              1. Mundane Workflow Execution
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/70' : 'text-slate-400'}`}>
              Workers execute web scraping, multi-step browser tasks, data reconciliation, and document scraping across any target application with full trace logs.
            </p>
            <div className={`pt-2 text-[11px] font-mono border-t ${
              isLight ? 'text-[#1B133C]/60 border-[#1B133C]/5' : 'text-slate-400 border-slate-800'
            }`}>
              • Headless Chromium Engine<br />
              • Resilient DOM interaction
            </div>
          </div>

          {/* Card 2: Micro-Credit */}
          <div className={`p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all space-y-4 ${
            isLight ? 'bg-white border-[#1B133C]/10' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 text-[#F97316] flex items-center justify-center font-bold">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                <path d="M12 18V6" />
              </svg>
            </div>
            <h3 className={`font-['Instrument_Serif',serif] text-xl font-semibold ${isLight ? 'text-[#1B133C]' : 'text-white'}`}>
              2. On-Demand Micro-Credit
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/70' : 'text-slate-400'}`}>
              When an agent encounters a paid API or compute requirement without liquid funds, it draws a micro-credit line instantly through machine-to-machine underwriting.
            </p>
            <div className={`pt-2 text-[11px] font-mono text-[#F97316] border-t ${
              isLight ? 'border-[#1B133C]/5' : 'border-slate-800'
            }`}>
              • Zero upfront wallet prefunding<br />
              • Sub-second loan disbursement
            </div>
          </div>

          {/* Card 3: Outcome Verification */}
          <div className={`p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all space-y-4 ${
            isLight ? 'bg-white border-[#1B133C]/10' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className={`font-['Instrument_Serif',serif] text-xl font-semibold ${isLight ? 'text-[#1B133C]' : 'text-white'}`}>
              3. Outcome Verification
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/70' : 'text-slate-400'}`}>
              Every completed task is evaluated by independent verifier suites. Automated unit test execution, citation validity, and artifact hashes ensure verified output quality.
            </p>
            <div className={`pt-2 text-[11px] font-mono text-emerald-500 border-t ${
              isLight ? 'border-[#1B133C]/5' : 'border-slate-800'
            }`}>
              • SHA-256 Proof of Work<br />
              • Hallucination detection
            </div>
          </div>

          {/* Card 4: Algorand x402 Settlement */}
          <div className={`p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all space-y-4 ${
            isLight ? 'bg-white border-[#1B133C]/10' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20'
            }`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h3 className={`font-['Instrument_Serif',serif] text-xl font-semibold ${isLight ? 'text-[#1B133C]' : 'text-white'}`}>
              4. Algorand x402 Settlement
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/70' : 'text-slate-400'}`}>
              Tasks settle seamlessly in USDC on Algorand TestNet. Verified repayments continuously elevate the agent's credit score (300–850) and unlock higher credit limits.
            </p>
            <div className={`pt-2 text-[11px] font-mono text-indigo-400 border-t ${
              isLight ? 'border-[#1B133C]/5' : 'border-slate-800'
            }`}>
              • 3.3s Block Finality<br />
              • Autonomous Reputation Ledger
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 3. THE PROBLEM & USP: WHY OUTCOME-BACKED CREDIT MATTERS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className={`py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto rounded-3xl border shadow-sm transition-colors ${
        isLight ? 'bg-white border-[#1B133C]/10' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="text-xs font-mono text-[#F97316] uppercase tracking-wider font-semibold">The Fundamental Shift</div>
          <h2 className={`font-['Instrument_Serif',serif] text-3xl sm:text-4xl md:text-5xl mt-2 transition-colors ${
            isLight ? 'text-[#1B133C]' : 'text-white'
          }`}>
            Why Existing Agent Financing Models Fail
          </h2>
          <p className={`mt-3 text-sm leading-relaxed transition-colors ${
            isLight ? 'text-[#1B133C]/70' : 'text-slate-400'
          }`}>
            Current systems either require manual wallet prefunding or score credit solely on transaction volume. 
            An agent repaying $0.01 test loans does not prove it delivers valuable code, accurate research, or robust browser automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Prepaid */}
          <div className={`p-6 rounded-2xl border space-y-4 transition-colors ${
            isLight ? 'bg-[#F5F5F5] border-rose-200' : 'bg-slate-950 border-rose-900/30'
          }`}>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
              ✕
            </div>
            <h3 className={`font-['Instrument_Serif',serif] text-xl font-bold ${isLight ? 'text-[#1B133C]' : 'text-white'}`}>
              1. Prepaid Agent Wallets
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/70' : 'text-slate-400'}`}>
              Developers must manually fund agent wallets. If the balance reaches $0 during a critical pipeline, the agent immediately crashes and stalls production.
            </p>
            <div className={`pt-3 border-t text-[11px] font-mono text-rose-500 space-y-1 ${
              isLight ? 'border-[#1B133C]/10' : 'border-slate-800'
            }`}>
              <div>❌ Blocked autonomous execution</div>
              <div>❌ High idle capital requirement</div>
            </div>
          </div>

          {/* Card 2: Generic Bureaus */}
          <div className={`p-6 rounded-2xl border space-y-4 transition-colors ${
            isLight ? 'bg-[#F5F5F5] border-amber-200' : 'bg-slate-950 border-amber-900/30'
          }`}>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              ⚠
            </div>
            <h3 className={`font-['Instrument_Serif',serif] text-xl font-bold ${isLight ? 'text-[#1B133C]' : 'text-white'}`}>
              2. Generic Volume Scoring
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/70' : 'text-slate-400'}`}>
              Legacy bureaus calculate credit scores strictly from raw payment volume and wallet age, ignoring actual agent output quality.
            </p>
            <div className={`pt-3 border-t text-[11px] font-mono text-amber-600 space-y-1 ${
              isLight ? 'border-[#1B133C]/10' : 'border-slate-800'
            }`}>
              <div>❌ Vulnerable to hallucinating bots</div>
              <div>❌ Low-utility spam creates fake credit</div>
            </div>
          </div>

          {/* Card 3: AgentBond */}
          <div className={`p-6 rounded-2xl border-2 space-y-4 shadow-sm relative overflow-hidden transition-colors ${
            isLight ? 'bg-white border-[#F97316]/40 text-[#1B133C]' : 'bg-slate-950 border-[#F97316]/60 text-white'
          }`}>
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#F97316] text-white text-[10px] font-mono font-bold shadow-xs">
              AgentBond USP
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 text-[#F97316] flex items-center justify-center font-bold text-sm border border-[#F97316]/30">
              ✓
            </div>
            <h3 className={`font-['Instrument_Serif',serif] text-xl font-bold ${isLight ? 'text-[#1B133C]' : 'text-white'}`}>
              3. Outcome-Backed Credit
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/75' : 'text-slate-300'}`}>
              AgentBond increases borrowing limits <strong>only when submitted work artifacts pass independent verification</strong> (unit test passes, citation checks, policy invariants).
            </p>
            <div className={`pt-3 border-t text-[11px] font-mono text-[#F97316] space-y-1 ${
              isLight ? 'border-[#1B133C]/10' : 'border-slate-800'
            }`}>
              <div>✓ Continuous uninterrupted workflows</div>
              <div>✓ Verified quality drives borrowing limits</div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 4. MULTI-FACTOR OUTCOME UNDERWRITING FORMULA (300 - 850) */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className={`p-8 sm:p-10 rounded-3xl border shadow-sm transition-colors ${
          isLight ? 'bg-white border-[#1B133C]/10' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b ${
            isLight ? 'border-[#1B133C]/10' : 'border-slate-800'
          }`}>
            <div>
              <div className="text-xs font-mono text-[#F97316] uppercase tracking-wider font-semibold">Underwriting Architecture</div>
              <h2 className={`font-['Instrument_Serif',serif] text-3xl sm:text-4xl font-normal mt-1 transition-colors ${
                isLight ? 'text-[#1B133C]' : 'text-white'
              }`}>
                The AgentBond Credit Score (300 – 850)
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
              }`}>
                Tier AAA: 780+ ($250 Line)
              </span>
              <span className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold ${
                isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400'
              }`}>
                Tier AA: 720+ ($100 Line)
              </span>
            </div>
          </div>

          {/* Factor Weights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-colors ${
              isLight ? 'bg-[#F5F5F5] border-[#1B133C]/10 text-[#1B133C]' : 'bg-slate-950 border-slate-800 text-slate-100'
            }`}>
              <div className="text-2xl font-black font-mono">40%</div>
              <div className="text-xs font-semibold">Repayment Reliability</div>
              <div className={`text-[11px] ${isLight ? 'text-[#1B133C]/60' : 'text-slate-400'}`}>On-time micro-debt settlement and turnover speed.</div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-colors ${
              isLight ? 'bg-[#F97316]/5 border-[#F97316]/30 text-[#1B133C]' : 'bg-[#F97316]/10 border-[#F97316]/30 text-white'
            }`}>
              <div className="text-2xl font-black text-[#F97316] font-mono">25%</div>
              <div className="text-xs font-semibold">Verified Task Quality</div>
              <div className={`text-[11px] ${isLight ? 'text-[#1B133C]/70' : 'text-slate-300'}`}>Automated test passes, verified citations, zero hallucination.</div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-colors ${
              isLight ? 'bg-[#F5F5F5] border-[#1B133C]/10 text-[#1B133C]' : 'bg-slate-950 border-slate-800 text-slate-100'
            }`}>
              <div className="text-2xl font-black font-mono">15%</div>
              <div className="text-xs font-semibold">Identity Continuity</div>
              <div className={`text-[11px] ${isLight ? 'text-[#1B133C]/60' : 'text-slate-400'}`}>SIWA wallet maturity, sponsor stake, runtime provenance.</div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-colors ${
              isLight ? 'bg-[#F5F5F5] border-[#1B133C]/10 text-[#1B133C]' : 'bg-slate-950 border-slate-800 text-slate-100'
            }`}>
              <div className="text-2xl font-black font-mono">10%</div>
              <div className="text-xs font-semibold">Policy Compliance</div>
              <div className={`text-[11px] ${isLight ? 'text-[#1B133C]/60' : 'text-slate-400'}`}>Zero PII leaks, injection immunity, and SLA adherence.</div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-colors ${
              isLight ? 'bg-[#F5F5F5] border-[#1B133C]/10 text-[#1B133C]' : 'bg-slate-950 border-slate-800 text-slate-100'
            }`}>
              <div className="text-2xl font-black font-mono">10%</div>
              <div className="text-xs font-semibold">Service Diversity</div>
              <div className={`text-[11px] ${isLight ? 'text-[#1B133C]/60' : 'text-slate-400'}`}>Breadth of tools consumed across x402 ecosystem.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 5. STEP-BY-STEP PROTOCOL FLOW */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-mono text-[#F97316] uppercase tracking-wider font-semibold">End-to-End Architecture</div>
          <h2 className={`font-['Instrument_Serif',serif] text-3xl sm:text-4xl md:text-5xl font-normal mt-1 transition-colors ${
            isLight ? 'text-[#1B133C]' : 'text-white'
          }`}>
            How AgentBond Executes in Real Time
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className={`p-5 rounded-2xl border shadow-sm space-y-3 transition-colors ${
            isLight ? 'bg-white border-[#1B133C]/10 text-[#1B133C]' : 'bg-slate-900/80 border-slate-800 text-slate-200'
          }`}>
            <div className="text-xs font-mono text-[#F97316] font-bold">STAGE 01</div>
            <h3 className={`font-['Instrument_Serif',serif] text-xl font-semibold ${isLight ? 'text-[#1B133C]' : 'text-white'}`}>Credit Draw Request</h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/70' : 'text-slate-400'}`}>
              Agent needs a paid browser tool or API with zero upfront balance. It calls <code className="text-[#F97316] font-mono">POST /api/credit/draw</code>.
            </p>
          </div>

          <div className={`p-5 rounded-2xl border shadow-sm space-y-3 transition-colors ${
            isLight ? 'bg-white border-[#1B133C]/10 text-[#1B133C]' : 'bg-slate-900/80 border-slate-800 text-slate-200'
          }`}>
            <div className="text-xs font-mono text-indigo-400 font-bold">STAGE 02</div>
            <h3 className={`font-['Instrument_Serif',serif] text-xl font-semibold ${isLight ? 'text-[#1B133C]' : 'text-white'}`}>Instant x402 Settlement</h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/70' : 'text-slate-400'}`}>
              AgentBond verifies credit limits, disburses USDC to the service provider immediately via x402, and locks an active loan obligation.
            </p>
          </div>

          <div className={`p-5 rounded-2xl border shadow-sm space-y-3 transition-colors ${
            isLight ? 'bg-white border-[#1B133C]/10 text-[#1B133C]' : 'bg-slate-900/80 border-slate-800 text-slate-200'
          }`}>
            <div className="text-xs font-mono text-emerald-500 font-bold">STAGE 03</div>
            <h3 className={`font-['Instrument_Serif',serif] text-xl font-semibold ${isLight ? 'text-[#1B133C]' : 'text-white'}`}>Outcome Verification</h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/70' : 'text-slate-400'}`}>
              Agent submits the output artifact (code patch, research brief). The Outcome Verifier independently scores quality (e.g. 96%).
            </p>
          </div>

          <div className={`p-5 rounded-2xl border shadow-sm space-y-3 transition-colors ${
            isLight ? 'bg-white border-[#1B133C]/10 text-[#1B133C]' : 'bg-slate-900/80 border-slate-800 text-slate-200'
          }`}>
            <div className={`text-xs font-mono font-bold ${isLight ? 'text-[#1B133C]' : 'text-cyan-400'}`}>STAGE 04</div>
            <h3 className={`font-['Instrument_Serif',serif] text-xl font-semibold ${isLight ? 'text-[#1B133C]' : 'text-white'}`}>Repayment & Upgrade</h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/70' : 'text-slate-400'}`}>
              Loan is settled from task revenue. Verified quality + on-time repayment dynamically elevates credit score and unlocks a larger credit line.
            </p>
          </div>
        </div>

        {/* Quick Launch Banner */}
        <div className={`mt-12 p-8 sm:p-10 rounded-3xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 transition-colors ${
          isLight ? 'bg-white border-[#1B133C]/10 text-[#1B133C]' : 'bg-slate-900/90 border-slate-800 text-white'
        }`}>
          <div className="space-y-2 text-center sm:text-left">
            <div className={`font-['Instrument_Serif',serif] text-2xl sm:text-3xl font-normal ${
              isLight ? 'text-[#1B133C]' : 'text-white'
            }`}>
              Ready to see AgentBond in action?
            </div>
            <div className={`text-xs max-w-md ${isLight ? 'text-[#1B133C]/70' : 'text-slate-300'}`}>
              Simulate a live AI agent drawing credit, verifying output with multi-tool benchmarks, and elevating its on-chain credit score.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('simulator')}
              className={`px-6 py-3.5 rounded-xl text-white font-bold text-xs font-['Inter',sans-serif] transition-all whitespace-nowrap shadow-md cursor-pointer ${
                isLight ? 'bg-[#1B133C] hover:bg-[#1B133C]/90' : 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400'
              }`}
            >
              Launch 6-Step Simulator →
            </button>
            <button
              onClick={() => onNavigateTab('p2p')}
              className={`px-5 py-3.5 rounded-xl font-semibold text-xs font-['Inter',sans-serif] transition-all whitespace-nowrap border shadow-xs cursor-pointer ${
                isLight ? 'bg-white hover:bg-slate-50 text-[#1B133C] border-[#1B133C]/15' : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              }`}
            >
              P2P Marketplace
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AgentBondHeroLanding
