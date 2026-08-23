import React, { useState } from 'react'
import { claimUsername, validateUsernameInput, AuthUserProfile } from '../utils/agentraAuth'
import { useTheme } from '../ThemeContext'

interface ChooseUsernameModalProps {
  isOpen: boolean
  activeAddress: string
  onUsernameClaimed: (updatedUser: AuthUserProfile) => void
  onClose?: () => void
}

export const ChooseUsernameModal: React.FC<ChooseUsernameModalProps> = ({
  isOpen,
  activeAddress,
  onUsernameClaimed,
  onClose,
}) => {
  const { isLight } = useTheme()
  const [username, setUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setUsername(val)
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateUsernameInput(username)
    if (!validation.valid) {
      setError(validation.error || 'Invalid username')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const updatedUser = await claimUsername(username)
      onUsernameClaimed(updatedUser)
    } catch (err: any) {
      setError(err.message || 'Failed to claim username. Please try another name.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLengthValid = username.length >= 3 && username.length <= 20

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B133C]/65 backdrop-blur-md transition-all duration-300 animate-fade-in font-['Inter',sans-serif]">
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300 border ${
          isLight
            ? 'bg-white text-[#1B133C] border-[#1B133C]/10 shadow-[0_20px_50px_rgba(27,19,60,0.15)]'
            : 'bg-slate-900 text-slate-100 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
        }`}
      >
        {/* Header Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1B133C]/10 dark:border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-mono font-semibold bg-[#F97316]/10 text-[#F97316]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
            <span>Step 2: Profile Identity</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-[#1B133C]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              ✕
            </button>
          )}
        </div>

        {/* Title & Explainer */}
        <div className="mt-4 space-y-2">
          <h2 className={`font-['Instrument_Serif',serif] text-3xl font-normal tracking-tight ${
            isLight ? 'text-[#1B133C]' : 'text-white'
          }`}>
            Choose Your Username
          </h2>
          <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/70' : 'text-slate-400'}`}>
            Every AgentBond operator creates one unique public handle. Your username will be displayed across credit requests, contracts, and fleet telemetry instead of your raw wallet address.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <label className={isLight ? 'text-[#1B133C]' : 'text-slate-200'}>
                Public Handle
              </label>
              <span className={`font-mono text-[11px] ${
                username.length < 3 || username.length > 20
                  ? 'text-amber-600'
                  : 'text-emerald-600 font-bold'
              }`}>
                {username.length}/20 chars
              </span>
            </div>

            <div className={`relative flex items-center rounded-2xl border transition-all ${
              error
                ? 'border-rose-300 ring-2 ring-rose-100 dark:ring-rose-950/40'
                : isLengthValid
                ? 'border-emerald-300 dark:border-emerald-700/60'
                : isLight
                ? 'border-[#1B133C]/20 focus-within:border-[#F97316]'
                : 'border-slate-700 focus-within:border-cyan-400'
            } ${isLight ? 'bg-[#F5F5F5]' : 'bg-slate-950/80'}`}>
              <span className="pl-4 font-mono font-bold text-sm text-[#F97316] select-none">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={handleInputChange}
                placeholder="agent_developer"
                autoFocus
                maxLength={20}
                className={`w-full py-3.5 pl-1.5 pr-4 text-sm font-mono font-medium bg-transparent focus:outline-none ${
                  isLight ? 'text-[#1B133C] placeholder:text-[#1B133C]/30' : 'text-white placeholder:text-slate-600'
                }`}
              />
              {isLengthValid && !error && (
                <span className="pr-3 text-emerald-500 font-bold text-xs">✓</span>
              )}
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-mono">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Linked Wallet Info */}
          <div className={`p-3 rounded-2xl border text-[11px] font-mono space-y-1 ${
            isLight ? 'bg-slate-50 border-[#1B133C]/10 text-[#1B133C]/70' : 'bg-slate-950/50 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className="uppercase text-[9px] font-semibold text-[#1B133C]/50 dark:text-slate-500">
                Cryptographic Anchor
              </span>
              <span className="text-emerald-600 font-bold">Ed25519 Verified</span>
            </div>
            <div className="truncate text-[10px] text-[#1B133C] dark:text-slate-300 font-mono">
              {activeAddress}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={!isLengthValid || isSubmitting}
              className={`w-full py-3.5 rounded-2xl text-xs font-bold font-['Inter',sans-serif] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isLight
                  ? 'bg-[#1B133C] hover:bg-[#1B133C]/90 text-white'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering @{username}...</span>
                </>
              ) : (
                <span>Confirm & Claim @{username || 'username'} →</span>
              )}
            </button>
            <p className={`text-[10px] text-center ${isLight ? 'text-[#1B133C]/50' : 'text-slate-500'}`}>
              Usernames are permanent and globally unique across the AgentBond network.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChooseUsernameModal
