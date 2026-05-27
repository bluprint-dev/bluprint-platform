import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { redis } from './redis';

const VALID_RECIPIENTS = [
  'aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x',
  '2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc',
  'A692UafMRPEofwLsnD1NjWF9usiePRTJAd4Cpz8m6Y5X',
];

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

    // Check for replay attack
    const processed = await redis.get(`tx:${signature}`);
    if (processed) {
      return { verified: false, error: 'Transaction already processed' };
    }

    // Verify amount AND recipient
    let totalTransferred = 0;
    const accountKeys = tx.transaction.message.getAccountKeys();
    const programIdSystem = SystemProgram.programId.toString();
    
    for (const instruction of tx.transaction.message.instructions) {
      // Get program ID
      const programIdIndex = instruction.programIdIndex;
      const programId = accountKeys.get(programIdIndex)?.toString();
      
      if (programId === programIdSystem) {
        // This is a System Program instruction
        // Transfer instruction data format: 
        // - first byte: instruction type (2 for transfer)
        // - next 8 bytes: lamports (little-endian)
        const data = Buffer.from(instruction.data);
        
        if (data.length >= 9 && data[0] === 2) {
          // Get recipient (accounts[1] is the destination)
          const toPubkeyIndex = instruction.accounts[1];
          const toPubkey = accountKeys.get(toPubkeyIndex)?.toString();
          
          if (toPubkey && VALID_RECIPIENTS.includes(toPubkey)) {
            const lamports = data.readBigUInt64LE(1);
            totalTransferred += Number(lamports);
          }
        }
      }
    }

    const expectedLamports = Math.floor(expectedAmount * 1_000_000_000);
    if (totalTransferred < expectedLamports) {
      return { verified: false, error: 'Insufficient payment to valid recipients' };
    }

    // Mark as processed
    await redis.set(`tx:${signature}`, 'processed', { ex: 3600 });

    return { verified: true };
    
  } catch (error: any) {
    console.error('Verification error:', error);
    return { verified: false, error: error.message };
  }
}