import { Connection } from '@solana/web3.js';
import { redis } from './redis';

const PLATFORM_WALLET = 'A692UafMRPEofwLsnD1NjWF9usiePRTJAd4Cpz8m6Y5X';
const EXPECTED_FEE_SOL = 0.01;
const EXPECTED_FEE_LAMPORTS = EXPECTED_FEE_SOL * 1_000_000_000;

export async function verifyPayment(
  signature: string,
  userPublicKey: string,
  expectedAmount: number
): Promise<{ verified: boolean; error?: string }> {
  try {
    console.log('🔍 Verifying payment...', { signature, userPublicKey, expectedAmount });

    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
    const tx = await connection.getTransaction(signature, { 
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0 
    });

    if (!tx) {
      console.error('❌ Transaction not found:', signature);
      return { verified: false, error: 'Transaction not found' };
    }

    // Check transaction age (max 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const blockTime = tx.blockTime;
    if (!blockTime || now - blockTime > 300) {
      console.error('❌ Transaction too old:', blockTime, now);
      return { verified: false, error: 'Transaction too old' };
    }

    // ✅ BALANCE DELTA METHOD - çok daha güvenilir
    const preBalances = tx.meta?.preBalances;
    const postBalances = tx.meta?.postBalances;
    const accountKeys = tx.transaction.message.getAccountKeys();

    if (!preBalances || !postBalances) {
      console.error('❌ No balance data in transaction');
      return { verified: false, error: 'No balance data' };
    }

    let platformWalletIndex = -1;
    for (let i = 0; i < accountKeys.length; i++) {
      const key = accountKeys.get(i)?.toString();
      if (key === PLATFORM_WALLET) {
        platformWalletIndex = i;
        break;
      }
    }

    if (platformWalletIndex === -1) {
      console.error('❌ Platform wallet not found in transaction accounts');
      return { verified: false, error: 'Platform wallet not found' };
    }

    const preBalance = preBalances[platformWalletIndex];
    const postBalance = postBalances[platformWalletIndex];
    const balanceDelta = postBalance - preBalance;

    console.log(`💰 Platform wallet balance change: ${preBalance} → ${postBalance} (delta: ${balanceDelta})`);
    console.log(`📊 Expected: ${EXPECTED_FEE_LAMPORTS} lamports`);

    if (balanceDelta < EXPECTED_FEE_LAMPORTS) {
      console.error('❌ Insufficient payment:', balanceDelta, '<', EXPECTED_FEE_LAMPORTS);
      return { verified: false, error: 'Insufficient payment' };
    }

    // Check for replay attack
    const processed = await redis.get(`tx:${signature}`);
    if (processed) {
      console.error('❌ Transaction already processed:', signature);
      return { verified: false, error: 'Transaction already processed' };
    }

    // Mark as processed
    await redis.set(`tx:${signature}`, 'processed', { ex: 3600 });
    console.log('✅ Payment verified successfully!');

    return { verified: true };
    
  } catch (error: any) {
    console.error('❌ Verification error:', error);
    return { verified: false, error: error.message };
  }
}