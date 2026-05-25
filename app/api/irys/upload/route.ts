import { NextRequest, NextResponse } from 'next/server';
import Irys from '@irys/sdk';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, symbol, description, imageUrl } = body;

    // Secret key'i düzgün parse et
    const secretKey = process.env.PLATFORM_SECRET_KEY;
    let key;
    try {
      key = JSON.parse(secretKey!);
    } catch {
      key = secretKey;
    }

    // Irys client
    const irys = new Irys({
      network: 'mainnet',
      token: 'solana',
      key: key,
    });

    // Metadata JSON
    const metadata = {
      name,
      symbol,
      description: description || `${name} token on BluPrint`,
      image: imageUrl,
      external_url: 'https://bluprint.fun',
      attributes: [
        { trait_type: 'Launchpad', value: 'BluPrint' },
        { trait_type: 'Bonding Curve', value: 'Metaplex Genesis' },
      ],
      properties: {
        creators: [{ address: process.env.PLATFORM_PUBLIC_KEY, share: 100 }],
      },
    };

    // Irys'a yükle
    const receipt = await irys.upload(JSON.stringify(metadata), {
      tags: [{ name: 'Content-Type', value: 'application/json' }],
    });

    const gatewayUrl = `https://gateway.irys.xyz/${receipt.id}`;

    return NextResponse.json({
      success: true,
      uri: gatewayUrl,
      id: receipt.id,
    });

  } catch (error: any) {
    console.error('Irys upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}