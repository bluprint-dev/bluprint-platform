import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/queue";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { signature, userPublicKey, mintAddress } = body;

    if (!signature || !userPublicKey || !mintAddress) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const jobId = signature;

    // 🔴 1. DUPLICATE CHECK (safe)
    const existing = await redis.get(`job:${jobId}`);

    if (existing) {
      return NextResponse.json({
        success: true,
        state: "ALREADY_EXISTS",
      });
    }

    // 🔵 2. QUEUE JOB
    await redis.lpush(
      "swap-queue",
      JSON.stringify({
        jobId,
        signature,
        userPublicKey,
        mintAddress,
        createdAt: Date.now(),
      })
    );

    // 🔴 3. TTL SET (FIXED ioredis version issue)
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