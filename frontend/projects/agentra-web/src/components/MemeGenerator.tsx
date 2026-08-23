import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { createX402Fetch } from '../utils/memeApi'

interface MemeStyles {
  styles: string[]
  themes: string[]
  visualStyles: string[]
  enhancementRules: string[]
  models: {
    available: string[]
    primary: string
    descriptions: Record<string, string>
  }
}

export const MemeGenerator: React.FC = () => {
  const { activeAddress, signTransactions } = useWallet()
  const [loading, setLoading] = useState(false)
  const [memeData, setMemeData] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [availableStyles, setAvailableStyles] = useState<MemeStyles | null>(null)

  // Form state
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('')
  const [selectedVisualStyle, setSelectedVisualStyle] = useState('')
  const [useMultiModel, setUseMultiModel] = useState(false)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'

  // Fetch available styles on mount (free endpoint)
  useEffect(() => {
    fetch(`${apiBaseUrl}/meme-styles`)
      .then(res => res.json())
      .then(data => setAvailableStyles(data))
      .catch(err => console.error('Failed to fetch styles:', err))
  }, [apiBaseUrl])

  const handleGenerateMeme = async () => {
    if (!activeAddress) {
      setError('Please connect your wallet first via Profile or Top Navigation')
      return
    }

    if (!signTransactions) {
      setError('Wallet does not support transaction signing')
      return
    }

    if (!prompt.trim()) {
      setError('Please enter a meme prompt')
      return
    }

    setLoading(true)
    setError('')
    setPaymentStatus('')
    setMemeData(null)

    try {
      setPaymentStatus('Requesting generation (402 Payment Challenge)...')

      const signer = {
        address: activeAddress,
        signTransactions: signTransactions,
      }

      setPaymentStatus('Processing micro-payment (0.10 USDC on Algorand)...')
      
      const fetchFn = await createX402Fetch(signer)
      const response = await fetchFn(`${apiBaseUrl}/meme-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle || undefined,
          theme: selectedTheme || undefined,
          visualStyle: selectedVisualStyle || undefined,
          useMultiModel: useMultiModel,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setPaymentStatus('Payment settled! AI Meme rendered successfully.')
        setMemeData(data)
        setTimeout(() => setPaymentStatus(''), 4000)
      } else {
        throw new Error(data.details || 'Failed to generate meme')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMsg)
      setPaymentStatus('')
      console.error('Meme generation error:', err)
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
            <span>🎨</span> AI Meme Generator
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Generate custom AI memes using Hugging Face & RAG - Metered at <strong className="text-emerald-400 font-mono">0.10 USDC</strong> per generation.
          </p>
        </div>
        <span className="text-[11px] font-mono font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30 px-3 py-1 rounded-full self-start sm:self-auto">
          0.10 USDC / generation
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

      {/* Form Controls */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5 font-['Space_Grotesk',sans-serif]">
            Meme Prompt <span className="text-rose-400">*</span>
          </label>
          <textarea
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono leading-relaxed"
            rows={3}
            placeholder="e.g. When the AI agent catches a $50,000 fraudulent invoice before CFO wakes up"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Style Selection */}
          {availableStyles && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Meme Style</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                disabled={loading}
              >
                <option value="">Auto-detect</option>
                {availableStyles.styles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          )}

          {/* Theme Selection */}
          {availableStyles && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Theme</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                disabled={loading}
              >
                <option value="">General</option>
                {availableStyles.themes.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>
          )}

          {/* Visual Style Selection */}
          {availableStyles && availableStyles.visualStyles && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Visual Style</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                value={selectedVisualStyle}
                onChange={(e) => setSelectedVisualStyle(e.target.value)}
                disabled={loading}
              >
                <option value="">Default</option>
                {availableStyles.visualStyles.map(vstyle => (
                  <option key={vstyle} value={vstyle}>{vstyle}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleGenerateMeme}
        disabled={!activeAddress || loading || !prompt.trim()}
        className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center space-x-2 font-['Space_Grotesk',sans-serif] ${
          !activeAddress || !prompt.trim()
            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            : loading
            ? 'bg-orange-500/50 text-white cursor-wait'
            : 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white shadow-lg shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99]'
        }`}
      >
        <span>{loading ? '🎨 Generating AI Meme...' : '✨ Generate AI Meme (Pay 0.10 USDC)'}</span>
      </button>

      {/* Alerts */}
      {paymentStatus && (
        <div className="p-3.5 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs flex items-center justify-between font-mono">
          <span>⚡ {paymentStatus}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between font-mono">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Rendered Meme Output */}
      {memeData && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs text-orange-400 font-bold font-mono">🎨 Generated AI Meme Output</span>
            <span className="text-[10px] text-slate-400 font-mono">Settled on Algorand TestNet</span>
          </div>

          <div className="flex flex-col items-center space-y-4">
            {memeData.imageUrl && (
              <img
                src={memeData.imageUrl}
                alt="Generated Meme"
                className="max-w-md w-full rounded-xl border border-slate-800 shadow-2xl"
              />
            )}
            {memeData.caption && (
              <p className="text-sm text-slate-200 text-center italic font-semibold max-w-md">
                "{memeData.caption}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MemeGenerator
