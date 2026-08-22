/**
 * Agentra Wallet-First Authentication & Profile Client (SIWA)
 */

export interface AuthUserProfile {
  id: string
  walletAddress: string
  role: 'individual' | 'developer' | 'admin'
  createdAt: string
  lastLoginAt: string
  stats: {
    totalVerifications: number
    totalSpentUsdc: number
    threatsBlocked: number
    safeTransactions: number
    reviewRequired: number
  }
}

export interface UserAnalyticsData {
  walletAddress: string
  decisionsCount: {
    safe: number
    review_before_action: number
    suspicious: number
  }
  dailySpend: Array<{ date: string; spend: number; checks: number }>
  totalUsdcVolume: number
  activeServicesCount: number
}

export interface VerificationReceipt {
  id: string
  service: string
  endpoint?: string
  decision: 'safe' | 'review_before_action' | 'suspicious'
  risk?: 'low' | 'medium' | 'high'
  confidence?: number
  amount?: number
  amountUsdc?: string
  currency?: string
  timestamp: string
  txHash?: string
  evidence?: string[]
}

const SESSION_STORAGE_KEY = 'agentra_session_token'
const SESSION_WALLET_KEY = 'agentra_session_wallet'

export function getStoredSessionToken(): string | null {
  return localStorage.getItem(SESSION_STORAGE_KEY)
}

export function setStoredSessionToken(token: string) {
  localStorage.setItem(SESSION_STORAGE_KEY, token)
}

export function getStoredSessionWallet(): string | null {
  return localStorage.getItem(SESSION_WALLET_KEY)
}

export function setStoredSessionWallet(walletAddress: string) {
  localStorage.setItem(SESSION_WALLET_KEY, walletAddress)
}

export function clearStoredSessionToken() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
  localStorage.removeItem(SESSION_WALLET_KEY)
}

/**
 * Step 1: Request single-use login nonce from backend
 */
export async function requestLoginNonce(
  walletAddress: string,
  apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'
): Promise<{ nonce: string; messageTemplate: string; expiresAt: string }> {
  const res = await fetch(`${apiBaseUrl}/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to request authentication nonce')
  }

  return res.json()
}

/**
 * Step 2: Sign nonce message with Algorand wallet and log in
 */
export async function signInWithWallet(
  walletSigner: {
    address: string
    signTransactions?: (txns: Uint8Array[]) => Promise<any>
    signData?: (data: string, metadata: { scope: number; encoding: string }) => Promise<{ signature: Uint8Array }>
  },
  apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'
): Promise<{ sessionToken: string; user: AuthUserProfile }> {
  const { address } = walletSigner

  // 1. Get nonce from server
  const { nonce, messageTemplate } = await requestLoginNonce(address, apiBaseUrl)
  if (!walletSigner.signData) {
    throw new Error('This wallet cannot sign authentication messages')
  }

  const signed = await walletSigner.signData(messageTemplate, { scope: 1, encoding: 'utf-8' })
  const signature = btoa(String.fromCharCode(...signed.signature))

  // 2. Submit to backend /auth/login
  const res = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: address,
      nonce,
      signature,
    }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Signature authentication failed')
  }

  const data = await res.json()
  setStoredSessionToken(data.sessionToken)
  setStoredSessionWallet(address)
  return data
}

export async function logoutFromWallet(
  apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'
) {
  const token = getStoredSessionToken()
  if (token) {
    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined)
  }
  clearStoredSessionToken()
}

/**
 * Fetch authenticated profile and recent receipts
 */
export async function fetchProfileData(
  walletAddress: string,
  apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'
): Promise<{ user: AuthUserProfile; receipts: VerificationReceipt[] }> {
  const token = getStoredSessionToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${apiBaseUrl}/user/profile?wallet=${encodeURIComponent(walletAddress)}`, {
    headers,
  })

  if (!res.ok) {
    throw new Error('Failed to fetch user profile')
  }

  return res.json()
}

/**
 * Fetch visual analytics metrics
 */
export async function fetchAnalyticsData(
  walletAddress: string,
  apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'
): Promise<UserAnalyticsData> {
  const token = getStoredSessionToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${apiBaseUrl}/user/analytics?wallet=${encodeURIComponent(walletAddress)}`, {
    headers,
  })

  if (!res.ok) {
    throw new Error('Failed to fetch user analytics')
  }

  return res.json()
}
