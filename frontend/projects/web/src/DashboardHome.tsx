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
import ChooseUsernameModal from './components/ChooseUsernameModal'
import {
  getStoredSessionToken,
  getStoredSessionWallet,
  clearStoredSessionToken,
  fetchProfileData,
  AuthUserProfile,
} from './utils/auth'

export type AgentBondTab =
  | 'overview'
  | 'bureau'
  | 'simulator'
  | 'pools'
  | 'p2p'
  | 'profile'
  | 'transactions'

export const AgentBondHome: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AgentBondTab>('overview')
  const [simAgentId, setSimAgentId] = useState<string | null>(null)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false)
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState<boolean>(false)
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('agentbond_theme_mode') as ThemeMode
    return saved || 'light'
  })
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredSessionToken() && getStoredSessionWallet()))

  const { activeAddress, signTransactions, signData, wallets } = useWallet()
  const [algoBalance, setAlgoBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!activeAddress) { setAlgoBalance(null); return }
    fetch(`https://testnet-api.algonode.cloud/v2/accounts/${activeAddress}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setAlgoBalance(typeof data?.amount === 'number' ? data.amount / 1_000_000 : null))
      .catch(() => setAlgoBalance(null))
  }, [activeAddress])

  const handleLogout = async () => {
    clearStoredSessionToken()
    setIsAuthenticated(false)
    setUserProfile(null)
    setActiveTab('overview')
    const activeWallet = wallets.find((wallet) => wallet.isActive)
    if (activeWallet) await activeWallet.disconnect()
  }

  // Load user profile and detect if username registration is needed
  const loadProfile = async (address: string) => {
    try {
      const data = await fetchProfileData(address)
      if (data.user) {
        setUserProfile(data.user)
        if (!data.user.username && getStoredSessionToken()) {
          setIsUsernameModalOpen(true)
        }
      }
    } catch {
      // Ignored if unauthenticated
    }
  }

  useEffect(() => {
    const sessionWallet = getStoredSessionWallet()
    if (sessionWallet && activeAddress && sessionWallet !== activeAddress) {
      clearStoredSessionToken()
      setIsAuthenticated(false)
      setUserProfile(null)
    } else if (activeAddress) {
      loadProfile(activeAddress)
    }
  }, [activeAddress, isAuthenticated])

  const walletSigner = {
    address: activeAddress || '',
    signTransactions,
    signData,
  }

  const handleSelectAgentForSimulation = (agentId: string) => {
    setSimAgentId(agentId)
    setActiveTab('simulator')
  }

  // Listen to OS system color scheme changes in real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches)
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Calculate effective dark/light state
  const effectiveIsDark = themeMode === 'dark' || (themeMode === 'system' && systemIsDark)
  const isLight = !effectiveIsDark

  // Sync document class and persistence
  useEffect(() => {
    localStorage.setItem('agentbond_theme_mode', themeMode)
    const root = document.documentElement
    if (effectiveIsDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [themeMode, effectiveIsDark])

  const toggleTheme = () => {
    if (themeMode === 'dark') setThemeMode('light')
    else if (themeMode === 'light') setThemeMode('system')
    else setThemeMode('dark')
  }

  return (
    <ThemeContext.Provider value={{ themeMode, isLight }}>
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isLight ? 'bg-[#F5F5F5] text-[#1B133C]' : 'bg-slate-950 text-slate-100'
      } flex flex-col selection:bg-[#F97316]/20 selection:text-[#1B133C] font-['Inter',sans-serif] relative overflow-x-hidden`}
    >
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FLOATING GLASSMORPHIC TOP NAVBAR (Image 1 - Unified Across All Pages) */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-3 md:pt-4 px-3 sm:px-6 flex justify-center pointer-events-none transition-all duration-300">
        <nav
          className={`w-full max-w-6xl rounded-2xl px-4 md:px-6 py-2.5 flex items-center justify-between pointer-events-auto transition-all duration-300 ${
            isLight
              ? 'bg-white/85 text-[#1B133C] border border-[#1B133C]/10 shadow-lg shadow-slate-200/50 backdrop-blur-2xl'
              : 'bg-slate-900/85 text-slate-100 border border-slate-800 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl'
          }`}
        >
          {/* Logo & Protocol Branding */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer select-none group shrink-0"
            onClick={() => setActiveTab('overview')}
          >
            <img
              src="/agentbond-logo.png"
              alt="AgentBond Logo"
              className="w-8 h-8 rounded-xl object-contain shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className={`text-base font-extrabold tracking-tight transition-colors ${
                isLight ? 'text-[#1B133C]' : 'text-white'
              }`}>
                AgentBond
              </span>
              <span className="text-[9px] font-mono text-[#F97316] tracking-widest uppercase font-semibold">
                M2M Credit
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden lg:flex items-center space-x-1 text-xs font-semibold">
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
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab === id
                    ? isLight
                      ? 'bg-[#1B133C] text-white font-bold shadow-sm'
                      : 'bg-indigo-600/30 text-white font-bold border border-indigo-500/40 shadow-inner'
                    : isLight
                      ? 'text-[#1B133C]/75 hover:text-[#1B133C] hover:bg-[#1B133C]/5 font-medium'
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
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isLight
                  ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-cyan-400'
              }`}
            >
              <span>{themeMode === 'dark' ? '🌙 Dark' : themeMode === 'light' ? '☀️ Light' : '💻 System'}</span>
            </button>

            {/* Algorand TestNet Pill */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-mono ${
              isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Algorand TestNet</span>
            </div>

            {/* Wallet / Username Button */}
            {activeAddress ? (
              <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-[#1B133C] hover:border-[#1B133C]/40'
                    : 'bg-slate-900 border-slate-700 text-cyan-300 hover:border-cyan-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>
                  {isAuthenticated
                    ? userProfile?.username
                      ? `@${userProfile.username}`
                      : `${activeAddress.slice(0, 5)}...${activeAddress.slice(-4)}`
                    : 'Sign in'}
                </span>
              </button>
              {isAuthenticated && (
                <button onClick={handleLogout} className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-[10px] font-bold hover:bg-rose-100">
                  Logout
                </button>
              )}
              <span className="hidden lg:inline text-[10px] font-mono text-slate-500">{algoBalance === null ? 'Balance loading' : `${algoBalance.toFixed(2)} ALGO`}</span>
              </div>
            ) : (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] font-['Space_Grotesk',sans-serif] cursor-pointer"
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
      <main className={activeTab === 'overview' ? 'flex-1 w-full flex flex-col' : 'flex-1 w-full pt-16 sm:pt-20 md:pt-24 pb-16 px-2 sm:px-4 md:px-6 max-w-7xl mx-auto flex flex-col'}>
        {activeTab === 'overview' && (
          <div className="animate-fade-in transition-all duration-300 w-full flex-1 flex flex-col">
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
              signTransactions={signTransactions}
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
              currentUsername={userProfile?.username || undefined}
              isAuthenticated={isAuthenticated}
              signData={signData}
              onRequireAuth={() => setActiveTab('profile')}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-fade-in transition-all duration-300">
            <AgentBondProfile
              activeAddress={activeAddress}
              walletSigner={walletSigner}
              userProfile={userProfile}
              onAuthChange={(auth) => {
                setIsAuthenticated(auth)
                if (auth && activeAddress) loadProfile(activeAddress)
              }}
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
              onOpenUsernameModal={() => setIsUsernameModalOpen(true)}
              onNavigateOverview={() => setActiveTab('overview')}
            />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="animate-fade-in transition-all duration-300">
            <AgentBondTransactions
              activeAddress={activeAddress}
              username={userProfile?.username || undefined}
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className={`border-t py-8 text-center text-xs backdrop-blur-sm font-['Space_Grotesk',sans-serif] transition-colors duration-300 mt-auto ${
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

      {/* Choose Unique Username Modal */}
      <ChooseUsernameModal
        isOpen={isUsernameModalOpen}
        activeAddress={activeAddress || ''}
        onUsernameClaimed={(updated) => {
          setUserProfile(updated)
          setIsUsernameModalOpen(false)
        }}
        onClose={() => setIsUsernameModalOpen(false)}
      />
    </div>
    </ThemeContext.Provider>
  )
}

export default AgentBondHome
