import React, { useState, useEffect } from 'react'
import { fetchAgentBondServices, AgentBondCatalogResponse } from '../utils/agentraApi'

export const AgentBondServicesPanel: React.FC = () => {
  const [catalog, setCatalog] = useState<AgentBondCatalogResponse | null>(null)
  const [codeTab, setCodeTab] = useState<'python' | 'ts' | 'curl'>('python')
  const [copied, setCopied] = useState<boolean>(false)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'

  useEffect(() => {
    fetchAgentBondServices(apiBaseUrl)
      .then((data) => {
        setCatalog(data)
      })
      .catch((err) => {
        console.warn('Could not load services from server, using built-in catalog specs:', err)
      })
  }, [apiBaseUrl])

  const pythonSnippet = `# How an Autonomous AI Agent calls AgentBond via x402
import requests
from x402_avm import create_x402_client

# 1. Initialize agent's Algorand TestNet wallet with USDC
agent_wallet = create_x402_client(private_key="...")

# 2. Discover available verification tools (Free)
services = requests.get("${apiBaseUrl}/services").json()

# 3. Pay $0.01 USDC and verify action before execution
verification = agent_wallet.post(
    "${apiBaseUrl}/verify-task",
    json={
        "task": "Should I pay this invoice?",
        "content": "Vendor says bank details changed today. Payment is urgent. Sender email domain does not match company name.",
        "sourceUrl": "https://vendor-portal.xyz/pay/88392"
    }
)

# 4. Agent executes based on structured decision
report = verification.json()
if report["decision"] == "safe":
    agent.execute_payment()
elif report["decision"] == "review_before_action":
    agent.request_human_review(report["evidence"])
else:
    agent.abort_action(reason=report["summary"])`

  const tsSnippet = `// Autonomous Agent Tool Integration (TypeScript)
import { createX402Fetch } from '@x402-avm/fetch';

// AgentBond Pre-Action Verification Tool
export async function verifyWithAgentBond(task: string, content: string) {
  const x402Fetch = await createX402Fetch(agentWalletSigner);
  
  // Sends request, negotiates 402 challenge, signs 0.01 USDC on Algorand
  const res = await x402Fetch('${apiBaseUrl}/verify-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, content })
  });

  const verdict = await res.json();
  return verdict; // { decision: "safe" | "review_before_action" | "suspicious", risk, confidence, evidence }
}`

  const curlSnippet = `# 1. Discovery (Free)
curl -X GET ${apiBaseUrl}/services

# 2. Paid Verification Request (Will return 402 challenge if unpaid)
curl -X POST ${apiBaseUrl}/verify-task \\
  -H "Content-Type: application/json" \\
  -d '{
    "task": "Should I pay this invoice?",
    "content": "Vendor says bank details changed today. Payment is urgent."
  }'`

  const getActiveCode = () => {
    if (codeTab === 'python') return pythonSnippet
    if (codeTab === 'ts') return tsSnippet
    return curlSnippet
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Services Catalogue */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">📡</span>
            <div>
              <h3 className="text-white font-bold text-base">Discoverable Services</h3>
              <p className="text-slate-400 text-xs">Exposed via public <code className="text-cyan-400 font-mono">GET /services</code></p>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            Agent-Ready
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-cyan-500/40 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-bold text-sm">
                    {catalog?.services[0]?.name || 'AgentBond Verify'}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {catalog?.services[0]?.description ||
                    'Verifies whether an AI agent should safely continue with a real-world action.'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold font-mono text-sm">
                  {catalog?.services[0]?.price || '$0.01'}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">USDC / check</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Endpoint</span>
                <span className="text-slate-300 font-mono text-xs">POST /verify-task</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Network</span>
                <span className="text-slate-300 font-mono text-xs">Algorand TestNet</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Enterprise Profile */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <span>🏢</span> Enterprise Use Case: Autonomous AP & Procurement
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Target Scenario:</strong> Financial AI Agents managing B2B procurement (e.g. Ramp, Navan, Brex agent workflows) that process thousands of vendor payments autonomously.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-300">The Problem Solved:</strong> Instead of signing $5,000/month SaaS subscriptions and storing sensitive master API keys in agent memory, agents pay $0.01 USDC on-chain per verification check only when evaluating high-risk invoices.
        </p>
      </div>

      {/* Real-World System Design & Scaling */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <span>🛡️</span> System Design & Real-World Safeguards
        </h3>
        <div className="space-y-2.5 text-xs text-slate-300">
          <div className="flex items-start space-x-2">
            <span className="text-cyan-400 font-bold">1.</span>
            <p><strong className="text-white">Idempotency & Replay Protection:</strong> x402 transaction hashes and signature timestamps prevent double-charging or replays across concurrent subagent swarms.</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-cyan-400 font-bold">2.</span>
            <p><strong className="text-white">Sub-3s Block Latency:</strong> Algorand's fast finality enables agents to pause, verify on-chain, and resume autonomous execution without blocking workflow queues.</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-cyan-400 font-bold">3.</span>
            <p><strong className="text-white">Model Fallback Resilience:</strong> Automatic fallback to deterministic heuristics guarantees high availability even during external Hugging Face inference rate limits.</p>
          </div>
        </div>
      </div>

      {/* Agent Code Integration Example */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <span>⚙️</span> Agent Integration SDK
          </h3>
          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setCodeTab('python')}
              className={`px-2 py-0.5 rounded ${
                codeTab === 'python' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setCodeTab('ts')}
              className={`px-2 py-0.5 rounded ${
                codeTab === 'ts' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
              }`}
            >
              TypeScript
            </button>
            <button
              onClick={() => setCodeTab('curl')}
              className={`px-2 py-0.5 rounded ${
                codeTab === 'curl' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400'
              }`}
            >
              cURL
            </button>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 btn btn-xs bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 z-10"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <pre className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-[11px] font-mono text-cyan-300/90 overflow-x-auto leading-relaxed max-h-72">
            <code>{getActiveCode()}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

export default AgentBondServicesPanel
