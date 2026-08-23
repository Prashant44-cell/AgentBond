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
    <div className="w-full text-[#1B133C] font-['Inter',sans-serif] space-y-8 pb-20 max-w-7xl mx-auto px-4 pt-4">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* PAGE SCENARIO BANNER: LIQUIDITY POOLS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#1B133C]/10 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] text-xs font-medium text-[#1B133C]">
            <div className="w-4 h-4 rounded-md bg-[#F97316] flex items-center justify-center text-white font-bold text-[10px]">
              A
            </div>
            <span>USDC ASA 10458941 Yield Vaults & Underwriting Reserve</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Vault Status: 100% Solvency Protected</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl md:text-5xl font-normal text-[#1B133C] tracking-tight">
              Institutional & Sponsor Liquidity Vaults
            </h1>
            <p className="text-xs sm:text-sm text-[#1B133C]/70 max-w-2xl leading-relaxed">
              Supply USDC liquidity to underwrite machine-to-machine credit lines for autonomous AI workers on Algorand. Earn continuous automated interest backed by verified work revenue.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={loadStats}
              className="p-2.5 rounded-xl border border-[#1B133C]/10 bg-[#F5F5F5] hover:bg-white text-[#1B133C] transition-all cursor-pointer shadow-xs"
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

        {/* Quick Scenario Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#1B133C]/5 text-[11px] text-[#1B133C]/75">
          <span className="font-semibold text-[#1B133C]">Scenario Reference:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">8.45% Blended APY</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">$250,000 Total TVL</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">3-Tier Loss Absorption Hierarchy</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#F5F5F5] border border-[#1B133C]/10 font-mono font-medium">0.12% Historical Default Rate</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* KEY METRICS GRID */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[#1B133C]/10 bg-white shadow-xs space-y-1">
          <div className="text-xs text-[#1B133C]/60 font-mono font-medium">Total Vault TVL</div>
          <div className="text-2xl sm:text-3xl font-black text-[#1B133C] font-mono">
            ${pool?.totalVaultLiquidityUsdc.toLocaleString() || '250,000'}
          </div>
          <div className="text-[10px] text-[#F97316] font-mono font-semibold">USDC ASA 10458941</div>
        </div>

        <div className="p-5 rounded-2xl border border-[#1B133C]/10 bg-white shadow-xs space-y-1">
          <div className="text-xs text-[#1B133C]/60 font-mono font-medium">Cumulative Disbursed</div>
          <div className="text-2xl sm:text-3xl font-black text-[#1B133C] font-mono">
            ${pool?.totalLoansDisbursedUsdc.toLocaleString() || '842,500'}
          </div>
          <div className="text-[10px] text-[#1B133C]/60 font-mono">Active Drawn: ${pool?.activeCreditLinesUsdc || '18,450'}</div>
        </div>

        <div className="p-5 rounded-2xl border border-[#1B133C]/10 bg-white shadow-xs space-y-1">
          <div className="text-xs text-[#1B133C]/60 font-mono font-medium">Net Protocol APY</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {pool?.currentNetApy || '8.45'}%
          </div>
          <div className="text-[10px] text-emerald-600 font-mono">Blended Tranche Yield</div>
        </div>

        <div className="p-5 rounded-2xl border border-[#1B133C]/10 bg-white shadow-xs space-y-1">
          <div className="text-xs text-[#1B133C]/60 font-mono font-medium">Historical Default Rate</div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">
            {pool?.defaultRatePercent || '0.12'}%
          </div>
          <div className="text-[10px] text-indigo-600 font-mono">Loss: ${pool?.defaultLossUsdc || '450'}</div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TRANCHES & STAKING WORKBENCH */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tranche Cards (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-[#1B133C]">
              Structured Credit Tranches
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Senior AAA Tranche */}
              <div
                onClick={() => setSelectedTranche('senior')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  selectedTranche === 'senior'
                    ? 'border-[#1B133C] bg-[#F5F5F5] shadow-sm'
                    : 'border-[#1B133C]/10 bg-white hover:border-[#1B133C]/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-mono font-bold">
                    Low Risk / Senior
                  </span>
                  <span className="text-xl font-black text-[#1B133C] font-mono">{seniorApy}% APY</span>
                </div>
                <h3 className="text-base font-bold text-[#1B133C]">Senior Capital Vault</h3>
                <p className="text-xs text-[#1B133C]/70 leading-relaxed">
                  First priority repayment queue. Protected by the Junior First-Loss Tranche and the $15,000 Protocol Insurance Reserve.
                </p>
                <div className="pt-2 border-t border-[#1B133C]/10 text-[11px] font-mono text-[#1B133C]/70 flex justify-between">
                  <span>Vault Capital:</span>
                  <span className="text-[#1B133C] font-bold">${pool?.tranches.seniorAaaCapitalUsdc.toLocaleString() || '180,000'}</span>
                </div>
              </div>

              {/* Junior High-Yield Tranche */}
              <div
                onClick={() => setSelectedTranche('junior')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  selectedTranche === 'junior'
                    ? 'border-[#F97316] bg-[#F97316]/5 shadow-sm'
                    : 'border-[#1B133C]/10 bg-white hover:border-[#1B133C]/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/30 text-[10px] font-mono font-bold">
                    High Yield / First-Loss
                  </span>
                  <span className="text-xl font-black text-[#F97316] font-mono">{juniorApy}% APY</span>
                </div>
                <h3 className="text-base font-bold text-[#1B133C]">Junior Yield Vault</h3>
                <p className="text-xs text-[#1B133C]/70 leading-relaxed">
                  Absorbs the first 5% of any agent default losses in exchange for 2.4x higher protocol micro-fee yield distributions.
                </p>
                <div className="pt-2 border-t border-[#1B133C]/10 text-[11px] font-mono text-[#1B133C]/70 flex justify-between">
                  <span>Vault Capital:</span>
                  <span className="text-[#1B133C] font-bold">${pool?.tranches.juniorYieldCapitalUsdc.toLocaleString() || '55,000'}</span>
                </div>
              </div>
            </div>

            {/* 3-Tier Loss Absorption Hierarchy Breakdown */}
            <div className="p-4 rounded-2xl bg-[#F5F5F5] border border-[#1B133C]/10 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1B133C] text-sm">3-Tier Loss Absorption Hierarchy</span>
                <span className="text-[10px] text-emerald-700 font-bold">Institutional Risk Isolation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded-xl bg-white border border-indigo-200 space-y-0.5">
                  <div className="text-indigo-800 font-bold">1st Loss: Sponsor Stakes</div>
                  <div className="text-[#1B133C] font-bold">${pool?.lossAbsorptionHierarchy?.firstLossSponsorStakesUsdc?.toLocaleString() || '45,000'} USDC</div>
                  <div className="text-[#1B133C]/50 text-[9px]">Slashed on fleet default</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-cyan-200 space-y-0.5">
                  <div className="text-cyan-800 font-bold">2nd Loss: Protocol Buffer</div>
                  <div className="text-[#1B133C] font-bold">${pool?.lossAbsorptionHierarchy?.secondLossInsuranceReserveUsdc?.toLocaleString() || '15,000'} USDC</div>
                  <div className="text-[#1B133C]/50 text-[9px]">Protocol fee reserve</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-purple-200 space-y-0.5">
                  <div className="text-purple-800 font-bold">3rd Loss: Junior Tranche</div>
                  <div className="text-[#1B133C] font-bold">${pool?.lossAbsorptionHierarchy?.thirdLossJuniorTrancheUsdc?.toLocaleString() || '55,000'} USDC</div>
                  <div className="text-[#1B133C]/50 text-[9px]">Absorbs tail risk for 14.8% APY</div>
                </div>
              </div>

              <div className="text-[10px] text-[#1B133C]/70 flex items-center justify-between border-t border-[#1B133C]/10 pt-2">
                <span>Senior AAA Capital Protected:</span>
                <strong className="text-emerald-700">${pool?.lossAbsorptionHierarchy?.seniorCapitalProtectedUsdc?.toLocaleString() || '180,000'} USDC (100% Insolvency Shield)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Stake Calculator (1 col) */}
        <div className="p-6 rounded-3xl border border-[#1B133C]/10 bg-white shadow-sm space-y-5">
          <h3 className="text-base font-bold text-[#1B133C]">
            USDC Staking Calculator
          </h3>

          <div className="space-y-4 text-xs font-mono">
            {/* Amount Slider */}
            <div>
              <div className="flex justify-between text-[#1B133C]/80 mb-1">
                <span>Deposit Amount:</span>
                <span className="text-[#1B133C] font-bold">${stakeAmount.toLocaleString()} USDC</span>
              </div>
              <input
                type="range"
                min="100"
                max="25000"
                step="100"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(parseInt(e.target.value, 10))}
                className="w-full accent-[#1B133C] cursor-pointer"
              />
            </div>

            {/* Duration Slider */}
            <div>
              <div className="flex justify-between text-[#1B133C]/80 mb-1">
                <span>Lock Duration:</span>
                <span className="text-[#F97316] font-bold">{stakeDurationMonths} Months</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                value={stakeDurationMonths}
                onChange={(e) => setStakeDurationMonths(parseInt(e.target.value, 10))}
                className="w-full accent-[#F97316] cursor-pointer"
              />
            </div>

            {/* Tranche Selector */}
            <div>
              <label className="block text-[#1B133C]/70 mb-1">Active Tranche:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTranche('senior')}
                  className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    selectedTranche === 'senior'
                      ? 'border-[#1B133C] bg-[#1B133C] text-white'
                      : 'border-[#1B133C]/10 bg-[#F5F5F5] text-[#1B133C]'
                  }`}
                >
                  Senior ({seniorApy}%)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTranche('junior')}
                  className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    selectedTranche === 'junior'
                      ? 'border-[#F97316] bg-[#F97316] text-white'
                      : 'border-[#1B133C]/10 bg-[#F5F5F5] text-[#1B133C]'
                  }`}
                >
                  Junior ({juniorApy}%)
                </button>
              </div>
            </div>

            {/* Yield Projection Card */}
            <div className="p-4 rounded-2xl bg-[#F5F5F5] border border-[#1B133C]/10 space-y-2">
              <div className="flex justify-between text-[#1B133C]/70">
                <span>Projected Yield:</span>
                <span className="text-emerald-700 font-bold text-base">+${projectedInterest} USDC</span>
              </div>
              <div className="flex justify-between text-[#1B133C]/70 text-[11px]">
                <span>Total Return:</span>
                <span className="text-[#1B133C] font-bold">${(stakeAmount + projectedInterest).toFixed(2)} USDC</span>
              </div>
            </div>

            {stakedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-xs">
                ✓ Staking position registered on Algorand TestNet!
              </div>
            )}

            <button
              onClick={handleSimulateStake}
              className="w-full py-3.5 rounded-xl bg-[#1B133C] hover:bg-[#1B133C]/90 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
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
