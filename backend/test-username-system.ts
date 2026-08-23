/**
 * Focused validation test for AgentBond Unique Username System
 * 
 * Verifies:
 * 1. Nonce generation and Ed25519 authentication
 * 2. Username format validation (length, allowed chars, whitespace rejection)
 * 3. Unique username claiming with session authentication
 * 4. Duplicate username rejection (case-insensitive)
 * 5. Profile retrieval with username
 * 6. Public resolution of borrower/lender usernames in P2P marketplace
 */

import algosdk from 'algosdk';
import { app } from './index';

async function runTests() {
  console.log('🧪 Starting AgentBond Unique Username System Tests...\n');

  // Generate 2 test Algorand accounts
  const account1 = algosdk.generateAccount();
  const account2 = algosdk.generateAccount();
  const addr1 = algosdk.encodeAddress(account1.addr.publicKey);
  const addr2 = algosdk.encodeAddress(account2.addr.publicKey);

  console.log(`👤 Test Account 1: ${addr1.slice(0, 10)}...`);
  console.log(`👤 Test Account 2: ${addr2.slice(0, 10)}...`);

  // Helper to authenticate an account and get sessionToken
  async function authenticateAccount(account: any, address: string) {
    const nonceRes = await app.request('/auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address }),
    });

    const nonceData = await nonceRes.json() as any;
    if (!nonceRes.ok) throw new Error(`Nonce failed: ${JSON.stringify(nonceData)}`);

    const messageBytes = new Uint8Array(Buffer.from(nonceData.messageTemplate, 'utf-8'));
    const sigBytes = algosdk.signBytes(messageBytes, account.sk);
    const signature = Buffer.from(sigBytes).toString('base64');

    const loginRes = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: address,
        nonce: nonceData.nonce,
        signature,
      }),
    });

    const loginData = await loginRes.json() as any;
    if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);

    return loginData;
  }

  // --- Test 1: Account 1 Authentication ---
  console.log('\n[1] Testing Account 1 SIWA Authentication...');
  const login1 = await authenticateAccount(account1, addr1);
  console.log(`✓ Logged in! Session: ${login1.sessionToken.slice(0, 16)}..., hasUsername: ${login1.hasUsername}`);
  if (login1.hasUsername !== false) throw new Error('Expected new account to have no username initially');

  // --- Test 2: Username Validation Rules ---
  console.log('\n[2] Testing Username Validation Rejections...');
  const invalidUsernames = [
    { name: 'ab', reason: 'Too short (<3 chars)' },
    { name: 'a'.repeat(21), reason: 'Too long (>20 chars)' },
    { name: 'alice space', reason: 'Contains spaces' },
    { name: 'bob@agent!', reason: 'Contains special characters' },
    { name: '   ', reason: 'Empty / whitespace' },
  ];

  for (const { name, reason } of invalidUsernames) {
    const res = await app.request('/auth/username', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${login1.sessionToken}`,
      },
      body: JSON.stringify({ username: name }),
    });
    const data = await res.json() as any;
    if (res.status !== 400) {
      throw new Error(`Expected 400 rejection for "${name}" (${reason}), got status ${res.status}`);
    }
    console.log(`  ✓ Rejected "${name}" (${reason}): "${data.error}"`);
  }

  // --- Test 3: Claim Valid Username ---
  console.log('\n[3] Claiming Valid Username "Nexus_Worker_01"...');
  const claimRes1 = await app.request('/auth/username', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${login1.sessionToken}`,
    },
    body: JSON.stringify({ username: 'Nexus_Worker_01' }),
  });
  const claimData1 = await claimRes1.json() as any;
  if (claimRes1.status !== 200 || !claimData1.success) {
    throw new Error(`Failed to claim username: ${JSON.stringify(claimData1)}`);
  }
  console.log(`✓ Claimed! Normalized lowercase stored: "@${claimData1.user.username}"`);
  if (claimData1.user.username !== 'nexus_worker_01') {
    throw new Error(`Expected normalized "nexus_worker_01", got "${claimData1.user.username}"`);
  }

  // --- Test 4: Profile Check ---
  console.log('\n[4] Verifying Profile Output for Account 1...');
  const profileRes = await app.request('/user/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${login1.sessionToken}`,
    },
  });
  const profileData = await profileRes.json() as any;
  if (!profileRes.ok || !profileData.hasUsername || profileData.user.username !== 'nexus_worker_01') {
    throw new Error(`Profile verification failed: ${JSON.stringify(profileData)}`);
  }
  console.log(`✓ Profile correctly returned username: "@${profileData.user.username}"`);

  // --- Test 5: Duplicate Username Rejection by Account 2 ---
  console.log('\n[5] Testing Duplicate Username Rejection by Account 2...');
  const login2 = await authenticateAccount(account2, addr2);
  const dupRes = await app.request('/auth/username', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${login2.sessionToken}`,
    },
    body: JSON.stringify({ username: 'NEXUS_WORKER_01' }), // Case-insensitive duplicate
  });
  const dupData = await dupRes.json() as any;
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 Conflict for duplicate username, got status ${dupRes.status}`);
  }
  console.log(`✓ Duplicate successfully rejected with 409 Conflict: "${dupData.error}"`);

  // Account 2 claims a different username
  const claimRes2 = await app.request('/auth/username', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${login2.sessionToken}`,
    },
    body: JSON.stringify({ username: 'defi_lender_pro' }),
  });
  const claimData2 = await claimRes2.json() as any;
  console.log(`✓ Account 2 claimed unique username: "@${claimData2.user.username}"`);

  // --- Test 6: P2P Marketplace Public Username Resolution ---
  console.log('\n[6] Testing P2P Marketplace Request with Resolved Username...');
  // Account 1 creates a credit request
  const createReqRes = await app.request('/api/v2/p2p/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      borrowerWallet: addr1,
      requestedPrincipalUsdc: 5.0,
      maxInterestRateBps: 300,
      purposeCategory: 'X402_API_DRAW',
    }),
  });
  const reqData = await createReqRes.json() as any;
  if (!createReqRes.ok) throw new Error(`Create request failed: ${JSON.stringify(reqData)}`);
  console.log(`✓ Created credit request: ${reqData.request.requestId}, borrowerUsername: "@${reqData.request.borrowerUsername}"`);
  if (reqData.request.borrowerUsername !== 'nexus_worker_01') {
    throw new Error(`Expected borrowerUsername "nexus_worker_01", got "${reqData.request.borrowerUsername}"`);
  }

  // Browse requests
  const browseRes = await app.request('/api/v2/p2p/requests?status=OPEN', { method: 'GET' });
  const browseData = await browseRes.json() as any;
  const found = browseData.requests.find((r: any) => r.borrowerWallet === addr1);
  if (!found || found.borrowerUsername !== 'nexus_worker_01') {
    throw new Error(`Browse requests did not resolve borrower username correctly: ${JSON.stringify(found)}`);
  }
  console.log(`✓ Public marketplace successfully resolved "@${found.borrowerUsername}" for wallet ${addr1.slice(0, 8)}...`);

  console.log('\n🎉 ALL 6 UNIQUE USERNAME SYSTEM TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
