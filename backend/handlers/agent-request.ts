/**
 * AgentBond - Agent Request Portal Backend Handler
 * 
 * Saves incoming custom AI agent requests into a structured Excel/CSV database file
 * with headers: Timestamp, RequestID, AgentName, WorkflowRisk, VerificationChecks,
 * ProposedFeeUSDC, Organization, WalletAddress, ContactEmail, Status
 */

import type { Context } from 'hono';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CSV_FILE_PATH = path.join(process.cwd(), 'agent_requests.csv');

// Initialize CSV file with headers if it does not exist
function initializeCsvFile() {
  if (!fs.existsSync(CSV_FILE_PATH)) {
    const headers = [
      'Timestamp',
      'RequestID',
      'AgentName',
      'WorkflowRisk',
      'VerificationChecks',
      'ProposedFeeUSDC',
      'Organization',
      'WalletAddress',
      'ContactEmail',
      'Status',
    ].join(',');
    fs.writeFileSync(CSV_FILE_PATH, headers + '\n', 'utf-8');
    console.log(`📁 [Agent Requests] Initialized Excel CSV database at: ${CSV_FILE_PATH}`);
  }
}

// Escape values for CSV/Excel formatting
function escapeCsvValue(val: string | number | undefined): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""').replace(/[\n\r]+/g, ' ');
  return `"${str}"`;
}

/**
 * POST /api/agent-requests
 * Submits a new custom AI agent request and appends to backend Excel/CSV
 */
export async function handleCreateAgentRequest(c: Context) {
  try {
    initializeCsvFile();

    const body = await c.req.json().catch(() => ({}));
    const {
      agentName,
      workflowRisk,
      verificationChecks,
      proposedFeeUsdc,
      organization,
      walletAddress,
      contactEmail,
    } = body;

    if (!agentName || !workflowRisk) {
      return c.json(
        { error: 'Agent Name and Workflow Risk Description are required.' },
        400
      );
    }

    const requestId = `REQ-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const status = 'Pending_Review';

    const row = [
      escapeCsvValue(timestamp),
      escapeCsvValue(requestId),
      escapeCsvValue(agentName),
      escapeCsvValue(workflowRisk),
      escapeCsvValue(verificationChecks || 'Standard Risk Heuristics'),
      escapeCsvValue(proposedFeeUsdc || '0.01'),
      escapeCsvValue(organization || 'Independent Developer'),
      escapeCsvValue(walletAddress || 'Anonymous / Unconnected'),
      escapeCsvValue(contactEmail || 'N/A'),
      escapeCsvValue(status),
    ].join(',');

    fs.appendFileSync(CSV_FILE_PATH, row + '\n', 'utf-8');
    console.log(`📝 [Agent Request] Logged new request ${requestId} for "${agentName}" to Excel CSV database.`);

    return c.json({
      success: true,
      requestId,
      message: 'Custom agent request successfully submitted and logged to backend Excel database.',
      timestamp,
      data: {
        requestId,
        agentName,
        workflowRisk,
        proposedFeeUsdc: proposedFeeUsdc || '0.01',
        status,
      },
    });
  } catch (err) {
    console.error('Error logging agent request to CSV:', err);
    return c.json(
      { error: 'Failed to record agent request', details: (err as Error).message },
      500
    );
  }
}

/**
 * GET /api/agent-requests
 * Returns list of recent submitted agent requests
 */
export async function handleGetAgentRequests(c: Context) {
  try {
    initializeCsvFile();
    const content = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    const lines = content.trim().split('\n');

    if (lines.length <= 1) {
      return c.json({ requests: [] });
    }

    const headers = lines[0].split(',');
    const requests = lines.slice(1).map((line) => {
      const parts = line.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^,]+)/g) || [];
      const cleanParts = parts.map((p) => p.replace(/^"|"$/g, '').replace(/""/g, '"'));
      return {
        timestamp: cleanParts[0],
        requestId: cleanParts[1],
        agentName: cleanParts[2],
        workflowRisk: cleanParts[3],
        verificationChecks: cleanParts[4],
        proposedFeeUsdc: cleanParts[5],
        organization: cleanParts[6],
        walletAddress: cleanParts[7],
        contactEmail: cleanParts[8],
        status: cleanParts[9],
      };
    });

    return c.json({ requests: requests.reverse().slice(0, 20) });
  } catch (err) {
    return c.json({ requests: [] });
  }
}
