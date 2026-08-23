/**
 * AgentBond Wallet-First Authentication & Profile Client (SIWA)
 */

export interface AuthUserProfile {
  id: string
  username?: string | null
  walletAddress: string
  role: 'individual' | 'developer' | 'admin'
  reputationScore?: number
  defaultCount?: number
  isBlocked?: boolean
  createdAt: string
  updatedAt?: string
  lastLoginAt: string
  stats?: {
    totalVerifications: number
    totalSpentUsdc: number
    threatsBlocked: number
    safeTransactions: number
    reviewRequired: number
  }
}

export interface UserAnalyticsData {
  walletAddress: string
  username?: string | null
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

const SESSION_STORAGE_KEY = 'agentbond_session_token'
const SESSION_WALLET_KEY = 'agentbond_session_wallet'

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
 * Username validation helper for frontend forms
 */
export function validateUsernameInput(username: string): { valid: boolean; error?: string } {
  if (!username || !username.trim()) {
    return { valid: false, error: 'Username cannot be empty.' }
  }
  const clean = username.trim().toLowerCase()
  if (clean.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters.' }
  }
  if (clean.length > 20) {
    return { valid: false, error: 'Username must not exceed 20 characters.' }
  }
  if (!/^[a-z0-9_-]+$/.test(clean)) {
    return { valid: false, error: 'Use only letters, numbers, underscores (_), and hyphens (-).' }
  }
  return { valid: true }
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
): Promise<{ sessionToken: string; hasUsername: boolean; user: AuthUserProfile }> {
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

/**
 * Step 3: Claim permanent globally unique username
 */
export async function claimUsername(
  username: string,
  apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'
): Promise<AuthUserProfile> {
  const token = getStoredSessionToken()
  if (!token) {
    throw new Error('Active wallet session required to claim username')
  }

  const validation = validateUsernameInput(username)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const res = await fetch(`${apiBaseUrl}/auth/username`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username: username.trim().toLowerCase() }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to claim username')
  }

  return data.user
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
): Promise<{ hasUsername?: boolean; user: AuthUserProfile; receipts: VerificationReceipt[] }> {
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
