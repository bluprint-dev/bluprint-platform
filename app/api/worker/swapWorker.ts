import { redis } from "@/app/lib/queue";

const QUEUE_KEY = "swap-queue";

async function processJob(job: any) {
  try {
    console.log("⚙️ Processing job:", job.jobId);

    // 🔵 burada ileride:
    // - tx verify
    // - bonding curve swap
    // - confirmation tracking

    await redis.setex(
      `job:${job.jobId}:status`,
      3600,
      "completed"
    );

    console.log("✅ Job completed:", job.jobId);
  } catch (err) {
    console.error("❌ Job failed:", job.jobId, err);

    await redis.setex(
      `job:${job.jobId}:status`,
      3600,
      "failed"
    );
  }
}

export async function startWorker() {
  console.log("🚀 Swap worker started");

  while (true) {
    try {
      const jobRaw = await redis.rpop(QUEUE_KEY);

      if (!jobRaw) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      const job = JSON.parse(jobRaw);

      await processJob(job);
    } catch (err) {
      console.error("⚠️ Worker loop error:", err);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

// Eğer direkt run edilirse
startWorker();