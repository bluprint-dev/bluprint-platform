import { NextRequest, NextResponse } from 'next/server';
import Irys from '@irys/sdk';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Rate limit kontrolü (IP bazlı)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    // TODO: Rate limit implementasyonu

    const buffer = Buffer.from(await file.arrayBuffer());
    const secretKeyArray = JSON.parse(process.env.PLATFORM_SECRET_KEY!);
    
    const irys = new Irys({
      network: 'mainnet',
      token: 'solana',
      key: secretKeyArray,
    });
    
    const receipt = await irys.upload(buffer, {
      tags: [{ name: 'Content-Type', value: file.type }],
    });
    
    const imageUrl = `https://gateway.irys.xyz/${receipt.id}`;
    
    return NextResponse.json({
      success: true,
      imageUrl,
      id: receipt.id,
    });
    
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}