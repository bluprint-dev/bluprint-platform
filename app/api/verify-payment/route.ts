import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/app/lib/verify-payment';

const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'your-internal-secret-change-me';

export async function POST(req: NextRequest) {
  try {
    // Internal security check
    const internalKey = req.headers.get('x-internal-secret');
    if (internalKey !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { signature, userPublicKey, expectedAmount } = await req.json();

    if (!signature || !userPublicKey || !expectedAmount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const result = await verifyPayment(signature, userPublicKey, expectedAmount);
    
    if (!result.verified) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, verified: true });
    
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}