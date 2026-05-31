import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/queue";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ✅ FIX: genesisAccount eklendi
    // mintAddress → metadata/display için saklanır
    // genesisAccount → worker ileride curve işlemi yapacaksa bu gerekir
    const { signature, userPublicKey, mintAddress, genesisAccount } = body;

    if (!signature || !userPublicKey || !mintAddress) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const jobId = signature;

    // 1. DUPLICATE CHECK
    const existing = await redis.get(`job:${jobId}`);

    if (existing) {
      return NextResponse.json({
        success: true,
        state: "ALREADY_EXISTS",
      });
    }

    // 2. QUEUE JOB
    // ✅ FIX: genesisAccount da job payload'ına eklendi
    // swapWorker ileride bonding curve işlemi yapacaksa genesisAccount'u kullanacak
    await redis.lpush(
      "swap-queue",
      JSON.stringify({
        jobId,
        signature,
        userPublicKey,
        mintAddress,      // metadata/display için
        genesisAccount,   // ✅ curve ops için — undefined gelebilir, worker kontrol eder
        createdAt: Date.now(),
      })
    );

    // 3. TTL SET
    await redis.setex(`job:${jobId}`, 3600, "queued");

    return NextResponse.json({
      success: true,
      state: "QUEUED",
      jobId,
    });
  } catch (err: any) {
    console.error("swap execute error:", err);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}