/**
 * X402 Hackathon Starter Kit - Endpoints Configuration
 * 
 * Agentra: Pay-per-use verification suite for autonomous AI agents.
 */

import { ALGORAND_TESTNET_CAIP2, USDC_TESTNET_ASA_ID } from '@x402/avm';
import { declareDiscoveryExtension } from '@x402-avm/extensions';

// Type definition for endpoints
export interface EndpointConfig {
  [key: string]: {
    accepts: Array<{
      scheme: 'exact';
      price: string;
      network: string;
      payTo: string;
      extra: { asset: number };
    }>;
    description: string;
    extensions?: Record<string, unknown>;
  };
}

/**
 * Endpoints payment configuration for Agentra
 */
export function createPaymentConfig(avmAddress: string): EndpointConfig {
  const defaultUsdcAsset = Number(USDC_TESTNET_ASA_ID);

  return {
    /**
     * 1. AGENTRA PRIMARY: POST /verify-task (Invoice & General Risk)
     * Price: $0.01 USDC
     */
    'POST /verify-task': {
      accepts: [
        {
          scheme: 'exact',
          price: '$0.01',
          network: ALGORAND_TESTNET_CAIP2,
          payTo: avmAddress,
          extra: { asset: defaultUsdcAsset },
        },
      ],
      description: 'Agentra AI Agent Verification - Pay $0.01 USDC',
      extensions: declareDiscoveryExtension({
        bodyType: 'json',
        input: {
          task: 'Should I pay this invoice?',
          content: 'Vendor says bank details changed today. Payment is urgent.',
        },
        output: {
          example: {
            success: true,
            service: 'agentra.verify',
            decision: 'suspicious',
            risk: 'high',
            confidence: 0.91,
            evidence: ['Bank details changed today', 'Urgent payment timeline'],
            recommendedAction: 'ABORT: Do not execute payment.',
            paidVia: 'x402 / USDC Algorand TestNet',
          },
        },
      }),
    },

    /**
     * 2. EMAIL PHISHING ANALYZER: POST /verify-email
     * Price: $0.01 USDC
     */
    'POST /verify-email': {
      accepts: [
        {
          scheme: 'exact',
          price: '$0.01',
          network: ALGORAND_TESTNET_CAIP2,
          payTo: avmAddress,
          extra: { asset: defaultUsdcAsset },
        },
      ],
      description: 'Agentra Email Phishing & Spoofing Analysis - Pay $0.01 USDC',
    },

    /**
     * 3. PRODUCT LISTING VERIFIER: POST /verify-product
     * Price: $0.01 USDC
     */
    'POST /verify-product': {
      accepts: [
        {
          scheme: 'exact',
          price: '$0.01',
          network: ALGORAND_TESTNET_CAIP2,
          payTo: avmAddress,
          extra: { asset: defaultUsdcAsset },
        },
      ],
      description: 'Agentra Product & Seller Trust Verification - Pay $0.01 USDC',
    },

    /**
     * 4. POLICY RISK SUMMARIZER: POST /verify-policy
     * Price: $0.01 USDC
     */
    'POST /verify-policy': {
      accepts: [
        {
          scheme: 'exact',
          price: '$0.01',
          network: ALGORAND_TESTNET_CAIP2,
          payTo: avmAddress,
          extra: { asset: defaultUsdcAsset },
        },
      ],
      description: 'Agentra Policy & Cancellation Lock-in Check - Pay $0.01 USDC',
    },

    /**
     * 5. OCR DOCUMENT EXTRACTOR: POST /extract-ocr
     * Price: $0.01 USDC
     */
    'POST /extract-ocr': {
      accepts: [
        {
          scheme: 'exact',
          price: '$0.01',
          network: ALGORAND_TESTNET_CAIP2,
          payTo: avmAddress,
          extra: { asset: defaultUsdcAsset },
        },
      ],
      description: 'Agentra OCR Document & Invoice Parsing - Pay $0.01 USDC',
    },

    /**
     * 6. PROMPT INJECTION GUARD: POST /guard-prompt
     * Price: $0.01 USDC
     */
    'POST /guard-prompt': {
      accepts: [
        {
          scheme: 'exact',
          price: '$0.01',
          network: ALGORAND_TESTNET_CAIP2,
          payTo: avmAddress,
          extra: { asset: defaultUsdcAsset },
        },
      ],
      description: 'Agentra Subagent Prompt Injection Filter - Pay $0.01 USDC',
    },

    /**
     * 7. PRIVACY AUDIT: POST /audit-privacy
     * Price: $0.01 USDC
     */
    'POST /audit-privacy': {
      accepts: [
        {
          scheme: 'exact',
          price: '$0.01',
          network: ALGORAND_TESTNET_CAIP2,
          payTo: avmAddress,
          extra: { asset: defaultUsdcAsset },
        },
      ],
      description: 'Agentra PII & GDPR Privacy Leak Validator - Pay $0.01 USDC',
    },

    /**
     * 8. WEATHER ORACLE (Legacy demo)
     * Price: $0.005 USDC
     */
    'GET /weather': {
      accepts: [
        {
          scheme: 'exact',
          price: '$0.005',
          network: ALGORAND_TESTNET_CAIP2,
          payTo: avmAddress,
          extra: { asset: defaultUsdcAsset },
        },
      ],
      description: 'Weather data access - Pay $0.005 USDC',
    },

    /**
     * 9. MEME GENERATOR (Legacy demo)
     * Price: $0.10 USDC
     */
    'POST /meme-generate': {
      accepts: [
        {
          scheme: 'exact',
          price: '$0.1',
          network: ALGORAND_TESTNET_CAIP2,
          payTo: avmAddress,
          extra: { asset: defaultUsdcAsset },
        },
      ],
      description: 'AI Meme Generator with RAG - Pay $0.1 USDC per image',
    },
  };
}

export default createPaymentConfig;
