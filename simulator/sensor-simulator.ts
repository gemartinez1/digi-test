/**
 * IoT Sensor Simulator
 *
 * Simulates three sensors sending telemetry to the backend at regular intervals.
 * Pass --spike flag to inject a temperature spike every 30s to trigger alerts.
 *
 * Usage:
 *   npx ts-node sensor-simulator.ts
 *   npx ts-node sensor-simulator.ts --spike
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '3000', 10);
const SPIKE_MODE = process.argv.includes('--spike');

interface SensorConfig {
  id: string;
  name: string;
  baseTemp: number;
  variance: number;
  unit: string;
}

const SENSORS: SensorConfig[] = [
  { id: 'sensor-001', name: 'Fridge Sensor A',     baseTemp: 4,  variance: 3,  unit: 'Kitchen' },
  { id: 'sensor-002', name: 'Warehouse Sensor',    baseTemp: 22, variance: 8,  unit: 'Warehouse' },
  { id: 'sensor-003', name: 'Server Room Monitor', baseTemp: 21, variance: 4,  unit: 'Data Center' },
];

let tick = 0;

function randomTemp(base: number, variance: number): number {
  const noise = (Math.random() - 0.5) * 2 * variance;
  return parseFloat((base + noise).toFixed(1));
}

function spikeTemp(sensor: SensorConfig): number {
  // Spike to well above typical thresholds
  return parseFloat((sensor.baseTemp + sensor.variance * 5 + Math.random() * 10).toFixed(1));
}

async function sendTelemetry(sensor: SensorConfig, temp: number): Promise<void> {
  const payload = {
    deviceId: sensor.id,
    temperature: temp,
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${API_URL}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as { alertTriggered?: boolean };
    const alert = data.alertTriggered ? ' 🚨 ALERT TRIGGERED' : '';
    console.log(`[${new Date().toLocaleTimeString()}] ${sensor.name}: ${temp}°C${alert}`);
  } catch (err) {
    console.error(`[ERROR] Failed to send telemetry for ${sensor.id}:`, (err as Error).message);
  }
}

async function runSimulationCycle(): Promise<void> {
  tick++;
  const isSpikeTick = SPIKE_MODE && tick % 10 === 0; // spike every ~30s at 3snr interval

  if (isSpikeTick) {
    console.log('\n⚡  INJECTING TEMPERATURE SPIKE...\n');
  }

  await Promise.all(
    SENSORS.map((sensor) => {
      const temp = isSpikeTick ? spikeTemp(sensor) : randomTemp(sensor.baseTemp, sensor.variance);
      return sendTelemetry(sensor, temp);
    })
  );
}

console.log(`\n🌡️  IoT Sensor Simulator starting`);
console.log(`   API: ${API_URL}`);
console.log(`   Interval: ${INTERVAL_MS}ms`);
console.log(`   Spike mode: ${SPIKE_MODE ? 'ON' : 'OFF'}`);
console.log(`   Sensors: ${SENSORS.map((s) => s.id).join(', ')}\n`);

void runSimulationCycle();
setInterval(() => void runSimulationCycle(), INTERVAL_MS);
