# AgentBond Core Verification Server

> Autonomous AI Agent Pre-Action Verification & Intelligence Backend with x402 Micropayment Enforcement on Algorand TestNet.

## Overview

**AgentBond Core Server** is a high-throughput Hono/TypeScript backend engine that protects autonomous AI agent operations against high-risk irreversible actions (fraudulent invoices, phishing emails, malicious contracts, prompt injection attacks, and data leaks) via decentralized micro-metered payments.

---

## 🚀 Key Features

- **12 Specialized Verification Engines**:
  - `POST /verify-task` (Invoice Risk & BEC Fraud Checker - $0.01 USDC)
  - `POST /verify-email` (Email Phishing Analyzer - $0.01 USDC)
  - `POST /verify-product` (Product Listing & Seller Verifier - $0.01 USDC)
  - `POST /verify-policy` (Policy Risk Summarizer - $0.01 USDC)
  - `POST /extract-ocr` (OCR Document Extractor - $0.01 USDC)
  - `POST /guard-prompt` (Subagent Prompt Injection Guard - $0.01 USDC)
  - `POST /audit-privacy` (PII & Privacy Leak Validator - $0.01 USDC)
  - `POST /audit-address` (Address & Contract Reputation Audit - $0.01 USDC)
  - `POST /verify-fee` (Predatory Fee Detector - $0.01 USDC)
  - `POST /audit-domain` (Domain & SSL Trust Evaluator - $0.01 USDC)
  - `GET /weather` (Weather & Climate Oracle - $0.005 USDC)
  - `POST /meme-generate` (AI Meme Generator - $0.10 USDC)

- **Cryptographic Wallet-First Auth (SIWA)**:
  - `POST /auth/nonce` (32-byte cryptographic nonce with 5-minute TTL)
  - `POST /auth/login` (Ed25519 signature verification via `algosdk.verifyBytes`)
  - `GET /user/profile` & `GET /user/analytics` (Micro-spend metrics & verifiable receipts)

- **Custom Agent Request Portal (Excel Persistence)**:
  - `POST /api/agent-requests` (Appends structured custom agent specifications to `agent_requests.csv`)
  - `GET /api/agent-requests` (Fetches recent agent requests)

---

## 🛠️ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode
npm run dev
```

Server listens on `http://localhost:4021`.
