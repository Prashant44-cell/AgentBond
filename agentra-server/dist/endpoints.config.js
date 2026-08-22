"use strict";
/**
 * X402 Hackathon Starter Kit - Endpoints Configuration
 *
 * Agentra: Pay-per-use verification service layer for AI agents.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentConfig = createPaymentConfig;
const avm_1 = require("@x402/avm");
const extensions_1 = require("@x402-avm/extensions");
/**
 * Endpoints payment configuration for Agentra
 */
function createPaymentConfig(avmAddress) {
    return {
        /**
         * AGENTRA PRIMARY ENDPOINT: POST /verify-task
         * Autonomous AI Agent Task & Content Verification
         * Price: $0.01 USDC (10,000 microunits)
         */
        'POST /verify-task': {
            accepts: [
                {
                    scheme: 'exact',
                    price: '$0.01',
                    network: avm_1.ALGORAND_TESTNET_CAIP2,
                    payTo: avmAddress,
                    extra: { asset: Number(avm_1.USDC_TESTNET_ASA_ID) },
                },
            ],
            description: 'Agentra AI Agent Verification - Pay $0.01 USDC',
            extensions: (0, extensions_1.declareDiscoveryExtension)({
                bodyType: 'json',
                input: {
                    task: 'Should I pay this invoice?',
                    content: 'Invoice #4920 for $2,400 from Acme Corp. Wire immediately to new bank account...',
                    sourceUrl: 'https://example.com/invoice',
                },
                inputSchema: {
                    type: 'object',
                    properties: {
                        task: { type: 'string' },
                        content: { type: 'string' },
                        sourceUrl: { type: 'string' },
                    },
                    required: ['task', 'content'],
                },
                output: {
                    example: {
                        success: true,
                        service: 'agentra.verify',
                        decision: 'suspicious',
                        risk: 'high',
                        confidence: 0.94,
                        summary: 'High risk detected. Content contains urgent wire transfer language and changed banking instructions.',
                        evidence: [
                            'Critical Warning: Content claims bank details or remittance routing changed recently.',
                            'Urgency Pressure: High-pressure language demanding immediate payment.',
                        ],
                        recommendedAction: 'ABORT: Do not execute payment without out-of-band verification.',
                        modelUsed: 'facebook/bart-large-mnli',
                        paidVia: 'x402 / USDC Algorand TestNet',
                        timestamp: '2026-08-22T12:00:00.000Z',
                    },
                },
            }),
        },
        /**
         * WEATHER DEMO ENDPOINT (Legacy)
         * Weather data access - Pay $0.005 USDC
         */
        'GET /weather': {
            accepts: [
                {
                    scheme: 'exact',
                    price: '$0.005',
                    network: avm_1.ALGORAND_TESTNET_CAIP2,
                    payTo: avmAddress,
                    extra: { asset: Number(avm_1.USDC_TESTNET_ASA_ID) },
                },
            ],
            description: 'Weather data access - Pay $0.005 USDC',
            extensions: (0, extensions_1.declareDiscoveryExtension)({
                output: {
                    example: {
                        city: 'San Francisco',
                        temperature: 64,
                        condition: 'Partly Cloudy',
                        humidity: 72,
                        timestamp: '2026-06-15T16:00:00.000Z',
                        paidVia: 'x402 / USDC Algorand Testnet',
                    },
                },
            }),
        },
        /**
         * MEME GENERATOR (Legacy)
         * Users pay 0.1 USDC per meme generation
         */
        'POST /meme-generate': {
            accepts: [
                {
                    scheme: 'exact',
                    price: '$0.1',
                    network: avm_1.ALGORAND_TESTNET_CAIP2,
                    payTo: avmAddress,
                    extra: { asset: Number(avm_1.USDC_TESTNET_ASA_ID) },
                },
            ],
            description: 'AI Meme Generator with RAG - Pay $0.1 USDC per image',
            extensions: (0, extensions_1.declareDiscoveryExtension)({
                bodyType: 'json',
                input: { topic: 'blockchain', style: 'funny' },
                inputSchema: {
                    properties: {
                        topic: { type: 'string' },
                        style: { type: 'string' },
                    },
                    required: ['topic'],
                },
                output: {
                    example: {
                        imageUrl: 'https://example.com/meme.png',
                        caption: 'When your smart contract finally deploys',
                        paidVia: 'x402 / USDC Algorand Testnet',
                    },
                },
            }),
        },
    };
}
exports.default = createPaymentConfig;
