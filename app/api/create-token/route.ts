import { NextRequest, NextResponse } from 'next/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity } from '@metaplex-foundation/umi';
import { createAndRegisterLaunch } from '@metaplex-foundation/genesis';
import { Keypair } from '@solana/web3.js';
import Irys from '@irys/sdk';
import { redis } from '@/app/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const symbol = formData.get('symbol') as string;
    const file = formData.get('logo') as File;
    const userPublicKey = formData.get('userPublicKey') as string;

    if (!name || !symbol || !file || !userPublicKey) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Logo dosyasını Irys’a yükle
    const buffer = Buffer.from(await file.arrayBuffer());
    const irys = new Irys({
      network: 'mainnet',
      token: 'solana',
      key: process.env.PLATFORM_SECRET_KEY,
    });
    const receipt = await irys.upload(buffer, {
      tags: [{ name: 'Content-Type', value: file.type }],
    });
    const gatewayUrl = `https://gateway.irys.xyz/${receipt.id}`;

    // 2. Platform cüzdanı ile UMI
    const secretKeyArray = JSON.parse(process.env.PLATFORM_SECRET_KEY!);
    const platformKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
    const umi = createUmi(process.env.NEXT_PUBLIC_RPC_URL!);
    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(platformKeypair.secretKey);
    umi.use(keypairIdentity(umiKeypair));

    // 3. Bonding curve token launch
    // @ts-ignore
    const result = await createAndRegisterLaunch(umi, {}, {
      wallet: umi.identity.publicKey,
      launchType: 'bondingCurve',
      token: {
        name,
        symbol,
        image: gatewayUrl,
      },
      launch: {
        creatorFeeWallet: process.env.PLATFORM_PUBLIC_KEY, // fee'ler platform cüzdanına
        // firstBuyAmount: 0.1,  // isteğe bağlı
      },
    });

    // 4. Redis’e token creator bilgisini kaydet (2. adım için)
    const mintAddress = result.mintAddress;
    await redis.set(`bonding-curve:creator:${mintAddress}`, userPublicKey);
    await redis.sadd('bonding-curve:tokens', mintAddress);

    return NextResponse.json({
      success: true,
      mintAddress: result.mintAddress,
      launchLink: result.launch.link,
    });

  } catch (error: any) {
    console.error('Create token error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}