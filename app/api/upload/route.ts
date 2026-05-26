import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const secretKeyArray = JSON.parse(process.env.PLATFORM_SECRET_KEY!);
    
    const Irys = require('@irys/sdk');
    const irys = new Irys({
      network: 'devnet',
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