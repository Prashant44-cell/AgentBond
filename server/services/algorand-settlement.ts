const MICRO_USDC = 1_000_000;
const DEFAULT_USDC_TESTNET_ASSET_ID = 10458941;

export type SettlementResult = { transactionId: string; confirmedRound: number };

export async function verifyConfirmedUsdcTransfer(
  transactionId: string,
  expectedSender: string,
  expectedReceiver: string,
  expectedAmountUsdc: number,
): Promise<SettlementResult> {
  const assetId = Number(process.env.USDC_TESTNET_ASSET_ID || DEFAULT_USDC_TESTNET_ASSET_ID);
  const response = await fetch(`${process.env.ALGORAND_INDEXER_URL || 'https://testnet-idx.algonode.cloud'}/v2/transactions/${transactionId}`);
  if (!response.ok) throw new Error('Algorand TestNet transaction was not found.');
  const payload = await response.json() as any;
  const tx = payload.transaction;
  const transfer = tx?.['asset-transfer-transaction'];
  const confirmedRound = Number(tx?.['confirmed-round'] || 0);
  if (!tx || !transfer || !confirmedRound) throw new Error('Payment is not confirmed on Algorand TestNet.');
  if (tx.sender !== expectedSender || transfer.receiver !== expectedReceiver) throw new Error('Payment wallet does not match the authenticated settlement parties.');
  if (Number(transfer['asset-id']) !== assetId) throw new Error('Payment asset is not AgentBond TestNet USDC.');
  if (Math.abs(Number(transfer.amount) / MICRO_USDC - expectedAmountUsdc) > 0.000001) throw new Error('Payment amount does not match the credit obligation.');
  return { transactionId, confirmedRound };
}
