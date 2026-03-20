# IoT Monitoring Platform — Test Automation Demo

A full-stack demo showcasing Senior Test Automation Engineer skills:
**Cypress · TypeScript · IoT event-driven architecture · CI/CD testing**

---

## Architecture

```
sensor simulator
      │
      ▼  POST /telemetry
  Backend API  ──► Alert Processor ──► In-Memory DB
  (Express/TS)                              │
      │                                     │
      ▼ WebSocket push                      ▼
  Frontend Dashboard (React/TS) ◄─── GET /devices & /alerts
```

---

## Project Structure

```
iot-monitoring-demo/
├── backend/                  # Express + TypeScript API
│   └── src/
│       ├── routes/           # telemetry.ts | devices.ts | alerts.ts
│       ├── services/         # database.ts | alertProcessor.ts | websocket.ts
│       ├── middleware/       # validate.ts
│       ├── types/            # index.ts (shared types)
│       └── __tests__/        # Jest unit tests
│
├── frontend/                 # React + TypeScript (Vite)
│   └── src/
│       ├── api/              # client.ts (typed fetch wrapper)
│       ├── components/       # DeviceList | AlertList | NavBar
│       ├── hooks/            # useWebSocket.ts
│       ├── pages/            # Login | Dashboard | AlertConfig
│       └── types/            # index.ts
│
├── simulator/                # Sensor simulator script
│   └── sensor-simulator.ts
│
├── performance/              # Load test (1000 req benchmark)
│   └── load-test.ts
│
├── cypress/                  # Cypress E2E suite
│   ├── e2e/
│   │   ├── dashboard.cy.ts   # Login + device list tests
│   │   └── alerts.cy.ts      # Alert lifecycle + API contract tests
│   ├── fixtures/
│   │   ├── telemetry.json    # Normal, breach, and invalid payloads
│   │   └── devices.json      # Stub data for cy.intercept()
│   └── support/
│       ├── commands.ts       # Custom commands: login, postTelemetry, etc.
│       └── e2e.ts
│
├── cypress.config.ts
├── .github/workflows/ci.yml  # GitHub Actions CI pipeline
└── package.json
```

---

## Quick Start

### 1. Install Dependencies

```bash
# Root (Cypress)
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install

# Simulator
cd simulator && npm install

# Performance tests
cd performance && npm install
```

Or run all at once from root:
```bash
npm run install:all
```

### 2. Start the Backend

```bash
cd backend
npm run dev
# API running at http://localhost:3001
# WebSocket at ws://localhost:3001/ws
```

### 3. Start the Frontend

```bash
cd frontend
npm run dev
# Dashboard at http://localhost:5173
```

### 4. Run the Sensor Simulator

```bash
# Normal mode — randomized temperatures every 3s
cd simulator && npm start

# Spike mode — injects high temperature every 30s to trigger alerts
cd simulator && npm run start:spike
```

---

## API Reference

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| POST   | `/telemetry`          | Ingest sensor telemetry data       |
| GET    | `/telemetry`          | Retrieve recent telemetry log      |
| GET    | `/devices`            | List all registered devices        |
| GET    | `/devices/:id`        | Get single device                  |
| GET    | `/alerts`             | Get active alerts                  |
| POST   | `/alerts/:id/acknowledge` | Acknowledge an alert           |
| POST   | `/alerts/config`      | Set alert threshold for a device   |
| GET    | `/alerts/config`      | List all alert configurations      |
| GET    | `/health`             | Health check                       |

### Example: POST /telemetry

```bash
curl -X POST http://localhost:3001/telemetry \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"sensor-001","temperature":42,"timestamp":"2026-01-01T12:00:00Z"}'
```

### Example: POST /alerts/config

```bash
curl -X POST http://localhost:3001/alerts/config \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"sensor-001","temperatureThreshold":35}'
```

---

## Backend Tests

```bash
cd backend
npm test              # All tests with coverage
npm run test:unit     # Unit tests only
```

---

## Cypress E2E Tests

```bash
# Interactive mode (Cypress UI)
npm run cypress:open

# Headless smoke tests only
npm run cypress:smoke

# Full regression suite
npm run cypress:regression

# Run all specs
npm run cypress:all
```

### Test Tags

| Tag          | Description                              |
|--------------|------------------------------------------|
| `@smoke`     | Core happy-path tests — run on every PR  |
| `@regression`| Full coverage — run pre-release          |

### Custom Cypress Commands

```typescript
cy.login()                        // UI login flow
cy.loginViaSession()              // Cached session login (faster)
cy.postTelemetry({ deviceId, temperature })   // API shortcut
cy.setAlertThreshold(deviceId, threshold)     // API shortcut
cy.clearAlerts()                  // Acknowledge all active alerts
cy.getActiveAlerts()              // GET /alerts via cy.request
```

---

## Performance Load Test

```bash
cd performance

# Default: 1000 requests, concurrency 10
npm test

# Light: 100 requests
npm run test:light

# Heavy: 5000 requests, concurrency 50
npm run test:heavy

# Custom
npx ts-node load-test.ts --count=2000 --concurrency=20
```

Sample output:
```
📊 Results
────────────────────────────────────────
  Total requests : 1000
  Success        : 1000 (100.0%)
  Failures       : 0
  Total time     : 4.21s
  Requests/sec   : 237.5
  Latency p50    : 38.2ms
  Latency p95    : 74.6ms
  Latency p99    : 112.3ms
  Latency max    : 198.4ms
```

---

## CI/CD Pipeline (GitHub Actions)

```
Push / PR
    │
    ├── lint          (backend ESLint + frontend ESLint)
    │
    ├── backend-tests (Jest unit tests + coverage upload)
    │
    ├── cypress-smoke (Smoke tests @smoke tag)
    │
    └── cypress-regression (2× parallel shards @regression tag)
```

See `.github/workflows/ci.yml` for the full pipeline definition.

---

## Login Credentials (Demo)

| Username  | Password  |
|-----------|-----------|
| admin     | admin123  |
| engineer  | test1234  |

---

## WebSocket Live Updates

The dashboard connects to `ws://localhost:3001/ws` and receives:

| Event              | Payload | Description                       |
|--------------------|---------|-----------------------------------|
| `device_updated`   | Device  | Fired on every telemetry receive  |
| `alert_created`    | Alert   | Fired when threshold is breached  |
| `connected`        | —       | Sent on WS handshake              |

---

## Key Testing Patterns Demonstrated

- **`cy.intercept()`** — Stub API responses to isolate UI tests
- **`cy.request()`** — API contract testing without the UI
- **`cy.wait()`** — Wait for intercepted network requests to complete
- **`cy.session()`** — Cache login state between tests for speed
- **Custom Commands** — Reusable `login`, `postTelemetry`, `clearAlerts`
- **Fixtures** — Centralized test data (`telemetry.json`, `devices.json`)
- **Smoke vs Regression** — Tag-based test filtering for CI efficiency
- **Parallel execution** — Matrix strategy in GitHub Actions
- **API + UI testing** — Both layers covered in the same suite
