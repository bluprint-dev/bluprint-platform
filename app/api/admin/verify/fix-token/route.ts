import { NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";

export async function GET() {
  try {
    const mint =
      "JRkVFy3S5AygpKkLhGvNZrnT5APySVd55hHaGjePLEX";

    const tokenData = {
      mint,
      name: "dogx",
      symbol: "DOGX",
      imageUrl:
        "https://gateway.irys.xyz/2s7TQJZ3GyBDtPNR9PrMVDARSBQquKBL49tnBgNjoM36",
      creator:
        "9SPqX1ZLwSuVSTsxX6MuhBzdA115femTHXVQXwqb67x9",
      createdAt: Date.now(),
    };

    // dex registry
    await redis.sadd(
      "bonding-curve:tokens",
      mint
    );

    // metadata cache
    await redis.set(
      `token:metadata:${mint}`,
      JSON.stringify(tokenData)
    );

    return NextResponse.json({
      success: true,
      tokenData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}