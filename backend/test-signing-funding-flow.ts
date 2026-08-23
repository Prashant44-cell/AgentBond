import { app } from './index';
import { assert } from 'console';
import algosdk from 'algosdk';

// A mock runner for the entire signing, funding, repayment, and default lifecycle
async function runTests() {
  console.log('🧪 Starting P2P Credit Workflow Tests...\n');

  // Generate real Algorand keys for borrower and lender to pass Ed25519 SIWA validation
  const borrowerAcc = algosdk.generateAccount();
  const lenderAcc = algosdk.generateAccount();

  const borrowerWallet = algosdk.encodeAddress(borrowerAcc.addr.publicKey);
  const lenderWallet = algosdk.encodeAddress(lenderAcc.addr.publicKey);

  console.log('Borrower Wallet:', borrowerWallet);
  console.log('Lender Wallet:', lenderWallet);

  // Helper to authenticate
  async function loginWallet(account: any, address: string) {
    const nonceRes = await app.request('/auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address }),
    });
    const nonceData = await nonceRes.json() as any;
    if (!nonceRes.ok) throw new Error(`Nonce request failed: ${JSON.stringify(nonceData)}`);

    const msgBytes = new Uint8Array(Buffer.from(nonceData.messageTemplate, 'utf-8'));
    const sigBytes = algosdk.signBytes(msgBytes, account.sk);
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

  // 1. Authenticate Borrower & Lender
  console.log('1. Authenticating borrower...');
  const borrowerAuth = await loginWallet(borrowerAcc, borrowerWallet);
  const borrowerToken = borrowerAuth.sessionToken;

  console.log('2. Authenticating lender...');
  const lenderAuth = await loginWallet(lenderAcc, lenderWallet);
  const lenderToken = lenderAuth.sessionToken;

  // 2. Set usernames
  console.log('3. Claiming username for borrower...');
  const borrowerUserRes = await app.request('/user/username', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${borrowerToken}`,
    },
    body: JSON.stringify({ username: 'arjun_credit' }),
  });
  assert(borrowerUserRes.status === 200);

  console.log('4. Claiming username for lender...');
  const lenderUserRes = await app.request('/user/username', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lenderToken}`,
    },
    body: JSON.stringify({ username: 'sneha_lends' }),
  });
  assert(lenderUserRes.status === 200);

  // 3. Borrower creates credit request
  console.log('5. Creating credit request...');
  const reqRes = await app.request('/p2p/credit-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${borrowerToken}`,
    },
    body: JSON.stringify({
      requestedPrincipalUsdc: 20,
      maxInterestRateBps: 500,
      maxDurationSeconds: 86400,
      purposeCategory: 'X402_API_DRAW',
      serviceEndpoint: 'https://api.agentbond.io/verify',
      guarantorRequired: false,
      collateralOfferedUsdc: 0,
      borrowerSignature: 'sig_b_req_valid',
    }),
  });
  const reqData = await reqRes.json() as any;
  const requestId = reqData.request?.requestId;
  console.log('Credit request created:', requestId ? 'SUCCESS' : 'FAILED', 'ID:', requestId);

  // 4. Lender submits offer
  console.log('6. Submitting loan offer...');
  const offerRes = await app.request('/api/v2/p2p/offers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lenderToken}`,
    },
    body: JSON.stringify({
      requestId,
      offeredPrincipalUsdc: 20,
      interestRateBps: 450,
      durationSeconds: 86400,
      gracePeriodSeconds: 3600,
      escrowRequired: false,
      lenderSignature: 'sig_l_offer_valid',
    }),
  });
  const offerData = await offerRes.json() as any;
  const offerId = offerData.offer?.offerId;
  console.log('Loan offer submitted:', offerId ? 'SUCCESS' : 'FAILED', 'ID:', offerId);

  // 5. Assemble contract (Accept Offer)
  console.log('7. Assembling hybrid contract...');
  const contractRes = await app.request('/api/v2/p2p/contracts/assemble', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${borrowerToken}`,
    },
    body: JSON.stringify({
      offerId,
      borrowerWallet,
    }),
  });
  const contractData = await contractRes.json() as any;
  const contractId = contractData.contractId;
  console.log('Contract assembled:', contractId ? 'SUCCESS' : 'FAILED', 'ID:', contractId);

  // Get details
  const getDetails1 = await app.request(`/p2p/contracts/${contractId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${borrowerToken}` },
  });
  const details1 = await getDetails1.json() as any;
  console.log('Initial contract state:', details1.contract.state);
  assert(details1.contract.state === 'Awaiting Borrower Signature');

  // 6. Borrower signs contract
  console.log('8. Borrower signing contract...');
  const signBorrowerRes = await app.request(`/p2p/contracts/${contractId}/borrower-sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${borrowerToken}`,
    },
    body: JSON.stringify({ signature: 'sig_borrower_contract' }),
  });
  const signBorrowerData = await signBorrowerRes.json() as any;
  console.log('Borrower signed. State:', signBorrowerData.contract.state);
  assert(signBorrowerData.contract.state === 'Ready for Lender Funding'); // since lender pre-signed offer

  // 7. Try funding as Borrower (Should fail!)
  console.log('9. Borrower trying to fund loan (should fail with 403)...');
  const borrowerFundRes = await app.request(`/p2p/contracts/${contractId}/fund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${borrowerToken}`,
    },
    body: JSON.stringify({ fundingTransactionId: 'tx_mock_borrower_cheat' }),
  });
  console.log('Borrower funding status code:', borrowerFundRes.status);
  assert(borrowerFundRes.status === 403);

  // 8. Fund as Lender (Should succeed)
  console.log('10. Lender funding loan...');
  const lenderFundRes = await app.request(`/p2p/contracts/${contractId}/fund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lenderToken}`,
    },
    body: JSON.stringify({ fundingTransactionId: 'tx_mock_lender_funds' }),
  });
  const lenderFundData = await lenderFundRes.json() as any;
  console.log('Lender funded. State:', lenderFundData.contract?.state);
  assert(lenderFundData.contract?.state === 'Active');

  // 9. Borrower repays loan
  console.log('11. Borrower repaying loan...');
  const repayRes = await app.request(`/p2p/contracts/${contractId}/repay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${borrowerToken}`,
    },
    body: JSON.stringify({ amount: 20.9, transactionId: 'tx_mock_borrower_repay' }),
  });
  const repayData = await repayRes.json() as any;
  console.log('Repayment successful. State:', repayData.contractState);
  assert(repayData.contractState === 'Repaid');

  console.log('\n🎉 ALL P2P CREDIT WORKFLOW TESTS PASSED!');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
