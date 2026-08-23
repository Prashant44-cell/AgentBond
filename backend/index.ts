/**
 * AgentBond — Machine-to-Machine Trust & Outcome-Backed Credit Protocol for Autonomous AI Agents
 * 
 * Powered by x402 Protocol on Algorand TestNet (USDC ASA 10458941)
 * 
 * Core Features:
 * 1. Agent Identity & Reputation Bureau
 * 2. Multi-Factor Outcome-Backed Credit Underwriting Engine (300 - 850)
 * 3. Credit Line Draw & Instant x402 Settlement Gateway
 * 4. Independent Task Outcome Quality Verifier
 * 5. Dynamic Repayment & Credit Limit Evolution Engine
 * 6. Sponsor Liquidity Vaults & Yield Staking Pool
 * 7. 12-Tool Verification Intelligence Suite
 */

import { config } from 'dotenv';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { paymentMiddleware } from '@x402/hono';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import type { ResourceServerExtension } from '@x402/core/types';
import { ExactAvmScheme } from '@x402/avm/exact/server';
import { ALGORAND_TESTNET_CAIP2 } from '@x402/avm';
import { bazaarResourceServerExtension } from '@x402-avm/extensions';

// Import AgentBond Credit Protocol Handlers
import {
  handleGetCreditBureau,
  handleGetAgentProfile,
  handleRegisterAgent,
  handleDrawCredit,
  handleVerifyOutcome,
  handleRepayCredit,
  handleGetPoolStats,
} from './handlers/agent-credit';

// Import verification handlers
import { handleVerifyTaskRequest } from './handlers/verify-task';
import { handleServicesDiscovery } from './handlers/services';
import {
  handleEmailPhishingRequest,
  handleProductVerifierRequest,
  handlePolicyRiskRequest,
  handleOcrExtractorRequest,
  handlePromptGuardRequest,
  handlePrivacyAuditRequest,
} from './handlers/specialized-tools';
import { handleWeatherRequest } from './handlers/weather';
import { handleMemeGenerateRequest, handleMemeStylesRequest } from './handlers/meme-generator';

// Import authentication handlers
import {
  handleGetNonce,
  handleLogin,
  handleSetUsername,
  handleGetUserProfile,
  handleGetUserAnalytics,
  handleLogout,
  securityAuditLogsDb,
} from './handlers/auth';

import {
  handleCreateAgentRequest,
  handleGetAgentRequests,
} from './handlers/agent-request';

// Import P2P Credit Marketplace Handlers
import {
  handleCreateCreditRequest,
  handleGetCreditRequests,
  handleCreateLoanOffer,
  handleGetLoanOffers,
  handleAssembleContract,
  handleSignContract,
  handleRepayLoan,
  handleSendChatMessage,
  handleGetChatHistory,
  handleBorrowerSignContract,
  handleLenderSignContract,
  handleFundLoan,
  handleRepayContractLoan,
  handleGetContractDetails,
  handleGetContractsList,
} from './handlers/p2p-marketplace';

// Import endpoint configuration
import createPaymentConfig, { EndpointConfig } from './endpoints.config';

// Load environment variables
config();

// ════════════════════════════════════════════════════════════════════
// CONFIGURATION & SETUP
// ════════════════════════════════════════════════════════════════════

const avmAddress = process.env.AVM_ADDRESS || 'LGMP4QUQ5RB553RZEP6TQHUQDOBJCDOYXHT5AGCAKB6B4TIE5IXA5HMKZA';
const facilitatorUrl = process.env.FACILITATOR_URL || 'https://facilitator.goplausible.xyz';
const port = parseInt(process.env.PORT || '4021', 10);

console.log('\n' + '═'.repeat(65));
console.log('🤖 AGENTBOND — OUTCOME-BACKED CREDIT PROTOCOL FOR AI AGENTS (x402)');
console.log('═'.repeat(65));
console.log('Configuration:');
console.log(`  Receiver Address: ${avmAddress}`);
console.log(`  Facilitator:      ${facilitatorUrl}`);
console.log(`  Port:             ${port}`);
console.log(`  Network:          Algorand TestNet (CAIP-2: ${ALGORAND_TESTNET_CAIP2})`);
console.log(`  Asset ID:         10458941 (TestNet USDC)`);
console.log('═'.repeat(65) + '\n');

// Initialize x402 Resource Server
const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
const x402Server = new x402ResourceServer(facilitatorClient)
  .register(ALGORAND_TESTNET_CAIP2, new ExactAvmScheme())
  .registerExtension(bazaarResourceServerExtension as unknown as ResourceServerExtension);

// Create Hono app
export const app = new Hono();

// ════════════════════════════════════════════════════════════════════
// MIDDLEWARE STACK
// ════════════════════════════════════════════════════════════════════

/**
 * CORS Middleware
 */
app.use('*', async (c, next) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE, HEAD',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': '*',
    'Access-Control-Max-Age': '86400',
  };

  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    c.header(key, value);
  });

  await next();
});

/**
 * Logging Middleware
 */
