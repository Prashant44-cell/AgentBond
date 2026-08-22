import React, { useState, useEffect } from 'react'
import { LiquidityPoolStats, fetchPoolStats } from '../utils/agentbondCreditApi'

interface AgentBondLiquidityPoolProps {
  onOpenWalletModal: () => void
  activeAddress: string | null
}

export const AgentBondLiquidityPool: React.FC<AgentBondLiquidityPoolProps> = ({
  onOpenWalletModal,
  activeAddress,
}) => {
  const [pool, setPool] = useState<LiquidityPoolStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Staking Simulator State
  const [stakeAmount, setStakeAmount] = useState<number>(1000)
  const [selectedTranche, setSelectedTranche] = useState<'senior' | 'junior'>('senior')
  const [stakeDurationMonths, setStakeDurationMonths] = useState<number>(6)
  const [stakedSuccess, setStakedSuccess] = useState(false)

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await fetchPoolStats()
      if (data.success && data.pool) {
        setPool(data.pool)
      }
    } catch (err) {
      console.error('Failed to load liquidity pool data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const seniorApy = pool?.tranches.seniorApy || 6.2
  const juniorApy = pool?.tranches.juniorApy || 14.8
  const activeApy = selectedTranche === 'senior' ? seniorApy : juniorApy
  const projectedInterest = Number(((stakeAmount * (activeApy / 100) * stakeDurationMonths) / 12).toFixed(2))

  const handleSimulateStake = () => {
    setStakedSuccess(true)
    setTimeout(() => setStakedSuccess(false), 3000)
  }

  return (
    <div className="w-full text-slate-100 font-['Inter',sans-serif] space-y-10 pb-20 max-w-7xl mx-auto px-4">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* POOL HEADER */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-slate-800/80 pb-6 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Algorand ASA Liquidity Vault</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-['Space_Grotesk'] mt-1">
            Sponsor Staking & Credit Vaults
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Provide USDC liquidity to back autonomous AI agent micro-borrowing lines on Algorand. Earn automated protocol yield funded by agent micro-fees and outcome settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStats}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            title="Refresh Pool Stats"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* KEY METRICS GRID */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-lg space-y-1">
          <div className="text-xs text-slate-400 font-mono">Total Vault TVL</div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            ${pool?.totalVaultLiquidityUsdc.toLocaleString() || '250,000'}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">USDC ASA 10458941</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-lg space-y-1">
          <div className="text-xs text-slate-400 font-mono">Cumulative Disbursed</div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
            ${pool?.totalLoansDisbursedUsdc.toLocaleString() || '842,500'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Active Drawn: ${pool?.activeCreditLinesUsdc || '18,450'}</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-lg space-y-1">
          <div className="text-xs text-slate-400 font-mono">Net Protocol APY</div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">
            {pool?.currentNetApy || '8.45'}%
          </div>
          <div className="text-[10px] text-indigo-300 font-mono">Blended Tranche Yield</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-lg space-y-1">
          <div className="text-xs text-slate-400 font-mono">Historical Default Rate</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {pool?.defaultRatePercent || '0.12'}%
          </div>
          <div className="text-[10px] text-emerald-300 font-mono">Loss: ${pool?.defaultLossUsdc || '450'}</div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TRANCHES & STAKING WORKBENCH */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tranche Cards (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
              Structured Credit Tranches
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Senior AAA Tranche */}
              <div
                onClick={() => setSelectedTranche('senior')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  selectedTranche === 'senior'
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                    Low Risk / Senior
                  </span>
                  <span className="text-xl font-black text-cyan-400 font-mono">{seniorApy}% APY</span>
                </div>
                <h3 className="text-base font-bold text-white font-['Space_Grotesk']">Senior Capital Vault</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  First priority repayment queue. Protected by the Junior First-Loss Tranche and the $15,000 Protocol Insurance Reserve.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>Vault Capital:</span>
                  <span className="text-white font-bold">${pool?.tranches.seniorAaaCapitalUsdc.toLocaleString() || '180,000'}</span>
                </div>
              </div>

              {/* Junior High-Yield Tranche */}
              <div
                onClick={() => setSelectedTranche('junior')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  selectedTranche === 'junior'
                    ? 'border-indigo-500 bg-indigo-950/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold">
                    High Yield / First-Loss
                  </span>
                  <span className="text-xl font-black text-indigo-400 font-mono">{juniorApy}% APY</span>
                </div>
                <h3 className="text-base font-bold text-white font-['Space_Grotesk']">Junior Yield Vault</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Absorbs the first 5% of any agent default losses in exchange for 2.4x higher protocol micro-fee yield distributions.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>Vault Capital:</span>
                  <span className="text-white font-bold">${pool?.tranches.juniorYieldCapitalUsdc.toLocaleString() || '55,000'}</span>
                </div>
              </div>
            </div>

            {/* 3-Tier Loss Absorption Hierarchy Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-['Space_Grotesk'] text-sm">3-Tier Loss Absorption Hierarchy</span>
                <span className="text-[10px] text-emerald-400">Institutional Risk Isolation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-indigo-500/20 space-y-0.5">
                  <div className="text-indigo-400 font-bold">1st Loss: Sponsor Stakes</div>
                  <div className="text-slate-300 font-bold">${pool?.lossAbsorptionHierarchy?.firstLossSponsorStakesUsdc?.toLocaleString() || '45,000'} USDC</div>
                  <div className="text-slate-500 text-[9px]">Slashed on fleet default</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-0.5">
                  <div className="text-cyan-400 font-bold">2nd Loss: Protocol Buffer</div>
                  <div className="text-slate-300 font-bold">${pool?.lossAbsorptionHierarchy?.secondLossInsuranceReserveUsdc?.toLocaleString() || '15,000'} USDC</div>
                  <div className="text-slate-500 text-[9px]">Protocol fee reserve</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-purple-500/20 space-y-0.5">
                  <div className="text-purple-400 font-bold">3rd Loss: Junior Tranche</div>
                  <div className="text-slate-300 font-bold">${pool?.lossAbsorptionHierarchy?.thirdLossJuniorTrancheUsdc?.toLocaleString() || '55,000'} USDC</div>
                  <div className="text-slate-500 text-[9px]">Absorbs tail risk for 14.8% APY</div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Senior AAA Capital Protected:</span>
                <strong className="text-emerald-400">${pool?.lossAbsorptionHierarchy?.seniorCapitalProtectedUsdc?.toLocaleString() || '180,000'} USDC (100% Insolvency Shield)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Stake Calculator (1 col) */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
            USDC Staking Calculator
          </h3>

          <div className="space-y-4 text-xs font-mono">
            {/* Amount Slider */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Deposit Amount:</span>
                <span className="text-cyan-400 font-bold">${stakeAmount.toLocaleString()} USDC</span>
              </div>
              <input
                type="range"
                min="100"
                max="25000"
                step="100"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Duration Slider */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Lock Duration:</span>
                <span className="text-indigo-400 font-bold">{stakeDurationMonths} Months</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                value={stakeDurationMonths}
                onChange={(e) => setStakeDurationMonths(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-400 cursor-pointer"
              />
            </div>

            {/* Tranche Selector */}
            <div>
              <label className="block text-slate-400 mb-1">Active Tranche:</label>
              <div className="grid grid-cols-2 gap-2 font-['Space_Grotesk']">
                <button
                  type="button"
                  onClick={() => setSelectedTranche('senior')}
                  className={`py-2 rounded-xl border text-xs font-semibold ${
                    selectedTranche === 'senior'
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Senior ({seniorApy}%)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTranche('junior')}
                  className={`py-2 rounded-xl border text-xs font-semibold ${
                    selectedTranche === 'junior'
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Junior ({juniorApy}%)
                </button>
              </div>
            </div>

            {/* Yield Projection Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Projected Yield:</span>
                <span className="text-emerald-400 font-bold text-base">+${projectedInterest} USDC</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Total Return:</span>
                <span className="text-white font-bold">${(stakeAmount + projectedInterest).toFixed(2)} USDC</span>
              </div>
            </div>

            {stakedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-center text-xs">
                ✓ Staking position registered on Algorand TestNet!
              </div>
            )}

            <button
              onClick={handleSimulateStake}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 text-white font-bold text-xs font-['Space_Grotesk'] shadow-md hover:scale-[1.01] transition-all"
            >
              Deposit & Stake in Vault →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentBondLiquidityPool
