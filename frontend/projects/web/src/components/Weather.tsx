import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { fetchWeatherWithPayment, formatWeatherData } from '../utils/weatherApi'

export const Weather: React.FC = () => {
  const { activeAddress, signTransactions } = useWallet()
  const [loading, setLoading] = useState(false)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState('')

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'
  const weatherUrl = `${apiBaseUrl}/weather`

  const handleRequestWeather = async () => {
    if (!activeAddress) {
      setError('Please connect your wallet first via Profile or Top Navigation')
      return
    }

    if (!signTransactions) {
      setError('Wallet does not support transaction signing')
      return
    }

    setLoading(true)
    setError('')
    setPaymentStatus('')
    setWeatherData(null)

    try {
      setPaymentStatus('Requesting weather data (402 Payment Challenge)...')

      const signer = {
        address: activeAddress,
        signTransactions: signTransactions,
      }

      setPaymentStatus('Signing micro-payment (0.005 USDC on Algorand)...')
      const data = await fetchWeatherWithPayment(weatherUrl, signer)

      setPaymentStatus('Payment settled! Weather Oracle payload received.')
      setWeatherData(data)
      setTimeout(() => setPaymentStatus(''), 4000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMsg)
      setPaymentStatus('')
      console.error('Weather request error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-white space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5 font-['Space_Grotesk',sans-serif]">
            <span>🌤️</span> Weather & Climate Oracle
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Real-time atmospheric oracle service metered at <strong className="text-emerald-400 font-mono">0.005 USDC</strong> per query.
          </p>
        </div>
        <span className="text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full self-start sm:self-auto">
          0.005 USDC / check
        </span>
      </div>

      {/* Wallet Status Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${activeAddress ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs font-semibold text-slate-300 font-mono">
            Wallet Status: <strong className={activeAddress ? 'text-emerald-400' : 'text-amber-300'}>
              {activeAddress ? `Connected (${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)})` : 'Not Connected'}
            </strong>
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Algorand TestNet</span>
      </div>

      {/* Action Button */}
      <button
        onClick={handleRequestWeather}
        disabled={!activeAddress || loading}
        className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center space-x-2 font-['Space_Grotesk',sans-serif] ${
          !activeAddress
            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            : loading
            ? 'bg-amber-500/50 text-slate-950 cursor-wait'
            : 'bg-gradient-to-r from-amber-400 to-sky-500 hover:from-amber-300 hover:to-sky-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99]'
        }`}
      >
        <span>{loading ? '⚡ Signing & Settling Payment...' : '🌤️ Request Weather Oracle (Pay 0.005 USDC)'}</span>
      </button>

      {/* Alerts */}
      {paymentStatus && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between font-mono">
          <span>⚡ {paymentStatus}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between font-mono">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Weather Data Display */}
      {weatherData && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs text-cyan-400 font-bold">📡 Oracle Telemetry Received</span>
            <span className="text-[10px] text-slate-400">Status: 200 OK (Paid)</span>
          </div>
          <pre className="text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {formatWeatherData(weatherData)}
          </pre>
        </div>
      )}

      {/* How it works */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
          How Oracle Payment Works:
        </span>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
          <li>Client sends request to <code className="text-cyan-400 font-mono">/weather</code></li>
          <li>Server challenges with <code className="text-amber-400 font-mono">402 Payment Required</code></li>
          <li>Wallet signs Algorand ASA transfer for 0.005 USDC</li>
          <li>Facilitator settles transaction on Algorand TestNet and returns weather payload</li>
        </ol>
      </div>
    </div>
  )
}

export default Weather
