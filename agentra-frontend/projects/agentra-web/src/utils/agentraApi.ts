/**
 * Agentra API Client & x402 Payment Wrapper for Algorand TestNet
 */

import { x402Client, wrapFetchWithPayment } from '@x402-avm/fetch'
import { ALGORAND_TESTNET_CAIP2 } from '@x402-avm/avm'
import type { ClientAvmSigner } from '@x402-avm/avm'
import { ExactAvmScheme } from '@x402-avm/avm/exact/client'

export interface VerifyTaskRequest {
  task: string
  content: string
  sourceUrl?: string
}

export interface VerifyTaskResponse {
  success: boolean
  service: string
  decision: 'safe' | 'review_before_action' | 'suspicious'
  risk: 'low' | 'medium' | 'high'
  confidence: number
  summary: string
  evidence: string[]
  recommendedAction: string
  modelUsed: string
  paidVia: string
  timestamp: string
  amount?: number
  currency?: string
  decisionId?: string
  error?: string
  details?: string
}

export type AgentraVerificationReport = VerifyTaskResponse


export interface AgentraServiceItem {
  name: string
  endpoint: string
  method: string
  price: string
  description: string
  network?: string
  inputSchema: {
    task: string
    content: string
    sourceUrl?: string
  }
  outputSchema: {
    decision: string
    risk: string
    confidence: string
    evidence: string
    summary?: string
    recommendedAction?: string
    modelUsed?: string
    paidVia?: string
    timestamp?: string
  }
}

export interface AgentraCatalogResponse {
  services: AgentraServiceItem[]
}

/**
 * Creates an x402-enabled fetch wrapper backed by the connected Algorand wallet
 */
export async function createAgentraX402Fetch(walletSigner: {
  address: string
  signTransactions: (txns: Uint8Array[]) => Promise<(Uint8Array | string | null | undefined)[]>
}) {
  console.log('🛡️ [Agentra] Initializing x402 Client for address:', walletSigner.address)
  const client = new x402Client()

  let originalTxns: Uint8Array[] = []

  const x402Signer: ClientAvmSigner = {
    address: walletSigner.address,
    signTransactions: async (txns: Uint8Array[]) => {
      try {
        console.log(`[Agentra] x402Signer: received ${txns.length} payment transaction(s) to sign`)
        originalTxns = txns

        const walletResult = await walletSigner.signTransactions(txns)

        if (Array.isArray(walletResult)) {
          return walletResult.map((item: any, i: number) => {
            if (item === null || item === undefined) {
              return originalTxns[i]
            }
            if (item instanceof Uint8Array) {
              return item
            }
            if (typeof item === 'string') {
              const binaryString = atob(item)
              const bytes = new Uint8Array(binaryString.length)
              for (let j = 0; j < binaryString.length; j++) {
                bytes[j] = binaryString.charCodeAt(j)
              }
              return bytes
            }
            return originalTxns[i]
          })
        }

        return walletResult
      } catch (error) {
        console.error('[Agentra] signTransactions error:', error)
        throw error
      }
    },
  }

  client.register(ALGORAND_TESTNET_CAIP2, new ExactAvmScheme(x402Signer))
  return wrapFetchWithPayment(fetch, client)
}

/**
 * Call paid verification endpoint with x402 payment
 */
