import { NextRequest, NextResponse } from 'next/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  genesis,
  findBondingCurveBucketV2Pda,
  fetchBondingCurveBucketV2,
  claimBondingCurveCreatorFeeV2,
  isGraduated,
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
    const { genesisAccount } = await req.json();
    if (!genesisAccount) {
      return NextResponse.json({ success: false, error: 'genesisAccount required' }, { status: 400 });
    }

    const umi = getPlatformUmi();
    const genesisAccountPubkey = publicKey(genesisAccount);

    const [bucketPda] = findBondingCurveBucketV2Pda(umi, {
      genesisAccount: genesisAccountPubkey,
      bucketIndex: 0,
    });

    const bucket = await fetchBondingCurveBucketV2(umi, bucketPda);
    if (Number(bucket.creatorFeeAccrued) === 0) {
      return NextResponse.json({ success: false, error: 'No fees to claim' }, { status: 400 });
    }

    const graduated = await isGraduated(umi, bucket);
    if (graduated) {
      return NextResponse.json({ success: false, error: 'Token graduated, use Raydium claim' }, { status: 400 });
    }

    const baseMint = (bucket as any).baseMint;
    const creatorFeeWallet = (bucket as any).creatorFeeWallet;
    if (!baseMint || !creatorFeeWallet) {
      return NextResponse.json({ success: false, error: 'Missing baseMint or creatorFeeWallet' }, { status: 500 });
    }

    const result = await claimBondingCurveCreatorFeeV2(umi, {
      genesisAccount: genesisAccountPubkey,
      bucket: bucketPda,
      baseMint,
      creatorFeeWallet,
    }).sendAndConfirm(umi);

    return NextResponse.json({
      success: true,
      signature: Buffer.from(result.signature).toString('base64'),
      claimedAmount: bucket.creatorFeeAccrued.toString(),
    });
  } catch (err: any) {
    console.error('Claim error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}