import React from 'react'
import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import { useTheme } from '../ThemeContext'
import Account from './Account'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

export const ConnectWallet: React.FC<ConnectWalletInterface> = ({ openModal, closeModal }) => {
  const { wallets, activeAddress } = useWallet()
  const { isLight } = useTheme()

  if (!openModal) return null

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B133C]/60 backdrop-blur-md transition-all duration-300 animate-fade-in font-['Inter',sans-serif]">
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl transition-all duration-300 border ${
          isLight
            ? 'bg-white text-[#1B133C] border-[#1B133C]/10 shadow-[0_20px_50px_rgba(27,19,60,0.15)]'
            : 'bg-slate-900 text-slate-100 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#1B133C]/10 dark:border-slate-800">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-medium bg-[#F97316]/10 text-[#F97316]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
              <span>Algorand Pure PoS</span>
            </div>
            <h3 className={`font-['Instrument_Serif',serif] text-2xl sm:text-3xl font-normal tracking-tight ${
              isLight ? 'text-[#1B133C]' : 'text-white'
            }`}>
              {activeAddress ? 'Active Wallet Session' : 'Select Wallet Provider'}
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#1B133C]/65' : 'text-slate-400'}`}>
              {activeAddress
                ? 'Your Algorand wallet is currently linked for x402 micro-settlements and identity verification.'
                : 'Connect your Algorand account to manage fleet credit and sign cryptographic proofs.'}
            </p>
          </div>

          <button
            data-test-id="close-wallet-modal"
            onClick={closeModal}
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-[#1B133C]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-3">
          {activeAddress ? (
            <div className="space-y-4">
              <Account />
            </div>
          ) : (
            <div className="space-y-2.5">
              {wallets?.map((wallet) => (
                <button
                  key={`provider-${wallet.id}`}
                  data-test-id={`${wallet.id}-connect`}
                  onClick={async () => {
                    await wallet.connect()
                    closeModal()
                  }}
                  className={`w-full p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                    isLight
                      ? 'bg-[#F5F5F5] hover:bg-white hover:border-[#F97316]/40 border-[#1B133C]/10 text-[#1B133C] hover:shadow-md'
                      : 'bg-slate-950/60 hover:bg-slate-800 hover:border-cyan-500/40 border-slate-800 text-slate-100 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-xs shrink-0 border border-slate-200/60">
                      {!isKmd(wallet) && wallet.metadata.icon ? (
                        <img
                          alt={`wallet_icon_${wallet.id}`}
                          src={wallet.metadata.icon}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-base font-bold text-slate-800">⚡</span>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm tracking-tight flex items-center gap-2">
                        <span>{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
                        {wallet.isConnected && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-100 text-emerald-800 font-bold">
                            Connected
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] font-mono ${isLight ? 'text-[#1B133C]/50' : 'text-slate-400'}`}>
                        Fast & zero-gas ready
                      </div>
                    </div>
                  </div>

                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:translate-x-1 ${
                    isLight ? 'bg-white text-[#1B133C]' : 'bg-slate-900 text-slate-300'
                  }`}>
                    →
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#1B133C]/10 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>TestNet Ready</span>
          </div>

          <div className="flex items-center gap-2">
            {activeAddress && (
              <button
                data-test-id="logout"
                onClick={async () => {
                  if (wallets) {
                    const activeWallet = wallets.find((w) => w.isActive)
                    if (activeWallet) {
                      await activeWallet.disconnect()
                    } else {
                      localStorage.removeItem('@txnlab/use-wallet:v3')
                      window.location.reload()
                    }
                  }
                  closeModal()
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
              >
                Disconnect Wallet
              </button>
            )}

            <button
              onClick={closeModal}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-[#1B133C]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectWallet
