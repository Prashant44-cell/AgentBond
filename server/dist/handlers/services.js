"use strict";
/**
 * Agentra Services Discovery Handler
 *
 * Endpoint: GET /services (Free public endpoint)
 *
 * Exposes Agentra's available pay-per-use verification services, prices,
 * and machine-readable JSON schemas for autonomous AI agents to discover and invoke.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleServicesDiscovery = handleServicesDiscovery;
function handleServicesDiscovery(c) {
    const host = c.req.header('host') || 'localhost:4021';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    return c.json({
        protocol: 'x402',
        version: '1.0.0',
        name: 'Agentra — Autonomous Agent Verification Layer',
        tagline: 'Pay-per-use verification & risk intelligence tools for AI agents without API keys or subscriptions',
        network: {
            chain: 'Algorand',
            caip2: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FMnTVBg',
            networkName: 'Algorand TestNet',
            paymentAsset: 'USDC',
            asaId: 10458941,
            decimals: 6,
        },
        services: [
            {
                id: 'agentra.verify',
                name: 'Agentra Verify',
                description: 'Comprehensive risk, fraud, and policy verification for autonomous decisions (invoices, sellers, policies, contracts).',
                endpoint: `${baseUrl}/verify-task`,
                method: 'POST',
                price: {
                    usd: '$0.01',
                    currency: 'USDC',
                    microUnits: 10000,
                    paymentScheme: 'exact',
                },
                aiModel: {
                    primary: 'facebook/bart-large-mnli',
                    type: 'Zero-shot classification & heuristic risk analysis',
                    fallback: 'Deterministic heuristic rule engine',
                },
                inputSchema: {
                    type: 'object',
                    required: ['task', 'content'],
                    properties: {
                        task: {
                            type: 'string',
                            description: 'The verification question or decision intent (e.g. "Should I pay this invoice?")',
                            example: 'Should I pay this invoice?',
                        },
                        content: {
                            type: 'string',
                            description: 'The raw text, email, invoice, seller profile, or policy document to analyze',
                            example: 'Invoice #1049 from Acme Supplies. Total: $4,500. Please wire immediately to our new bank account...',
                        },
                        sourceUrl: {
                            type: 'string',
                            description: 'Optional URL origin or reference link of the content',
                            example: 'https://invoicing-portal.com/inv/1049',
                        },
                    },
                },
                outputSchema: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        service: { type: 'string', example: 'agentra.verify' },
                        decision: { type: 'string', enum: ['safe', 'suspicious', 'review_before_action'] },
                        risk: { type: 'string', enum: ['low', 'medium', 'high'] },
                        confidence: { type: 'number', example: 0.88 },
                        summary: { type: 'string' },
                        evidence: { type: 'array', items: { type: 'string' } },
                        recommendedAction: { type: 'string' },
                        modelUsed: { type: 'string', example: 'facebook/bart-large-mnli' },
                        paidVia: { type: 'string', example: 'x402 / USDC Algorand TestNet' },
                        timestamp: { type: 'string', format: 'date-time' },
                    },
                },
                agentToolDefinition: {
                    type: 'function',
                    function: {
                        name: 'agentra_verify_task',
                        description: 'Call Agentra to verify the safety, risk, or legitimacy of a task, transaction, seller, or policy before taking real-world action. Requires x402 payment of 0.01 USDC.',
                        parameters: {
                            type: 'object',
                            properties: {
                                task: { type: 'string', description: 'The question or action being verified' },
                                content: { type: 'string', description: 'The content/invoice/listing/contract to analyze' },
                                sourceUrl: { type: 'string', description: 'Optional source URL' },
                            },
                            required: ['task', 'content'],
                        },
                    },
                },
            },
        ],
        agentIntegrationGuide: {
            step1: 'Agent sends unauthenticated POST to /verify-task',
            step2: 'Server returns HTTP 402 with x402 payment challenge headers',
            step3: 'Agent signs 0.01 USDC transaction on Algorand TestNet and submits with payment signature header',
            step4: 'Server verifies payment on-chain and returns structured decision with evidence and confidence',
        },
    });
}
