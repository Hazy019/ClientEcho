/**
 * ClientEcho Free-Tier Connection Pool & Concurrency Load Test Script
 * 
 * Simulates concurrent bursts of HTTP requests against the application
 * to verify database connection pooler performance (PgBouncer port 6543)
 * without exceeding connection limits or causing unhandled server crashes.
 * 
 * Usage:
 *   node scripts/load-test.js [targetUrl] [concurrency] [totalRequests]
 * Example:
 *   node scripts/load-test.js http://localhost:3000 20 100
 */

const targetUrl = process.argv[2] || "http://localhost:3000";
const concurrency = parseInt(process.argv[3] || "15", 10);
const totalRequests = parseInt(process.argv[4] || "60", 10);

console.log("==================================================");
console.log("🚀 ClientEcho Connection Pool & Concurrency Load Test");
console.log(`Target URL:     ${targetUrl}`);
console.log(`Concurrency:    ${concurrency} concurrent workers`);
console.log(`Total Requests: ${totalRequests}`);
console.log("==================================================\n");

let completedRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
const latencies = [];

async function sendRequest(id) {
  const url = `${targetUrl}/api/health`;
  const start = Date.now();

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ClientEcho-LoadTest/1.0" },
    });
    const latency = Date.now() - start;
    latencies.push(latency);
    completedRequests++;

    if (res.ok) {
      successfulRequests++;
      process.stdout.write(`\r[${completedRequests}/${totalRequests}] OK: ${res.status} (${latency}ms)`);
    } else {
      failedRequests++;
      process.stdout.write(`\r[${completedRequests}/${totalRequests}] FAIL: ${res.status} (${latency}ms)`);
    }
  } catch (err) {
    const latency = Date.now() - start;
    latencies.push(latency);
    completedRequests++;
    failedRequests++;
    process.stdout.write(`\r[${completedRequests}/${totalRequests}] ERR: ${err.message} (${latency}ms)`);
  }
}

async function runLoadTest() {
  const overallStart = Date.now();
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < totalRequests) {
      const id = ++currentIndex;
      await sendRequest(id);
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalDuration = (Date.now() - overallStart) / 1000;
  const avgLatency = latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1) : 0;
  const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
  const rps = (completedRequests / totalDuration).toFixed(1);

  console.log("\n\n==================================================");
  console.log("📊 Load Test Summary Results");
  console.log("==================================================");
  console.log(`Total Requests:      ${completedRequests}`);
  console.log(`Success Count (2xx): ${successfulRequests}`);
  console.log(`Failure Count:       ${failedRequests}`);
  console.log(`Total Duration:      ${totalDuration.toFixed(2)}s`);
  console.log(`Throughput:          ${rps} req/sec`);
  console.log(`Latency (Min/Avg/Max): ${minLatency}ms / ${avgLatency}ms / ${maxLatency}ms`);
  console.log("==================================================");

  if (failedRequests === 0) {
    console.log("✅ PASSED: All requests succeeded without connection pool exhaustion.");
  } else {
    console.log("⚠️ WARNING: Some requests encountered errors. Check server logs.");
  }
}

runLoadTest();
