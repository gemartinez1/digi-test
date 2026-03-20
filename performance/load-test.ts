/**
 * Performance Load Test — Backend Telemetry Ingestion
 *
 * Sends N telemetry events (default 1000) to the backend and reports:
 *   - Total time
 *   - Requests per second
 *   - p50 / p95 / p99 latency
 *   - Success / failure counts
 *
 * Usage:
 *   npx ts-node load-test.ts [--count=1000] [--concurrency=10]
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace('--', '').split('=');
    return [k, v];
  })
);

const TOTAL_REQUESTS = parseInt(args['count'] || '1000', 10);
const CONCURRENCY = parseInt(args['concurrency'] || '10', 10);

const DEVICES = ['sensor-001', 'sensor-002', 'sensor-003', 'sensor-load-01', 'sensor-load-02'];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sendOne(): Promise<{ ok: boolean; latencyMs: number }> {
  const payload = {
    deviceId: DEVICES[randomInt(0, DEVICES.length - 1)],
    temperature: randomInt(-10, 60),
    timestamp: new Date().toISOString(),
  };

  const start = performance.now();
  try {
    const res = await fetch(`${API_URL}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const latencyMs = performance.now() - start;
    return { ok: res.ok, latencyMs };
  } catch {
    return { ok: false, latencyMs: performance.now() - start };
  }
}

async function runBatch(batchSize: number): Promise<{ ok: boolean; latencyMs: number }[]> {
  return Promise.all(Array.from({ length: batchSize }, () => sendOne()));
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function main() {
  console.log(`\n🔥 Load Test: ${TOTAL_REQUESTS} requests | concurrency ${CONCURRENCY}`);
  console.log(`   Target: ${API_URL}/telemetry\n`);

  // Warm-up
  console.log('Warming up...');
  await runBatch(5);

  const results: { ok: boolean; latencyMs: number }[] = [];
  const totalStart = performance.now();

  let completed = 0;
  while (completed < TOTAL_REQUESTS) {
    const batchSize = Math.min(CONCURRENCY, TOTAL_REQUESTS - completed);
    const batchResults = await runBatch(batchSize);
    results.push(...batchResults);
    completed += batchSize;

    if (completed % 100 === 0) {
      process.stdout.write(`  ${completed}/${TOTAL_REQUESTS} sent...\r`);
    }
  }

  const totalMs = performance.now() - totalStart;
  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const successes = results.filter((r) => r.ok).length;
  const failures = results.length - successes;
  const rps = (TOTAL_REQUESTS / (totalMs / 1000)).toFixed(1);

  console.log('\n\n📊 Results\n' + '─'.repeat(40));
  console.log(`  Total requests : ${TOTAL_REQUESTS}`);
  console.log(`  Success        : ${successes} (${((successes / TOTAL_REQUESTS) * 100).toFixed(1)}%)`);
  console.log(`  Failures       : ${failures}`);
  console.log(`  Total time     : ${(totalMs / 1000).toFixed(2)}s`);
  console.log(`  Requests/sec   : ${rps}`);
  console.log(`  Latency p50    : ${percentile(latencies, 50).toFixed(1)}ms`);
  console.log(`  Latency p95    : ${percentile(latencies, 95).toFixed(1)}ms`);
  console.log(`  Latency p99    : ${percentile(latencies, 99).toFixed(1)}ms`);
  console.log(`  Latency max    : ${latencies[latencies.length - 1].toFixed(1)}ms`);

  if (failures > 0) {
    console.log(`\n⚠️  ${failures} request(s) failed — is the backend running?`);
    process.exit(1);
  }
}

void main();
