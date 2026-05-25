import { NextRequest, NextResponse } from 'next/server';
import { getPlatformUmi } from '@/app/lib/umi';
import { createAndRegisterLaunch } from '@metaplex-foundation/genesis';
import Irys from '@irys/sdk';
import { redis } from '@/app/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const symbol = formData.get('symbol') as string;
    const logoFile = formData.get('logo') as File;
    const userPublicKey = formData.get('userPublicKey') as string;

    if (!name || !symbol || !logoFile || !userPublicKey) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Logo'yu Irys'a yükle
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    const irys = new Irys({
      network: 'mainnet',
      token: 'solana',
      key: process.env.PLATFORM_SECRET_KEY,
    });
    const receipt = await irys.upload(buffer, {
      tags: [{ name: 'Content-Type', value: logoFile.type }],
    });
    const gatewayUrl = `https://gateway.irys.xyz/${receipt.id}`;

    // 2. Umi'yi hazırla
    const umi = getPlatformUmi();

    // 3. Bonding curve token launch - launchType "bondingCurve" (tire yok!)
    // @ts-ignore
    const result = await createAndRegisterLaunch(umi, {}, {
      wallet: userPublicKey,
      launchType: 'bondingCurve',  // ✅ "bonding-curve" değil, "bondingCurve"
      token: {
        name,
        symbol,
        image: gatewayUrl,
      },
      launch: {
        creatorFeeWallet: process.env.PLATFORM_PUBLIC_KEY,
      },
    });

    // 4. Redis'e kaydet
    const mintAddress = result.mintAddress;
    await redis.set(`bonding-curve:creator:${mintAddress}`, userPublicKey);
    await redis.sadd('bonding-curve:tokens', mintAddress);

    return NextResponse.json({
      success: true,
      mintAddress,
      launchLink: result.launch.link,
    });
  } catch (error: any) {
    console.error('Create token error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}