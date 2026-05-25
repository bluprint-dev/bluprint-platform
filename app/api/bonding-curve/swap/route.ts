import { NextRequest, NextResponse } from 'next/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  genesis,
  findBondingCurveBucketV2Pda,
  fetchBondingCurveBucketV2,
  getSwapResult,
  swapBondingCurveV2,
  isSwappable,
  isSoldOut,
  SwapDirection,
} from '@metaplex-foundation/genesis';
import {
  findAssociatedTokenPda,
  createAssociatedToken,
  syncNative,
} from '@metaplex-foundation/mpl-toolbox';
import { keypairIdentity, publicKey, transactionBuilder } from '@metaplex-foundation/umi';

const WSOL_MINT = publicKey('So11111111111111111111111111111111111111112');

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
    const { genesisAccount, baseMint, amount, isBuy } = await req.json();

    if (!genesisAccount || !baseMint || !amount || isBuy === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const umi = getPlatformUmi();
    const genesisAccountPubkey = publicKey(genesisAccount);
    const baseMintPubkey = publicKey(baseMint);

    const [bucketPda] = findBondingCurveBucketV2Pda(umi, {
      genesisAccount: genesisAccountPubkey,
      bucketIndex: 0,
    });
    const bucket = await fetchBondingCurveBucketV2(umi, bucketPda);

    if (isSoldOut(bucket)) {
      return NextResponse.json({ success: false, error: 'Token sold out' }, { status: 400 });
    }
    if (!isSwappable(bucket)) {
      return NextResponse.json({ success: false, error: 'Curve not swappable' }, { status: 400 });
    }

    const amountIn = BigInt(amount);
    const direction = isBuy ? SwapDirection.Buy : SwapDirection.Sell;
    const quote = getSwapResult(bucket, amountIn, direction);

    const [userBaseTokenAccount] = findAssociatedTokenPda(umi, {
      mint: baseMintPubkey,
      owner: umi.identity.publicKey,
    });
    const [userQuoteTokenAccount] = findAssociatedTokenPda(umi, {
      mint: WSOL_MINT,
      owner: umi.identity.publicKey,
    });

    if (isBuy) {
      const wrapTx = transactionBuilder()
        .add(createAssociatedToken(umi, { mint: WSOL_MINT, owner: umi.identity.publicKey }))
        .add(syncNative(umi, { account: userQuoteTokenAccount }));
      await wrapTx.sendAndConfirm(umi);
    }

    // @ts-ignore – tip uyumsuzluğunu bypass et
    const swapResult = await swapBondingCurveV2(umi, {
      genesisAccount: genesisAccountPubkey,
      bucket: bucketPda,
      baseMint: baseMintPubkey,
      quoteMint: WSOL_MINT,
      baseTokenAccount: userBaseTokenAccount,
      quoteTokenAccount: userQuoteTokenAccount,
      amount: quote.amountIn,
      swapDirection: direction,
    }).sendAndConfirm(umi);

    return NextResponse.json({
      success: true,
      signature: Buffer.from(swapResult.signature).toString('base64'),
      quote: {
        amountIn: quote.amountIn.toString(),
        amountOut: quote.amountOut.toString(),
        fee: quote.fee.toString(),
        creatorFee: quote.creatorFee.toString(),
      },
    });
  } catch (err: any) {
    console.error('Swap error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}