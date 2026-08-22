"use strict";
/**
 * Agentra — Autonomous AI Agent Verification Server
 *
 * Powered by x402 Protocol on Algorand TestNet
 * Pay-per-use verification & risk intelligence layer for AI agents.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const hono_2 = require("@x402/hono");
const server_1 = require("@x402/core/server");
const server_2 = require("@x402/avm/exact/server");
const avm_1 = require("@x402/avm");
const extensions_1 = require("@x402-avm/extensions");
// Import handler functions
const verify_task_1 = require("./handlers/verify-task");
const services_1 = require("./handlers/services");
const weather_1 = require("./handlers/weather");
const meme_generator_1 = require("./handlers/meme-generator");
// Import endpoint configuration
const endpoints_config_1 = __importDefault(require("./endpoints.config"));
// Load environment variables
(0, dotenv_1.config)();
// ════════════════════════════════════════════════════════════════════
// CONFIGURATION & SETUP
// ════════════════════════════════════════════════════════════════════
const avmAddress = process.env.AVM_ADDRESS || 'AGENTRA77TESTNETRECEIVERWALLETADDRESSFORX402PAYMENTS';
const facilitatorUrl = process.env.FACILITATOR_URL || 'https://facilitator.goplausible.xyz';
const port = parseInt(process.env.PORT || '4021', 10);
console.log('\n' + '═'.repeat(60));
console.log('🤖 AGENTRA — AI AGENT VERIFICATION LAYER (x402)');
console.log('═'.repeat(60));
console.log('Configuration:');
console.log(`  Receiver Address: ${avmAddress}`);
console.log(`  Facilitator: ${facilitatorUrl}`);
console.log(`  Port: ${port}`);
console.log(`  Network: Algorand TestNet (CAIP-2: ${avm_1.ALGORAND_TESTNET_CAIP2})`);
console.log('═'.repeat(60) + '\n');
// Initialize x402 Resource Server
const facilitatorClient = new server_1.HTTPFacilitatorClient({ url: facilitatorUrl });
const x402Server = new server_1.x402ResourceServer(facilitatorClient)
    .register(avm_1.ALGORAND_TESTNET_CAIP2, new server_2.ExactAvmScheme())
    .registerExtension(extensions_1.bazaarResourceServerExtension);
// Create Hono app
const app = new hono_1.Hono();
// ════════════════════════════════════════════════════════════════════
// MIDDLEWARE STACK
// ════════════════════════════════════════════════════════════════════
/**
 * CORS Middleware - MUST be first!
 * Handles browser preflight requests and exposes payment headers
 */
app.use('*', async (c, next) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE, HEAD',
        'Access-Control-Allow-Headers': '*', // Critical for x402
        'Access-Control-Expose-Headers': '*', // Critical for x402
        'Access-Control-Max-Age': '86400',
    };
    // Handle OPTIONS preflight
    if (c.req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }
    // Add headers to response
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
    if (c.req.header('payment-signature')) {
        console.log('  ✓ Payment-Signature header detected');
    }
    await next();
    console.log(`  Response Status: ${c.res.status}`);
});
/**
 * X402 Payment Middleware
 * Applies payment protection to configured endpoints
 */
const paymentConfig = (0, endpoints_config_1.default)(avmAddress);
console.log('📋 Registered Payment-Protected Endpoints:');
Object.entries(paymentConfig).forEach(([route, config]) => {
    const price = config.accepts[0]?.price || 'unknown';
    console.log(`   ${route} - ${price} USDC - ${config.description}`);
});
console.log();
app.use((0, hono_2.paymentMiddleware)(paymentConfig, x402Server));
// ════════════════════════════════════════════════════════════════════
// ROUTE HANDLERS - Payment-Protected Endpoints
// ════════════════════════════════════════════════════════════════════
/**
 * AGENTRA PRIMARY PAID ENDPOINT: POST /verify-task
 * Cost: $0.01 USDC
 */
app.post('/verify-task', verify_task_1.handleVerifyTaskRequest);
// Legacy Demo Endpoints
app.get('/weather', weather_1.handleWeatherRequest);
app.post('/meme-generate', meme_generator_1.handleMemeGenerateRequest);
// ════════════════════════════════════════════════════════════════════
// PUBLIC / FREE ENDPOINTS - No payment required
// ════════════════════════════════════════════════════════════════════
/**
 * Discovery Endpoint - For AI Agents to discover available tools and schemas
 */
app.get('/services', services_1.handleServicesDiscovery);
/**
 * Health check
 */
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'agentra-verify-server',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
/**
 * Info endpoint
 */
app.get('/info', (c) => {
    return c.json({
        service: 'Agentra — AI Agent Verification Layer',
        version: '1.0.0',
        protocol: 'x402',
        network: 'Algorand TestNet',
        receiver: avmAddress,
        discoveryEndpoint: '/services',
        endpoints: Object.keys(paymentConfig),
    });
});
/**
 * Meme Styles endpoint (Legacy)
 */
app.get('/meme-styles', meme_generator_1.handleMemeStylesRequest);
// ════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ════════════════════════════════════════════════════════════════════
app.notFound((c) => {
    return c.json({
        error: 'Endpoint not found',
        path: c.req.path,
        hint: 'Try GET /services for discovery or GET /health for diagnostics',
    }, 404);
});
// ════════════════════════════════════════════════════════════════════
// SERVER STARTUP
// ════════════════════════════════════════════════════════════════════
(0, node_server_1.serve)({ fetch: app.fetch, port }, () => {
    console.log('\n🚀 Agentra Resource Server is running!\n');
    console.log('═'.repeat(60));
    console.log('Agentra Endpoints:');
    console.log(`  Verify Endpoint (Paid $0.01 USDC):  POST http://localhost:${port}/verify-task`);
    console.log(`  Agent Discovery (Free):             GET  http://localhost:${port}/services`);
    console.log(`  Health Check:                       GET  http://localhost:${port}/health`);
    console.log(`  Server Info:                        GET  http://localhost:${port}/info`);
    console.log('═'.repeat(60));
});