export async function verifyAgentTask(
  walletSigner: {
    address: string
    signTransactions: (txns: Uint8Array[]) => Promise<any>
  },
  payload: VerifyTaskRequest,
  apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'
): Promise<VerifyTaskResponse> {
  const fetchWithPayment = await createAgentraX402Fetch(walletSigner)

  const response = await fetchWithPayment(`${apiBaseUrl}/verify-task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    let parsedError: any = {}
    try {
      parsedError = JSON.parse(errorText)
    } catch {
      // not json
    }
    throw new Error(parsedError.error || parsedError.message || `Server returned HTTP ${response.status}: ${errorText || response.statusText}`)
  }

  return response.json()
}

/**
 * Evaluator / Sandbox Simulation Helper (For judges & dev exploration)
 */
export function evaluateTaskLocally(payload: VerifyTaskRequest): VerifyTaskResponse {
  const task = payload.task.toLowerCase().replace(/\s+/g, ' ')
  const content = payload.content.toLowerCase().replace(/\s+/g, ' ')
  const combined = `${task} ${content}`

  let score = 0
  const evidence: string[] = []

  if (combined.includes('urgent') || combined.includes('immediately') || combined.includes('within 24 hours') || combined.includes('within 2 hours') || combined.includes('due today')) {
    score += 20
    evidence.push('Urgent payment or action language detected (High pressure timeline).')
  }

  if (combined.includes('bank details changed') || combined.includes('changed today') || combined.includes('new bank') || combined.includes('new routing')) {
    score += 30
    evidence.push('Critical flag: Bank details or remittance routing changed recently (Vendor Email Compromise indicator).')
  }

  if (combined.includes('does not match') || combined.includes('sender email domain does not match') || combined.includes('.xyz') || combined.includes('.top')) {
    score += 25
    evidence.push('Sender / vendor domain mismatch or unverified origin domain detected.')
  }

  if (combined.includes('90% discount') || combined.includes('85% discount') || combined.includes('80% discount') || combined.includes('unrealistic discount')) {
    score += 20
    evidence.push('Pricing anomaly: Unrealistic extreme discount (>80% off standard market value).')
  }

  if (combined.includes('no refund') || combined.includes('no refund terms') || combined.includes('restocking fee') || combined.includes('cancellation allowed only within')) {
    score += 15
    evidence.push('Restrictive policy: No refund guarantee, forfeiture clauses, or severe cancellation penalties.')
  }

  if (combined.includes('external payment') || combined.includes('external payment requested') || combined.includes('crypto transfer') || combined.includes('telegram')) {
    score += 25
    evidence.push('Escrow bypass: Direct external transfer or off-platform payment requested without buyer protection.')
  }

  if (combined.includes('no seller address') || combined.includes('0 reviews') || combined.includes('unverified account')) {
    score += 15
    evidence.push('Identity deficiency: Missing verified seller credentials, physical address, or reputation history.')
  }

  if (evidence.length === 0) {
    evidence.push('Content conforms to standard operational format with no detected risk indicators.')
  }

  let risk: 'low' | 'medium' | 'high'
  let decision: 'safe' | 'review_before_action' | 'suspicious'
  let confidence: number
  let summary: string
  let recommendedAction: string

  if (score >= 60) {
    risk = 'high'
    decision = 'suspicious'
    confidence = 0.91
    summary = `High risk detected (Score: ${score}). Content displays multiple severe warning indicators of fraud, unauthorized redirection, or deception.`
    recommendedAction = 'ABORT / HALT: Do not execute payment or accept terms. Escalate to human supervisor with attached evidence.'
  } else if (score >= 25) {
    risk = 'medium'
    decision = 'review_before_action'
    confidence = 0.84
    summary = `Medium risk identified (Score: ${score}). Content contains restrictive clauses, tight deadlines, or unverified parameters requiring caution.`
    recommendedAction = 'PAUSE & VALIDATE: Request human review or out-of-band confirmation before proceeding with autonomous execution.'
  } else {
    risk = 'low'
    decision = 'safe'
    confidence = 0.92
    summary = `Verification passed (Score: ${score}). No significant fraud, security, or policy threats detected.`
    recommendedAction = 'PROCEED: Autonomous agent may proceed with requested action within established limits.'
  }

  return {
    success: true,
    service: 'agentra.verify',
    decision,
    risk,
    confidence,
    summary,
    evidence,
    recommendedAction,
    modelUsed: 'fallback-rules',
    paidVia: 'x402 / USDC Algorand TestNet (Simulation)',
    timestamp: new Date().toISOString(),
  }
}

/**
 * Fetch free public service discovery catalog
 */
export async function fetchAgentraServices(
  apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'
): Promise<AgentraCatalogResponse> {
  const res = await fetch(`${apiBaseUrl}/services`)
  if (!res.ok) {
    throw new Error(`Failed to fetch Agentra services (HTTP ${res.status})`)
  }
  return res.json()
}
