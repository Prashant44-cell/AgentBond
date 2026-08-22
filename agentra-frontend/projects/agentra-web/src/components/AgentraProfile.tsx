import React, { useState } from 'react'

interface AgentraProfileProps {
  activeAddress: string | null
  walletSigner?: any
  onOpenWalletModal: () => void
  onNavigateOverview?: () => void
}

export const AgentraProfile: React.FC<AgentraProfileProps> = ({
  activeAddress,
  onOpenWalletModal,
  onNavigateOverview,
}) => {
  const [showLiveAuditModal, setShowLiveAuditModal] = useState<boolean>(false)
  const [copiedTx, setCopiedTx] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedTx(text)
    setTimeout(() => setCopiedTx(null), 2000)
  }

  return (
    <div className="h-screen w-full flex flex-col bg-white text-slate-800 overflow-hidden relative font-['Inter',sans-serif] select-none">
      {/* Background Fullscreen Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 pointer-events-none"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
      />

      {/* Subtle Backdrop Tint */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-0 pointer-events-none" />

      {/* Exact Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 lg:px-20 py-4 font-['Inter',sans-serif] border-b border-slate-200/50 bg-white/40 backdrop-blur-md">
        {/* Left Logo */}
        <div
          className="flex items-center space-x-2 cursor-pointer select-none group"
          onClick={onNavigateOverview}
        >
          <span className="text-indigo-600 text-lg group-hover:rotate-45 transition-transform">✦</span>
          <span className="text-xl font-semibold tracking-tight text-slate-900 font-['Space_Grotesk',sans-serif]">
            Nexora
          </span>
          <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded-full ml-1">
            Agentra Core
          </span>
        </div>

        {/* Right Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-500 font-medium">
          <button onClick={onNavigateOverview} className="hover:text-slate-900 transition-colors font-medium">
            Home
          </button>
          <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          <a href="#about" className="hover:text-slate-900 transition-colors">About</a>
          <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
        </div>

        {/* Action Button & Wallet Access Point #2 */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowLiveAuditModal(true)}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-300/80"
          >
            <svg className="w-3.5 h-3.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <span>Audit Receipts</span>
          </button>

          {activeAddress ? (
            <button
              onClick={() => setShowLiveAuditModal(true)}
              className="rounded-full px-4 py-2 text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center space-x-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono">{`${activeAddress.slice(0, 5)}...${activeAddress.slice(-4)}`}</span>
            </button>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="rounded-full px-5 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section Container (Flex Col Center, Fills 100vh with Navbar) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-6 md:pt-8 px-4 w-full max-w-6xl mx-auto overflow-hidden">
        {/* 1. Badge */}
        <div className="mb-4 md:mb-5 inline-flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white/90 shadow-sm px-4 py-1.5 text-xs sm:text-sm text-slate-600 font-['Inter',sans-serif] backdrop-blur-md">
          <span>Now with GPT-5 support ✨</span>
        </div>

        {/* 2. Headline */}
        <h1 className="text-center font-['Instrument_Serif',serif] text-4xl sm:text-5xl md:text-6xl lg:text-[4.75rem] leading-[0.95] tracking-tight text-slate-900 max-w-2xl">
          The Future of <span className="italic font-normal text-indigo-950">Smarter</span> Automation
        </h1>

        {/* 3. Subheadline */}
        <p className="mt-3 md:mt-4 text-center text-xs sm:text-sm md:text-base text-slate-600 max-w-[620px] leading-relaxed font-['Inter',sans-serif]">
          Automate your busywork with intelligent agents that learn, adapt, and execute—so your team can focus on what matters most.
        </p>

        {/* 4. CTA Buttons */}
        <div className="mt-4 md:mt-5 flex items-center gap-3">
          <button
            onClick={() => setShowLiveAuditModal(true)}
            className="rounded-full px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Book a demo
          </button>
          <button
            onClick={() => setShowLiveAuditModal(true)}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border-0 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:bg-slate-50 flex items-center justify-center transition-all group"
            title="Preview Demo"
          >
            <svg className="w-4 h-4 fill-slate-900 text-slate-900 group-hover:scale-110 transition-transform ml-0.5" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>
        </div>

        {/* 5. Custom Coded Dashboard Preview (Frosted Glass Wrapper) */}
        <div
          className="mt-6 md:mt-7 w-full max-w-5xl rounded-2xl overflow-hidden p-2.5 sm:p-3 md:p-4 text-[11px] select-none"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Dashboard Frame Inner */}
          <div className="bg-white/95 rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                  N
                </div>
                <span className="font-semibold text-slate-800 text-xs">Nexora</span>
                <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>

              <div className="flex items-center space-x-2 bg-white border border-slate-200/80 rounded-lg px-3 py-1 text-slate-400 w-64 shadow-xs">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span className="text-[10px]">Search...</span>
                <span className="text-[9px] ml-auto bg-slate-100 text-slate-500 px-1 rounded font-mono">⌘K</span>
              </div>

              <div className="flex items-center space-x-3">
                <button className="px-2.5 py-1 rounded-md bg-indigo-600 text-white text-[10px] font-semibold hover:bg-indigo-700">
                  Move Money
                </button>
                <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                  JB
                </div>
              </div>
            </div>

            {/* Content Area: Sidebar + Main */}
            <div className="flex">
              {/* Sidebar (w-40) */}
              <div className="w-40 border-r border-slate-100 p-3 space-y-4 bg-slate-50/40 hidden sm:block shrink-0">
                <div className="space-y-1">
                  <div className="px-2 py-1 rounded-md bg-slate-200/70 text-slate-900 font-medium text-[11px] flex items-center justify-between">
                    <span>Home</span>
                  </div>
                  <div className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-[11px] flex items-center justify-between">
                    <span>Tasks</span>
                    <span className="bg-slate-200 text-slate-700 text-[9px] px-1 rounded-full font-bold">10</span>
                  </div>
                  <div className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-[11px]">Transactions</div>
                  <div className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-[11px] flex items-center justify-between">
                    <span>Payments</span>
                    <svg className="w-2.5 h-2.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  <div className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-[11px]">Cards</div>
                  <div className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-[11px]">Capital</div>
                  <div className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-[11px] flex items-center justify-between">
                    <span>Accounts</span>
                    <svg className="w-2.5 h-2.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block px-2">Workflows</span>
                  <div className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 rounded-md text-[10px]">Trade routes</div>
                  <div className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 rounded-md text-[10px]">Payments</div>
                  <div className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 rounded-md text-[10px]">Notifications</div>
                  <div className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 rounded-md text-[10px]">Settings</div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-3.5 space-y-3 bg-slate-50/20">
                {/* Greeting & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900">Welcome, Jane</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-medium shadow-xs">
                      Send
                    </button>
                    <button className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px]">
                      Request
                    </button>
                    <button className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px]">
                      Transfer
                    </button>
                    <button className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px]">
                      Deposit
                    </button>
                    <button className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px]">
                      Pay Bill
                    </button>
                    <button className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px]">
                      Create Invoice
                    </button>
                    <span className="text-[9px] text-slate-400 ml-1 cursor-pointer hover:text-slate-600">+ Customize</span>
                  </div>
                </div>

                {/* Two Equal Width Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Balance Card */}
                  <div className="p-3 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[11px] font-semibold text-slate-700">Mercury Balance</span>
                        <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="m9 12 2 2 4-4"/>
                        </svg>
                      </div>
                      <span className="text-[10px] text-slate-400">Last 30 Days</span>
                    </div>

                    <div className="flex items-baseline space-x-1">
                      <span className="text-lg font-bold text-slate-900 font-mono tracking-tight">$8,450,190</span>
                      <span className="text-xs text-slate-400 font-mono">.32</span>
                    </div>

                    <div className="flex items-center space-x-3 text-[10px]">
                      <span className="text-emerald-600 font-semibold font-mono">+$1.8M</span>
                      <span className="text-rose-500 font-semibold font-mono">-$900K</span>
                    </div>

                    {/* SVG Cubic Bézier Area Chart */}
                    <div className="h-16 w-full pt-1">
                      <svg viewBox="0 0 300 70" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0 55 C 40 50, 70 30, 110 38 C 150 46, 190 20, 230 25 C 260 28, 280 10, 300 8 L 300 70 L 0 70 Z"
                          fill="url(#chartGrad)"
                        />
                        <path
                          d="M 0 55 C 40 50, 70 30, 110 38 C 150 46, 190 20, 230 25 C 260 28, 280 10, 300 8"
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Accounts Card */}
                  <div className="p-3 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700">Accounts</span>
                      <div className="flex items-center space-x-1 text-slate-400">
                        <svg className="w-3 h-3 cursor-pointer hover:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        <svg className="w-3 h-3 cursor-pointer hover:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1 font-mono">
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-50 text-xs">
                        <span className="text-slate-600">Credit</span>
                        <span className="font-semibold text-slate-900">$98,125.50</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-50 text-xs">
                        <span className="text-slate-600">Treasury</span>
                        <span className="font-semibold text-slate-900">$6,750,200.00</span>
                      </div>
                      <div className="flex items-center justify-between py-1 text-xs">
                        <span className="text-slate-600">Operations</span>
                        <span className="font-semibold text-slate-900">$1,592,864.82</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="p-3 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700">Recent Transactions</span>
                    <span className="text-[10px] text-indigo-600 font-medium cursor-pointer">View all</span>
                  </div>

                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-100 text-[10px]">
                        <th className="pb-1.5 font-medium">Date</th>
                        <th className="pb-1.5 font-medium">Description</th>
                        <th className="pb-1.5 font-medium text-right">Amount</th>
                        <th className="pb-1.5 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-mono">
                      <tr>
                        <td className="py-1.5 text-slate-500">Today</td>
                        <td className="py-1.5 font-sans font-medium text-slate-800">AWS Infrastructure</td>
                        <td className="py-1.5 text-right text-rose-500 font-semibold">-$5,200.00</td>
                        <td className="py-1.5 text-right">
                          <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            Pending
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-500">Aug 21</td>
                        <td className="py-1.5 font-sans font-medium text-slate-800">Client Payment (Stripe)</td>
                        <td className="py-1.5 text-right text-emerald-600 font-semibold">+$125,000.00</td>
                        <td className="py-1.5 text-right">
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            Completed
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-500">Aug 20</td>
                        <td className="py-1.5 font-sans font-medium text-slate-800">Payroll Execution</td>
                        <td className="py-1.5 text-right text-slate-800 font-semibold">-$85,450.00</td>
                        <td className="py-1.5 text-right">
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            Completed
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-500">Aug 19</td>
                        <td className="py-1.5 font-sans font-medium text-slate-800">Office Supplies</td>
                        <td className="py-1.5 text-right text-slate-800 font-semibold">-$1,200.00</td>
                        <td className="py-1.5 text-right">
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            Completed
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* On-Chain Receipts Modal */}
      {showLiveAuditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                <h3 className="font-bold text-base text-white">Algorand TestNet Audit Receipts</h3>
              </div>
              <button
                onClick={() => setShowLiveAuditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold block">/verify-task (Invoice BEC Check)</span>
                  <span className="text-slate-400 text-[10px]">TX: tx_algo_891238 • 0.01 USDC</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded">SUSPICIOUS (94%)</span>
                  <button
                    onClick={() => handleCopy('tx_algo_891238')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    {copiedTx === 'tx_algo_891238' ? (
                      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold block">/verify-email (Phishing Classifier)</span>
                  <span className="text-slate-400 text-[10px]">TX: tx_algo_891237 • 0.01 USDC</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">SAFE (98%)</span>
                  <button
                    onClick={() => handleCopy('tx_algo_891237')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    {copiedTx === 'tx_algo_891237' ? (
                      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLiveAuditModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Close Audit Receipts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentraProfile
