import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { redis } from '@/app/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { signature, userPublicKey, expectedAmount } = await req.json();

    if (!signature || !userPublicKey || !expectedAmount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
    const tx = await connection.getTransaction(signature, { commitment: 'confirmed' });

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify user is the signer
    const signer = tx.transaction.message.getAccountKeys().get(0)?.toString();
    if (signer !== userPublicKey) {
      return NextResponse.json({ error: 'Invalid signer' }, { status: 401 });
    }

    // Check for replay attack
    const processed = await redis.get(`tx:${signature}`);
    if (processed) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 409 });
    }

    // Verify amount - parse instruction data
    let totalTransferred = 0;
    
    for (const instruction of tx.transaction.message.instructions) {
      // Check if it's a system program transfer
      const programId = instruction.programIdIndex !== undefined 
        ? tx.transaction.message.getAccountKeys().get(instruction.programIdIndex)?.toString()
        : null;
      
      if (programId === SystemProgram.programId.toString()) {
        // Transfer instruction data format: 
        // - 4 bytes: instruction discriminator (2 for transfer)
        // - 8 bytes: lamports (little-endian)
        const data = Buffer.from(instruction.data);
        if (data.length >= 12 && data[0] === 2) {
          const lamports = data.readBigUInt64LE(4);
          totalTransferred += Number(lamports);
        }
      }
    }

    const expectedLamports = Math.floor(expectedAmount * 1_000_000_000);
    if (totalTransferred < expectedLamports) {
      return NextResponse.json({ error: 'Insufficient payment' }, { status: 400 });
    }

    // Mark as processed
    await redis.set(`tx:${signature}`, 'processed', { ex: 3600 });

    return NextResponse.json({ success: true, verified: true });
    
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}