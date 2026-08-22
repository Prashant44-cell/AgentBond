"use strict";
/**
 * Agentra Services Discovery Handler
 *
 * Endpoint: GET /services (Free public endpoint)
 * Exposes available Agentra verification tools and schemas for autonomous AI agents.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleServicesDiscovery = handleServicesDiscovery;
function handleServicesDiscovery(c) {
    return c.json({
        services: [
            {
                name: 'Agentra Verify (Invoice Risk)',
                endpoint: '/verify-task',
                method: 'POST',
                price: '$0.01',
                description: 'Verifies whether an AI agent should safely continue with an invoice payment or transaction.',
                network: 'Algorand TestNet (x402 protocol)',
                inputSchema: {
                    task: 'string',
                    content: 'string',
                    sourceUrl: 'string optional',
                },
                outputSchema: {
                    decision: 'safe | review_before_action | suspicious',
                    risk: 'low | medium | high',
                    confidence: 'number',
                    evidence: 'string[]',
                },
            },
            {
                name: 'Email Phishing Analyzer',
                endpoint: '/verify-email',
                method: 'POST',
                price: '$0.01',
                description: 'Analyzes email content for phishing, domain spoofing, urgency traps, and credential harvesting.',
                network: 'Algorand TestNet (x402 protocol)',
                inputSchema: {
                    subject: 'string optional',
                    senderEmail: 'string optional',
                    emailContent: 'string',
                },
                outputSchema: {
                    decision: 'safe | review_before_action | suspicious',
                    phishingScore: 'number',
                    evidence: 'string[]',
                },
            },
            {
                name: 'Product Listing Verifier',
                endpoint: '/verify-product',
                method: 'POST',
                price: '$0.01',
                description: 'Verifies e-commerce product listings for extreme pricing anomalies, missing seller ID, and escrow bypass.',
                network: 'Algorand TestNet (x402 protocol)',
                inputSchema: {
                    title: 'string',
                    description: 'string',
                    price: 'string optional',
                    seller: 'string optional',
                },
                outputSchema: {
                    decision: 'safe | review_before_action | suspicious',
                    risk: 'low | medium | high',
                    evidence: 'string[]',
                },
            },
            {
                name: 'Policy Risk Summarizer',
                endpoint: '/verify-policy',
                method: 'POST',
                price: '$0.01',
                description: 'Summarizes legal terms and highlights restrictive cancellation windows, restocking fees, and lock-in clauses.',
                network: 'Algorand TestNet (x402 protocol)',
                inputSchema: {
                    policyText: 'string',
                },
                outputSchema: {
                    decision: 'safe | review_before_action | suspicious',
                    risk: 'low | medium | high',
                    evidence: 'string[]',
                },
            },
            {
                name: 'OCR Document Extractor',
                endpoint: '/extract-ocr',
                method: 'POST',
                price: '$0.01',
                description: 'Parses document text, receipts, and invoices into structured JSON metadata.',
                network: 'Algorand TestNet (x402 protocol)',
                inputSchema: {
                    documentText: 'string',
                },
                outputSchema: {
                    extractedData: 'object',
                    decision: 'safe',
                },
            },
            {
                name: 'Prompt Injection Guard',
                endpoint: '/guard-prompt',
                method: 'POST',
                price: '$0.01',
                description: 'Protects autonomous subagents against indirect prompt injections, adversarial overrides, and persona jailbreaks.',
                network: 'Algorand TestNet (x402 protocol)',
                inputSchema: {
                    untrustedInput: 'string',
                },
                outputSchema: {
                    decision: 'safe | review_before_action | suspicious',
                    evidence: 'string[]',
                },
            },
            {
                name: 'PII & Privacy Leak Validator',
                endpoint: '/audit-privacy',
                method: 'POST',
                price: '$0.01',
                description: 'Scans payloads for unredacted credit card numbers, SSNs, and cryptographic seed phrases.',
                network: 'Algorand TestNet (x402 protocol)',
                inputSchema: {
                    payload: 'string',
                },
                outputSchema: {
                    decision: 'safe | review_before_action | suspicious',
                    evidence: 'string[]',
                },
            },
            {
                name: 'Weather Oracle',
                endpoint: '/weather',
                method: 'GET',
                price: '$0.005',
                description: 'Provides real-time meteorological data for autonomous smart contracts.',
                network: 'Algorand TestNet (x402 protocol)',
            },
            {
                name: 'AI Meme Generator',
                endpoint: '/meme-generate',
                method: 'POST',
                price: '$0.10',
                description: 'Generates creative cultural and social marketing assets.',
                network: 'Algorand TestNet (x402 protocol)',
            },
        ],
    });
}
