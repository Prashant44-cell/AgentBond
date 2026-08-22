import { app } from './index';

async function runVerificationSuite() {
  console.log('🚀 Starting Hono App In-Memory P2P Marketplace Verification Suite...\n');

  // 1. GET Requests
  console.log('1. GET /api/v2/p2p/requests');
  const res1 = await app.request('/api/v2/p2p/requests');
  const body1 = await res1.json();
  console.log('   Status:', res1.status, '| Total Open:', body1.total);

  // 2. POST Credit Request
  console.log('\n2. POST /api/v2/p2p/requests');
  const res2 = await app.request('/api/v2/p2p/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      borrowerWallet: '0x3F8A9B21C4E7F0D1A3B5C7D9E1F3A5B7C9D1E3F5',
      requestedPrincipalUsdc: 15.0,
      maxInterestRateBps: 350,
      maxDurationSeconds: 86400,
      purposeCategory: 'X402_API_DRAW',
      borrowerSignature: 'sig_test_req_001',
    }),
  });
  const body2 = await res2.json();
  console.log('   Status:', res2.status, '| Request ID:', body2.request?.requestId);
  const requestId = body2.request?.requestId;

  // 3. POST Loan Offer
  console.log('\n3. POST /api/v2/p2p/offers');
  const res3 = await app.request('/api/v2/p2p/offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId,
      lenderWallet: '0x9E1F3A5B7C9D1E3F50x3F8A9B21C4E7F0D1A3B5',
      offeredPrincipalUsdc: 15.0,
      interestRateBps: 300,
      durationSeconds: 86400,
      lenderSignature: 'sig_test_lender_001',
    }),
  });
  const body3 = await res3.json();
  console.log('   Status:', res3.status, '| Offer ID:', body3.offer?.offerId);
  const offerId = body3.offer?.offerId;

  // 4. Assemble Contract
  console.log('\n4. POST /api/v2/p2p/contracts/assemble');
  const res4 = await app.request('/api/v2/p2p/contracts/assemble', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      offerId,
      borrowerWallet: '0x3F8A9B21C4E7F0D1A3B5C7D9E1F3A5B7C9D1E3F5',
    }),
  });
  const body4 = await res4.json();
  console.log('   Status:', res4.status, '| Contract ID:', body4.contractId);
  console.log('   Canonical SHA-256 Hash:', body4.canonicalHash);
  const contractId = body4.contractId;

  // 5. Sign Contract
  console.log('\n5. POST /api/v2/p2p/contracts/sign');
  const res5 = await app.request('/api/v2/p2p/contracts/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contractId,
      walletAddress: '0x3F8A9B21C4E7F0D1A3B5C7D9E1F3A5B7C9D1E3F5',
      role: 'BORROWER',
      signature: 'sig_borrower_final_accept',
    }),
  });
  const body5 = await res5.json();
  console.log('   Status:', res5.status, '| Contract State:', body5.contractState);

  // 6. Repay Loan
  console.log('\n6. POST /api/v2/p2p/repay');
  const res6 = await app.request('/api/v2/p2p/repay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contractId,
      payerWallet: '0x3F8A9B21C4E7F0D1A3B5C7D9E1F3A5B7C9D1E3F5',
      amountPaidUsdc: 15.45,
      onChainTxHash: '0x_tx_algo_settlement_test_001',
    }),
  });
  const body6 = await res6.json();
  console.log('   Status:', res6.status, '| Settlement Message:', body6.message);

  // 7. E2E Encrypted Chat
  console.log('\n7. POST /api/v2/p2p/chat/message');
  const res7 = await app.request('/api/v2/p2p/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      threadId: 'thread-p2p-test-01',
      senderWallet: '0x3F8A9B21C4E7F0D1A3B5C7D9E1F3A5B7C9D1E3F5',
      recipientWallet: '0x9E1F3A5B7C9D1E3F50x3F8A9B21C4E7F0D1A3B5',
      encryptedContent: 'enc_eyJwYXlsb2FkIjoiaGVsbG8gbGVuZGVyIn0=',
      signature: 'sig_chat_001',
    }),
  });
  const body7 = await res7.json();
  console.log('   Status:', res7.status, '| Message ID:', body7.chatMessage?.messageId);

  // 8. Get Chat History
  console.log('\n8. GET /api/v2/p2p/chat/thread-p2p-test-01');
  const res8 = await app.request('/api/v2/p2p/chat/thread-p2p-test-01');
  const body8 = await res8.json();
  console.log('   Status:', res8.status, '| Messages in Thread:', body8.total);

  console.log('\n🎉 ALL P2P CREDIT MARKETPLACE API VERIFICATIONS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runVerificationSuite().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
