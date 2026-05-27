import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { redis } from './redis';

const VALID_RECIPIENTS = [
  'aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x',
  '2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc',
  'A692UafMRPEofwLsnD1NjWF9usiePRTJAd4Cpz8m6Y5X',
];

// 0.01 SOL = 10,000,000 lamports
// %58 = 5,800,000 lamports
// %32 = 3,200,000 lamports
// %10 = 1,000,000 lamports
const EXPECTED_AMOUNTS: Record<string, number> = {
  'aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x': 5800000,
  '2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc': 3200000,
  'A692UafMRPEofwLsnD1NjWF9usiePRTJAd4Cpz8m6Y5X': 1000000,
};

export async function verifyPayment(
  signature: string,
  userPublicKey: string,
  expectedAmount: number
): Promise<{ verified: boolean; error?: string }> {
  try {
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
    const tx = await connection.getTransaction(signature, { commitment: 'finalized' });

    if (!tx) {
      return { verified: false, error: 'Transaction not found' };
    }

    // Check transaction age (max 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const blockTime = tx.blockTime;
    if (!blockTime || now - blockTime > 300) {
      return { verified: false, error: 'Transaction too old' };
    }

    // Verify user is the signer
    const signer = tx.transaction.message.getAccountKeys().get(0)?.toString();
    if (signer !== userPublicKey) {
      return { verified: false, error: 'Invalid signer' };
    }

    // Check replay attack
    const processed = await redis.get(`tx:${signature}`);
    if (processed) {
      return { verified: false, error: 'Transaction already processed' };
    }

    // Debug log
    console.log('Verifying transaction:', signature);
    console.log('Signer:', signer);
    console.log('Expected amounts:', EXPECTED_AMOUNTS);

    // Verify exact amounts to specific recipients
    let verifiedCount = 0;
    const accountKeys = tx.transaction.message.getAccountKeys();
    const programIdSystem = SystemProgram.programId.toString();

    for (const instruction of tx.transaction.message.instructions) {
      const programId = accountKeys.get(instruction.programIdIndex)?.toString();
      
      if (programId === programIdSystem) {
        const data = Buffer.from(instruction.data);
        
        // SystemProgram.transfer instruction discriminator is 2
        if (data.length >= 9 && data[0] === 2) {
          const toPubkey = accountKeys.get(instruction.accounts[1])?.toString();
          const lamports = Number(data.readBigUInt64LE(1));
          
          console.log(`Found transfer: to=${toPubkey}, lamports=${lamports}`);
          
          if (toPubkey && EXPECTED_AMOUNTS[toPubkey] === lamports) {
            verifiedCount++;
          }
        }
      }
    }

    console.log(`Verified transfers: ${verifiedCount}/3`);

    if (verifiedCount < 3) {
      return { verified: false, error: 'Invalid payment amounts or recipients' };
    }

    // Mark as processed
    await redis.set(`tx:${signature}`, 'processed', { ex: 3600 });

    return { verified: true };
    
  } catch (error: any) {
    console.error('Verification error:', error);
    return { verified: false, error: error.message };
  }
}