app.use('*', async (c, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${c.req.method.toUpperCase()} ${c.req.path}`);
  await next();
  console.log(`  Response Status: ${c.res.status}`);
});

// ════════════════════════════════════════════════════════════════════
// AGENTBOND CREDIT PROTOCOL API ENDPOINTS (Public / JSON-RPC)
// ════════════════════════════════════════════════════════════════════

app.get('/api/credit/bureau', handleGetCreditBureau);
app.get('/api/credit/agent/:id', handleGetAgentProfile);
app.post('/api/credit/agents/register', handleRegisterAgent);
app.post('/api/credit/draw', handleDrawCredit);
app.post('/api/credit/verify-outcome', handleVerifyOutcome);
app.post('/api/credit/repay', handleRepayCredit);
app.get('/api/credit/pool', handleGetPoolStats);

// ════════════════════════════════════════════════════════════════════
// AUTHENTICATION & PROFILE ENDPOINTS (SIWA / Public)
// ════════════════════════════════════════════════════════════════════

app.post('/auth/nonce', handleGetNonce);
app.post('/auth/login', handleLogin);
app.post('/auth/username', handleSetUsername);
app.get('/user/profile', handleGetUserProfile);
app.get('/user/analytics', handleGetUserAnalytics);
app.post('/auth/logout', handleLogout);
app.get('/security/audit-logs', (c) => c.json({ success: true, logs: securityAuditLogsDb }));

// Agent Request Portal Endpoints
app.post('/api/agent-requests', handleCreateAgentRequest);
app.get('/api/agent-requests', handleGetAgentRequests);

// ════════════════════════════════════════════════════════════════════
// P2P AGENT CREDIT MARKETPLACE API ENDPOINTS (v2)
// ════════════════════════════════════════════════════════════════════
app.post('/api/v2/p2p/requests', handleCreateCreditRequest);
app.get('/api/v2/p2p/requests', handleGetCreditRequests);
app.post('/api/v2/p2p/offers', handleCreateLoanOffer);
app.get('/api/v2/p2p/offers', handleGetLoanOffers);
app.post('/api/v2/p2p/contracts/assemble', handleAssembleContract);
app.post('/api/v2/p2p/contracts/sign', handleSignContract);
app.post('/api/v2/p2p/repay', handleRepayLoan);
app.post('/api/v2/p2p/chat/message', handleSendChatMessage);
app.get('/api/v2/p2p/chat/:threadId', handleGetChatHistory);

// Spec-compliant routes (Section 11)
app.post('/p2p/credit-requests', handleCreateCreditRequest);
app.get('/p2p/credit-requests', handleGetCreditRequests);
app.post('/p2p/contracts/:id/borrower-sign', handleBorrowerSignContract);
app.post('/p2p/contracts/:id/lender-sign', handleLenderSignContract);
app.post('/p2p/contracts/:id/fund', handleFundLoan);
app.post('/p2p/contracts/:id/repay', handleRepayContractLoan);
app.get('/p2p/contracts/:id', handleGetContractDetails);
app.get('/p2p/contracts', handleGetContractsList);
app.post('/user/username', handleSetUsername);

// Discovery and diagnostics
app.get('/services', handleServicesDiscovery);
app.get('/meme-styles', handleMemeStylesRequest);

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    protocol: 'AgentBond Protocol',
    version: '2.5.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/info', (c) => {
  return c.json({
    name: 'AgentBond',
    description: 'Outcome-Backed Trust & Machine-to-Machine Credit Protocol for Autonomous AI Agents',
    version: '2.5.0',
    protocol: 'x402 on Algorand TestNet',
    assetId: 10458941,
    receiver: avmAddress,
    bureauEndpoint: '/api/credit/bureau',
    drawEndpoint: '/api/credit/draw',
    verifyOutcomeEndpoint: '/api/credit/verify-outcome',
    repayEndpoint: '/api/credit/repay',
  });
});

// ════════════════════════════════════════════════════════════════════
// X402 PAYMENT MIDDLEWARE & PROTECTED ENDPOINTS
// ════════════════════════════════════════════════════════════════════

const paymentConfig: EndpointConfig = createPaymentConfig(avmAddress);
app.use(paymentMiddleware(paymentConfig as any, x402Server));

// Verification Engines ($0.01 USDC each)
app.post('/verify-task', handleVerifyTaskRequest);
app.post('/verify-email', handleEmailPhishingRequest);
app.post('/verify-product', handleProductVerifierRequest);
app.post('/verify-policy', handlePolicyRiskRequest);
app.post('/extract-ocr', handleOcrExtractorRequest);
app.post('/guard-prompt', handlePromptGuardRequest);
app.post('/audit-privacy', handlePrivacyAuditRequest);

// Oracle & Generative
app.get('/weather', handleWeatherRequest);
app.post('/meme-generate', handleMemeGenerateRequest);

// ════════════════════════════════════════════════════════════════════
// ERROR HANDLING & SERVER STARTUP
// ════════════════════════════════════════════════════════════════════

app.notFound((c) => {
  return c.json(
    {
      error: 'Endpoint not found',
      path: c.req.path,
      hint: 'Try GET /api/credit/bureau or GET /services for discovery',
    },
    404
  );
});

const isTestRun = process.argv[1] && process.argv[1].includes('test');
if (!isTestRun) {
  serve({ fetch: app.fetch, port }, () => {
    console.log('\n🚀 AgentBond Credit Protocol Server is live!\n');
    console.log('═'.repeat(65));
    console.log(`  API Base:            http://localhost:${port}`);
    console.log(`  Agent Credit Bureau: GET  http://localhost:${port}/api/credit/bureau`);
    console.log(`  Credit Draw Gateway: POST http://localhost:${port}/api/credit/draw`);
    console.log(`  Outcome Verifier:    POST http://localhost:${port}/api/credit/verify-outcome`);
    console.log(`  Debt Settlement:     POST http://localhost:${port}/api/credit/repay`);
    console.log(`  Liquidity Pool:      GET  http://localhost:${port}/api/credit/pool`);
    console.log(`  x402 Verification:   POST http://localhost:${port}/verify-*`);
    console.log('═'.repeat(65));
  });
}