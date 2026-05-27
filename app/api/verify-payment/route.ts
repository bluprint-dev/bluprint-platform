import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/app/lib/verify-payment';

export async function POST(req: NextRequest) {
  try {
    const { signature, userPublicKey, expectedAmount } = await req.json();

    if (!signature || !userPublicKey) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // ✅ expectedAmount artık kullanılmıyor (verify-payment içinde sabit)
    const result = await verifyPayment(signature, userPublicKey);
    
    if (!result.verified) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, verified: true });
    
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}