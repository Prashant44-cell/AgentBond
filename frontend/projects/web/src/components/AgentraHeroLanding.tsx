import React from 'react'

interface AgentBondHeroLandingProps {
  onLaunchSuite: () => void
  onOpenProfile: () => void
  onOpenDiscovery: () => void
  onOpenWalletModal: () => void
  activeAddress: string | null
}

export const AgentBondHeroLanding: React.FC<AgentBondHeroLandingProps> = ({
  onLaunchSuite,
  onOpenProfile,
  onOpenDiscovery,
  onOpenWalletModal,
  activeAddress,
}) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-center items-center bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-['Inter',sans-serif] pt-24 pb-12">
      {/* Background Video Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-[130%] object-cover object-top opacity-35 brightness-90 filter contrast-110"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260714_113715_c7e0daa0-8bdd-4486-a2da-040901f8f0ea.mp4"
            type="video/mp4"
          />
        </video>
        {/* Subtle Dark Radial Vignette for maximum text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/95 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Center Hero Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center justify-center my-auto py-8">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center space-x-2 rounded-xl border border-cyan-400/40 bg-slate-900/60 backdrop-blur-xl px-4 py-1.5 text-xs font-medium text-cyan-300 shadow-lg shadow-cyan-500/15 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-semibold">x402 Protocol on Algorand</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-200">Pay-Per-Use Pre-Action Intelligence</span>
        </div>

        {/* Heading in Instrument Serif */}
        <h1 className="font-['Instrument_Serif',serif] text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-white max-w-4xl drop-shadow-md">
          <span className="block">Verify risky actions</span>
          <span className="block italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-300">
            before AI agents act
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed text-slate-200 drop-shadow">
          Eliminate catastrophic mistakes in autonomous agent workflows. Deploy 12 pay-per-use pre-action verification engines for invoices, emails, contracts, and product listings at <strong className="text-emerald-300 font-mono font-semibold">$0.01 USDC</strong> per check — zero API keys required.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={onLaunchSuite}
            className="w-full sm:w-auto rounded-xl bg-white hover:bg-slate-100 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-[0px_4px_20px_rgba(0,210,196,0.35)] hover:shadow-[0px_6px_28px_rgba(0,210,196,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <span>Launch AI Guardian Suite</span>
            <span className="text-cyan-600 font-bold">➔</span>
          </button>

          <button
            onClick={onOpenDiscovery}
            className="w-full sm:w-auto rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/20 hover:border-cyan-400/60 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-black/30"
          >
            <span>🤖 Request Custom Agent</span>
          </button>
        </div>

        {/* Value Highlights Pill Row */}
        <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-6 max-w-xl w-full text-center">
          <div className="p-3 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-lg">
            <span className="text-xs sm:text-sm font-bold text-cyan-300 font-mono block">$0.01 USDC</span>
            <span className="text-[10px] sm:text-xs text-slate-300">Micro-metered per check</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-lg">
            <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono block">&lt; 2.0s</span>
            <span className="text-[10px] sm:text-xs text-slate-300">Algorand Fast Finality</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-lg">
            <span className="text-xs sm:text-sm font-bold text-cyan-300 font-mono block">Zero Keys</span>
            <span className="text-[10px] sm:text-xs text-slate-300">No Prompt Key Leakage</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentBondHeroLanding
