const { redis } = require("../app/lib/redis");
async function main() {
  const mint = "JRkVFy3S5AygpKkLhGvNZrnT5APySVd55hHaGjePLEX";

  const tokenData = {
    mint,
    name: "dogx",
    symbol: "DOGX",
    imageUrl: "https://gateway.irys.xyz/2s7TQJZ3GyBDtPNR9PrMVDARSBQquKBL49tnBgNjoM36",
    creator: "9SPqX1ZLwSuVSTsxX6MuhBzdA115femTHXVQXwqb67x9",
    createdAt: Date.now(),
  };

  await redis.sadd("bonding-curve:tokens", mint);

  await redis.set(
    `token:metadata:${mint}`,
    JSON.stringify(tokenData)
  );

  console.log("DONE ✅");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});