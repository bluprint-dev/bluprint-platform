import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';
import { Connection, PublicKey } from '@solana/web3.js';

export async function GET() {
  try {
    const tokenMints = await redis.smembers('bonding-curve:tokens');
    const tokens = [];
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);

    for (const mint of tokenMints) {
      try {
        const mintPubkey = new PublicKey(mint);
        const supply = await connection.getTokenSupply(mintPubkey);
        // metadata için ayrı bir çağrı gerekli (Irys veya token metadata)
        tokens.push({
          mint,
          name: 'Loading...',
          symbol: '???',
          image: '',
          totalSupply: supply.value.uiAmountString || '0',
          virtualSolReserves: '0',
          virtualTokenReserves: '0',
          creatorFeeAccrued: '0',
          isComplete: false,
          createdAt: Date.now(),
        });
      } catch (e) {
        console.error('Error fetching token', mint, e);
      }
    }

    return NextResponse.json({ success: true, tokens });
  } catch (error: any) {
    console.error('Tokens API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}