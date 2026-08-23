import React, { useState, useMemo } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { ellipseAddress } from '../utils/ellipseAddress'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { useTheme } from '../ThemeContext'

export const Account: React.FC = () => {
  const { activeAddress } = useWallet()
  const { isLight } = useTheme()
  const [copied, setCopied] = useState(false)
  const algoConfig = getAlgodConfigFromViteEnvironment()

  const networkName = useMemo(() => {
    return algoConfig.network === '' ? 'localnet' : algoConfig.network.toLocaleLowerCase()
  }, [algoConfig.network])

  const handleCopy = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!activeAddress) return null

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isLight ? 'bg-[#F5F5F5] border-[#1B133C]/10 text-[#1B133C]' : 'bg-slate-950/70 border-slate-800 text-slate-100'
    } space-y-3 font-mono text-xs`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] uppercase font-semibold ${isLight ? 'text-[#1B133C]/60' : 'text-slate-400'}`}>
          Connected Account
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          ● {networkName}
        </span>
      </div>

      <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
        isLight ? 'bg-white border-[#1B133C]/10' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-2 truncate">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#F97316] to-indigo-600 shrink-0" />
          <span className="font-bold truncate text-[#1B133C] dark:text-white">
            {ellipseAddress(activeAddress)}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold transition-all cursor-pointer ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 text-[#1B133C]' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px]">
        <span className={isLight ? 'text-[#1B133C]/60' : 'text-slate-400'}>Explorer Verification:</span>
        <a
          target="_blank"
          rel="noreferrer"
          href={`https://lora.algokit.io/${networkName}/account/${activeAddress}/`}
          className="text-[#F97316] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>Lora Explorer</span>
          <span>↗</span>
        </a>
      </div>
    </div>
  )
}

export default Account
