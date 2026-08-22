import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { ThemeContext, type ThemeMode } from './ThemeContext'
import { AgentBondHeroLanding } from './components/AgentBondHeroLanding'
import { AgentBondBureau } from './components/AgentBondBureau'
import { AgentBondSimulator } from './components/AgentBondSimulator'
import { AgentBondLiquidityPool } from './components/AgentBondLiquidityPool'
import { AgentBondProfile } from './components/AgentBondProfile'
import { AgentBondTransactions } from './components/AgentBondTransactions'
import { P2PCreditMarketplace } from './components/P2PCreditMarketplace'
import ConnectWallet from './components/ConnectWallet'
import { getStoredSessionToken, getStoredSessionWallet, clearStoredSessionToken } from './utils/agentraAuth'

export type AgentBondTab =
  | 'overview'
  | 'bureau'
  | 'simulator'
  | 'pools'
  | 'p2p'
  | 'profile'
  | 'transactions'

export const AgentraHome: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AgentBondTab>('overview')
  const [simAgentId, setSimAgentId] = useState<string | null>(null)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark')
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredSessionToken() && getStoredSessionWallet()))

  const { activeAddress, signTransactions, signData } = useWallet()

  useEffect(() => {
    const sessionWallet = getStoredSessionWallet()
    if (sessionWallet && activeAddress && sessionWallet !== activeAddress) {
      clearStoredSessionToken()
      setIsAuthenticated(false)
    }
  }, [activeAddress])

  const walletSigner = {
    address: activeAddress || '',
    signTransactions,
    signData,
  }

  const handleSelectAgentForSimulation = (agentId: string) => {
    setSimAgentId(agentId)
    setActiveTab('simulator')
  }

  useEffect(() => {
    const root = document.documentElement
    if (themeMode === 'dark') {
      root.classList.add('dark')
    } else if (themeMode === 'light') {
      root.classList.remove('dark')
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [themeMode])

  const toggleTheme = () => {
    if (themeMode === 'dark') setThemeMode('light')
    else if (themeMode === 'light') setThemeMode('system')
    else setThemeMode('dark')
  }

  const isLight = themeMode === 'light'

  return (
    <ThemeContext.Provider value={{ themeMode, isLight }}>
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      } flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 font-['Rubik',sans-serif] relative overflow-x-hidden`}
    >
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FLOATING GLASSMORPHIC TOP NAVBAR */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-3 md:pt-4 px-3 sm:px-6 flex justify-center pointer-events-none transition-all duration-300">
        <nav
          className={`w-full max-w-6xl rounded-2xl px-4 md:px-6 py-2.5 flex items-center justify-between pointer-events-auto transition-all duration-300 ${
            isLight
              ? 'bg-white/95 text-slate-900 border border-slate-200 shadow-xl shadow-slate-300/40 backdrop-blur-2xl'
              : 'bg-slate-900/85 text-slate-100 border border-slate-800 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl'
          }`}
        >
          {/* Logo & Protocol Branding */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer select-none group shrink-0"
            onClick={() => setActiveTab('overview')}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center p-1.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-full h-full text-white fill-none stroke-current stroke-2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className={`font-extrabold text-base tracking-tight font-['Space_Grotesk',sans-serif] ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                AGENTBOND
              </span>
              <span className={`text-[9px] font-mono font-bold bg-cyan-500/20 border border-cyan-400/40 px-1.5 py-0.5 rounded-full hidden sm:inline-block ${
                isLight ? 'text-cyan-600' : 'text-cyan-400'
              }`}>
                M2M Credit
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={`hidden md:flex items-center space-x-1 text-xs font-semibold font-['Space_Grotesk',sans-serif] ${
            isLight ? 'text-slate-700' : 'text-slate-300'
          }`}>
            {([
              { id: 'overview', label: 'Overview' },
              { id: 'bureau', label: 'Credit Bureau' },
              { id: 'simulator', label: 'Credit Simulator' },
              { id: 'pools', label: 'Liquidity Pools' },
              { id: 'p2p', label: 'P2P Marketplace' },
              { id: 'profile', label: 'Operator Identity' },
              { id: 'transactions', label: 'Transactions & Audit' },
            ] as { id: AgentBondTab; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 ${
                  activeTab === id
                    ? isLight
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'bg-indigo-600/30 text-white font-bold border border-indigo-500/40 shadow-inner'
                    : isLight
                      ? 'text-slate-700 hover:text-indigo-700 hover:bg-indigo-50'
                      : 'text-slate-300 hover:text-cyan-300 hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Current Theme: ${themeMode.toUpperCase()} (Click to toggle)`}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                isLight
                  ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-cyan-400'
              }`}
            >
              <span>{themeMode === 'dark' ? '🌙 Dark' : themeMode === 'light' ? '☀️ Light' : '💻 System'}</span>
            </button>

            {/* Algorand TestNet Pill */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-mono ${
              isLight ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Algorand TestNet</span>
            </div>

            {/* Wallet Button */}
            {activeAddress ? (
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-indigo-700 hover:border-indigo-400'
                    : 'bg-slate-900 border-slate-700 text-cyan-300 hover:border-cyan-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{isAuthenticated ? `${activeAddress.slice(0, 5)}...${activeAddress.slice(-4)}` : 'Sign in'}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] font-['Space_Grotesk',sans-serif]"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* MOBILE NAV STRIP */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t p-2 flex items-center justify-around text-[10px] font-mono backdrop-blur-xl transition-colors duration-300 ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-600'
          : 'bg-slate-950/95 border-slate-800 text-slate-400'
      }`}>
        {([
          { id: 'overview', label: 'Home' },
          { id: 'bureau', label: 'Bureau' },
          { id: 'simulator', label: 'Simulator' },
          { id: 'pools', label: 'Pools' },
          { id: 'profile', label: 'Identity' },
        ] as { id: AgentBondTab; label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center p-1 transition-colors ${
              activeTab === id
                ? isLight ? 'text-indigo-600 font-bold' : 'text-cyan-400 font-bold'
                : ''
            }`}
          >
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 w-full pt-20 md:pt-24 pb-16">
        {activeTab === 'overview' && (
          <div className="animate-fade-in transition-all duration-300">
            <AgentBondHeroLanding
              onNavigateTab={(tab) => setActiveTab(tab as AgentBondTab)}
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
              activeAddress={activeAddress}
            />
          </div>
        )}

        {activeTab === 'bureau' && (
          <div className="animate-fade-in transition-all duration-300">
            <AgentBondBureau
              onSelectAgentForSim={handleSelectAgentForSimulation}
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
              activeAddress={activeAddress}
            />
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="animate-fade-in transition-all duration-300">
            <AgentBondSimulator
              initialAgentId={simAgentId}
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
              activeAddress={activeAddress}
            />
          </div>
        )}

        {activeTab === 'pools' && (
          <div className="animate-fade-in transition-all duration-300">
            <AgentBondLiquidityPool
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
              activeAddress={activeAddress}
            />
          </div>
        )}

        {activeTab === 'p2p' && (
          <div className="animate-fade-in transition-all duration-300">
            <P2PCreditMarketplace
              walletAddress={activeAddress ?? undefined}
              isAuthenticated={isAuthenticated}
              onRequireAuth={() => setActiveTab('profile')}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-fade-in transition-all duration-300">
            <AgentBondProfile
              activeAddress={activeAddress}
              walletSigner={walletSigner}
              onAuthChange={setIsAuthenticated}
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
              onNavigateOverview={() => setActiveTab('overview')}
            />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="animate-fade-in transition-all duration-300">
            <AgentBondTransactions
              activeAddress={activeAddress}
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className={`border-t py-8 text-center text-xs backdrop-blur-sm font-['Space_Grotesk',sans-serif] transition-colors duration-300 ${
        isLight
          ? 'border-slate-200 bg-white/80 text-slate-600'
          : 'border-slate-800 bg-slate-950/90 text-slate-400'
      }`}>
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            AGENTBOND • Machine-to-Machine Trust & Outcome-Backed Credit Protocol for Autonomous AI Agents
          </p>
          <p className={`font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            Powered by x402 Protocol on Algorand TestNet • USDC ASA 10458941 • Multi-Factor Outcome Underwriting
          </p>
        </div>
      </footer>

      {/* Wallet Connection Modal */}
      <ConnectWallet
        openModal={isWalletModalOpen}
        closeModal={() => setIsWalletModalOpen(false)}
      />
    </div>
    </ThemeContext.Provider>
  )
}

export default AgentraHome
