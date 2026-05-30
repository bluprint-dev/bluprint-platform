import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

const CODE_LENGTH = 7;

function generateCode(): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';

  let code = '';

  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[
      Math.floor(Math.random() * chars.length)
    ];
  }

  return code;
}

async function generateUniqueCode(): Promise<string> {
  while (true) {
    const code = generateCode();

    const exists = await redis.exists(
      `ref:code:${code}`
    );

    if (!exists) {
      return code;
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const wallet =
      searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet required',
        },
        { status: 400 }
      );
    }

    // wallet -> code
    const existingCode =
      await redis.get(
        `ref:user:${wallet}`
      );

    return NextResponse.json({
      success: true,
      hasCode: !!existingCode,
      code: existingCode || null,
    });
  } catch (error: any) {
    console.error(
      'GET_PROMOCODE_ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const wallet =
      body.walletAddress;

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet required',
        },
        { status: 400 }
      );
    }

    // =========================
    // EXISTING CODE CHECK
    // =========================

    const existingCode =
      await redis.get(
        `ref:user:${wallet}`
      );

    if (existingCode) {
      return NextResponse.json({
        success: true,
        code: existingCode,
        isNew: false,
      });
    }

    // =========================
    // GENERATE UNIQUE CODE
    // =========================

    const newCode =
      await generateUniqueCode();

    // =========================
    // SAVE MAPPINGS
    // =========================

    // wallet -> code
    await redis.set(
      `ref:user:${wallet}`,
      newCode
    );

    // code -> wallet
    await redis.set(
      `ref:code:${newCode}`,
      wallet
    );

    // optional metadata
    await redis.set(
      `ref:meta:${wallet}`,
      JSON.stringify({
        code: newCode,
        createdAt: Date.now(),
      })
    );

    console.log(
      'PROMOCODE_CREATED:',
      wallet,
      newCode
    );

    return NextResponse.json({
      success: true,
      code: newCode,
      isNew: true,
    });
  } catch (error: any) {
    console.error(
      'CREATE_PROMOCODE_ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          'Internal server error',
      },
      { status: 500 }
    );
  }
}