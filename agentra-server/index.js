"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const dotenv_1 = require("dotenv");
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const hono_2 = require("@x402/hono");
const server_1 = require("@x402/core/server");
const server_2 = require("@x402/avm/exact/server");
const avm_1 = require("@x402/avm");
const extensions_1 = require("@x402-avm/extensions");
// Import AgentBond Credit Protocol Handlers
const agent_credit_1 = require("./handlers/agent-credit");
// Import verification handlers
const verify_task_1 = require("./handlers/verify-task");
const services_1 = require("./handlers/services");
const specialized_tools_1 = require("./handlers/specialized-tools");
const weather_1 = require("./handlers/weather");
const meme_generator_1 = require("./handlers/meme-generator");
// Import authentication handlers
const auth_1 = require("./handlers/auth");
const agent_request_1 = require("./handlers/agent-request");
// Import P2P Credit Marketplace Handlers
const p2p_marketplace_1 = require("./handlers/p2p-marketplace");
// Import endpoint configuration
const endpoints_config_1 = __importDefault(require("./endpoints.config"));
// Load environment variables
(0, dotenv_1.config)();
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
console.log(`  Network:          Algorand TestNet (CAIP-2: ${avm_1.ALGORAND_TESTNET_CAIP2})`);
console.log(`  Asset ID:         10458941 (TestNet USDC)`);
console.log('═'.repeat(65) + '\n');
// Initialize x402 Resource Server
const facilitatorClient = new server_1.HTTPFacilitatorClient({ url: facilitatorUrl });
const x402Server = new server_1.x402ResourceServer(facilitatorClient)
    .register(avm_1.ALGORAND_TESTNET_CAIP2, new server_2.ExactAvmScheme())
    .registerExtension(extensions_1.bazaarResourceServerExtension);
// Create Hono app
exports.app = new hono_1.Hono();
// ════════════════════════════════════════════════════════════════════
// MIDDLEWARE STACK
// ════════════════════════════════════════════════════════════════════
/**
 * CORS Middleware
 */
exports.app.use('*', async (c, next) => {
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
exports.app.use('*', async (c, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] ${c.req.method.toUpperCase()} ${c.req.path}`);
    await next();
    console.log(`  Response Status: ${c.res.status}`);
});
// ════════════════════════════════════════════════════════════════════
// AGENTBOND CREDIT PROTOCOL API ENDPOINTS (Public / JSON-RPC)
// ════════════════════════════════════════════════════════════════════
exports.app.get('/api/credit/bureau', agent_credit_1.handleGetCreditBureau);
exports.app.get('/api/credit/agent/:id', agent_credit_1.handleGetAgentProfile);
exports.app.post('/api/credit/agents/register', agent_credit_1.handleRegisterAgent);
exports.app.post('/api/credit/draw', agent_credit_1.handleDrawCredit);
exports.app.post('/api/credit/verify-outcome', agent_credit_1.handleVerifyOutcome);
exports.app.post('/api/credit/repay', agent_credit_1.handleRepayCredit);
exports.app.get('/api/credit/pool', agent_credit_1.handleGetPoolStats);
// ════════════════════════════════════════════════════════════════════
// AUTHENTICATION & PROFILE ENDPOINTS (SIWA / Public)
// ════════════════════════════════════════════════════════════════════
exports.app.post('/auth/nonce', auth_1.handleGetNonce);
exports.app.post('/auth/login', auth_1.handleLogin);
exports.app.get('/user/profile', auth_1.handleGetUserProfile);
exports.app.get('/user/analytics', auth_1.handleGetUserAnalytics);
exports.app.post('/auth/logout', auth_1.handleLogout);
// Agent Request Portal Endpoints
exports.app.post('/api/agent-requests', agent_request_1.handleCreateAgentRequest);
exports.app.get('/api/agent-requests', agent_request_1.handleGetAgentRequests);
// ════════════════════════════════════════════════════════════════════
// P2P AGENT CREDIT MARKETPLACE API ENDPOINTS (v2)
// ════════════════════════════════════════════════════════════════════
exports.app.post('/api/v2/p2p/requests', p2p_marketplace_1.handleCreateCreditRequest);
exports.app.get('/api/v2/p2p/requests', p2p_marketplace_1.handleGetCreditRequests);
exports.app.post('/api/v2/p2p/offers', p2p_marketplace_1.handleCreateLoanOffer);
exports.app.get('/api/v2/p2p/offers', p2p_marketplace_1.handleGetLoanOffers);
exports.app.post('/api/v2/p2p/contracts/assemble', p2p_marketplace_1.handleAssembleContract);
exports.app.post('/api/v2/p2p/contracts/sign', p2p_marketplace_1.handleSignContract);
exports.app.post('/api/v2/p2p/repay', p2p_marketplace_1.handleRepayLoan);
exports.app.post('/api/v2/p2p/chat/message', p2p_marketplace_1.handleSendChatMessage);
exports.app.get('/api/v2/p2p/chat/:threadId', p2p_marketplace_1.handleGetChatHistory);
// Discovery and diagnostics
exports.app.get('/services', services_1.handleServicesDiscovery);
exports.app.get('/meme-styles', meme_generator_1.handleMemeStylesRequest);
exports.app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        protocol: 'AgentBond Protocol',
        version: '2.5.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
exports.app.get('/info', (c) => {
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
const paymentConfig = (0, endpoints_config_1.default)(avmAddress);
exports.app.use((0, hono_2.paymentMiddleware)(paymentConfig, x402Server));
// Verification Engines ($0.01 USDC each)
exports.app.post('/verify-task', verify_task_1.handleVerifyTaskRequest);
exports.app.post('/verify-email', specialized_tools_1.handleEmailPhishingRequest);
exports.app.post('/verify-product', specialized_tools_1.handleProductVerifierRequest);
exports.app.post('/verify-policy', specialized_tools_1.handlePolicyRiskRequest);
exports.app.post('/extract-ocr', specialized_tools_1.handleOcrExtractorRequest);
exports.app.post('/guard-prompt', specialized_tools_1.handlePromptGuardRequest);
exports.app.post('/audit-privacy', specialized_tools_1.handlePrivacyAuditRequest);
// Oracle & Generative
exports.app.get('/weather', weather_1.handleWeatherRequest);
exports.app.post('/meme-generate', meme_generator_1.handleMemeGenerateRequest);
// ════════════════════════════════════════════════════════════════════
// ERROR HANDLING & SERVER STARTUP
// ════════════════════════════════════════════════════════════════════
exports.app.notFound((c) => {
    return c.json({
        error: 'Endpoint not found',
        path: c.req.path,
        hint: 'Try GET /api/credit/bureau or GET /services for discovery',
    }, 404);
});
(0, node_server_1.serve)({ fetch: exports.app.fetch, port }, () => {
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
