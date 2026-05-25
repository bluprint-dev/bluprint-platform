import { NextRequest, NextResponse } from 'next/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  genesis,
  createAndRegisterLaunch,
  CreateLaunchInput,
  isGenesisApiError,
  isGenesisApiNetworkError,
  isGenesisValidationError,
} from '@metaplex-foundation/genesis';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';

function getPlatformUmi() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) throw new Error('NEXT_PUBLIC_RPC_URL not configured');

  const secretKeyRaw = process.env.PLATFORM_SECRET_KEY;
  if (!secretKeyRaw) throw new Error('PLATFORM_SECRET_KEY not configured');

  const umi = createUmi(rpcUrl).use(genesis());
  const secretKey = Uint8Array.from(JSON.parse(secretKeyRaw));
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  umi.use(keypairIdentity(keypair));
  return umi;
}

export async function POST(req: NextRequest) {
  try {
    const { name, symbol, image, description, twitter, telegram, website } = await req.json();

    if (!name || !symbol || !image) {
      return NextResponse.json(
        { success: false, error: 'name, symbol, image are required' },
        { status: 400 }
      );
    }

    const umi = getPlatformUmi();

    const input: CreateLaunchInput = {
      wallet: umi.identity.publicKey,
      token: {
        name,
        symbol,
        image, // Irys gateway URL: https://gateway.irys.xyz/<id>
        description: description || '',
        externalLinks: {
          website: website || undefined,
          twitter: twitter || undefined,
          telegram: telegram || undefined,
        },
      },
      launchType: 'launchpool',
      launch: {
        launchpool: {
          tokenAllocation: 500_000_000,
          depositStartTime: new Date(Date.now() + 5 * 60 * 1000), // 5 dakika sonra
          raiseGoal: 250, // minimum 250 SOL
          raydiumLiquidityBps: 5000, // %50 Raydium LP
          fundsRecipient: umi.identity.publicKey,
        },
      },
    };

    const result = await createAndRegisterLaunch(umi, {}, input);

    return NextResponse.json({
      success: true,
      mintAddress: result.mintAddress,
      genesisAccount: result.genesisAccount,
      launchId: result.launch.id,
      launchLink: result.launch.link,
      signatures: result.signatures.map((s) =>
        Buffer.from(s).toString('base64')
      ),
    });
  } catch (err: any) {
    if (isGenesisValidationError(err)) {
      return NextResponse.json(
        { success: false, error: `Validation error on field "${err.field}": ${err.message}` },
        { status: 400 }
      );
    }
    if (isGenesisApiError(err)) {
      return NextResponse.json(
        { success: false, error: `API error ${err.statusCode}`, details: err.responseBody },
        { status: 502 }
      );
    }
    if (isGenesisApiNetworkError(err)) {
      return NextResponse.json(
        { success: false, error: `Network error: ${err.cause.message}` },
        { status: 503 }
      );
    }
    console.error('Launch error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}