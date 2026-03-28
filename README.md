# IoT Monitoring Platform — Test Automation Demo

A full-stack demo showcasing Senior Test Automation Engineer skills:
**Cypress · TypeScript · IoT event-driven architecture · CI/CD testing · Visual Regression**

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
├── backend/                      # Express + TypeScript API
│   └── src/
│       ├── routes/               # telemetry.ts | devices.ts | alerts.ts
│       ├── services/             # database.ts | alertProcessor.ts | websocket.ts
│       ├── middleware/           # validate.ts
│       ├── types/                # index.ts (shared types)
│       └── __tests__/            # Jest unit tests
│
├── frontend/                     # React + TypeScript (Vite)
│   └── src/
│       ├── api/                  # client.ts (typed fetch wrapper)
│       ├── components/           # DeviceList | AlertList | NavBar
│       ├── hooks/                # useWebSocket.ts
│       ├── pages/                # Login | Dashboard | AlertConfig
│       └── types/                # index.ts
│
├── simulator/                    # Sensor simulator script
│   └── sensor-simulator.ts
│
├── performance/                  # Load test (1000 req benchmark)
│   └── load-test.ts
│
├── cypress/                      # Cypress E2E suite
│   ├── e2e/
│   │   ├── dashboard.cy.ts       # Login + device list tests
│   │   ├── alerts.cy.ts          # Alert lifecycle + API contract tests
│   │   └── visual.cy.ts          # Visual regression tests
│   ├── fixtures/
│   │   ├── telemetry.json        # Normal, breach, and invalid payloads
│   │   ├── devices.json          # Stub data for cy.intercept()
│   │   └── alert-configs.json    # Stub alert configs for visual tests
│   ├── snapshots/                # Baseline PNGs (committed to git)
│   │   └── __diff_output__/      # Diff images on failure (gitignored)
│   └── support/
│       ├── commands.ts           # Custom commands: login, postTelemetry, compareSnapshot, etc.
│       └── e2e.ts
│
├── cypress.config.ts             # Main Cypress config (E2E + regression)
├── cypress.visual.config.js      # Visual regression config (isolated plugin setup)
├── .github/workflows/ci.yml      # GitHub Actions CI pipeline
└── package.json
```

---

## Quick Start

### 1. Install Dependencies

```bash
# Root (Cypress + visual regression tools)
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

| Method | Endpoint                      | Description                      |
|--------|-------------------------------|----------------------------------|
| POST   | `/telemetry`                  | Ingest sensor telemetry data     |
| GET    | `/telemetry`                  | Retrieve recent telemetry log    |
| GET    | `/devices`                    | List all registered devices      |
| GET    | `/devices/:id`                | Get single device                |
| GET    | `/alerts`                     | Get active alerts                |
| POST   | `/alerts/:id/acknowledge`     | Acknowledge an alert             |
| POST   | `/alerts/config`              | Set alert threshold for a device |
| GET    | `/alerts/config`              | List all alert configurations    |
| GET    | `/health`                     | Health check                     |

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

# Smoke tests
npm run cypress:smoke

# Full regression suite
npm run cypress:regression

# All E2E specs
npm run cypress:all
```

### Custom Cypress Commands

```typescript
cy.login()                                       // UI login flow
cy.loginViaSession()                             // Cached session login (faster)
cy.postTelemetry({ deviceId, temperature })      // POST /telemetry via API
cy.setAlertThreshold(deviceId, threshold)        // POST /alerts/config via API
cy.clearAlerts()                                 // Acknowledge all active alerts
cy.getActiveAlerts()                             // GET /alerts via cy.request
cy.compareSnapshot(name, threshold)              // Visual regression snapshot
```

---

## Visual Regression Tests

Uses [cypress-image-diff-js](https://github.com/uktrade/cypress-image-diff) to capture and compare screenshots pixel-by-pixel.

Visual tests run with a **separate config** (`cypress.visual.config.js`) to isolate the plugin from the main Cypress setup.

```bash
# Run visual regression tests (compare against baselines)
npm run cypress:visual

# Regenerate baselines after intentional UI changes
npm run cypress:visual:update
```

### How it works

```
First run   → no baseline → screenshot saved as baseline PNG
Later runs  → screenshot taken → compared pixel-by-pixel to baseline
              diff > 3%? → FAIL → diff image saved to cypress/snapshots/__diff_output__/
              diff ≤ 3%? → PASS
```

The **3% threshold** accounts for sub-pixel font rendering differences across machines and OS versions.

### What is visually tested

| Snapshot                 | What it catches                          |
|--------------------------|------------------------------------------|
| `login-page`             | Layout shift, missing elements           |
| `login-page-error`       | Error state styling regression           |
| `dashboard-no-alerts`    | Full dashboard layout                    |
| `stats-bar`              | Stats bar rendering                      |
| `device-list`            | Device card grid layout                  |
| `dashboard-with-alerts`  | Alert badge and alert list appearance    |
| `alert-list-item`        | Alert card styling                       |
| `device-card-online`     | Green status color coding                |
| `device-card-critical`   | Red status color coding                  |
| `device-card-warning`    | Amber status color coding                |
| `alert-config-page`      | Form and table layout                    |
| `alert-config-table`     | Config table rows                        |

### Updating baselines

After an intentional UI change, regenerate the baselines and commit the new PNGs:

```bash
npm run cypress:visual:update
git add cypress/snapshots/
git commit -m "chore: update visual regression baselines"
```

Diff images in `cypress/snapshots/__diff_output__/` are gitignored — they are uploaded as CI artifacts only on failure.

---

## Performance Load Test

```bash
cd performance && npm install

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
    ├── lint               (backend ESLint + frontend ESLint)
    │
    ├── backend-tests      (Jest unit tests + coverage upload)
    │
    ├── cypress-smoke      (dashboard.cy.ts + alerts.cy.ts)
    │
    ├── cypress-visual     (visual.cy.ts via cypress.visual.config.js)
    │                       uploads diff images as artifact on failure
    │
    └── cypress-regression (dashboard.cy.ts + alerts.cy.ts, 2× parallel shards)
```

See `.github/workflows/ci.yml` for the full pipeline definition.

### Notes on Cypress config split

The main `cypress.config.ts` handles all E2E and regression specs.
`cypress.visual.config.js` is a plain CommonJS file used exclusively for visual tests — this isolates the `cypress-image-diff-js` plugin, which requires CJS `require()` to load correctly and must receive both `on` and `config` in `setupNodeEvents`.

---

## Login Credentials (Demo)

| Username  | Password  |
|-----------|-----------|
| admin     | admin123  |
| engineer  | test1234  |

---

## WebSocket Live Updates

The dashboard connects to `ws://localhost:3001/ws` and receives:

| Event            | Payload | Description                      |
|------------------|---------|----------------------------------|
| `device_updated` | Device  | Fired on every telemetry receive |
| `alert_created`  | Alert   | Fired when threshold is breached |
| `connected`      | —       | Sent on WS handshake             |

---

## Key Testing Patterns Demonstrated

- **`cy.intercept()`** — Stub API responses to isolate UI tests from backend state
- **`cy.request()`** — API contract testing without the UI
- **`cy.wait()`** — Wait for intercepted network requests to complete
- **`cy.session()`** — Cache login state across tests for speed
- **`cy.compareSnapshot()`** — Pixel-by-pixel visual regression with diff output
- **Custom Commands** — Reusable `login`, `postTelemetry`, `clearAlerts`, `compareSnapshot`
- **Fixtures** — Centralized deterministic test data for both E2E and visual tests
- **Separate Cypress configs** — Isolate plugin concerns between E2E and visual suites
- **Parallel execution** — Matrix strategy in GitHub Actions for regression sharding
- **API + UI testing** — Both layers covered in the same suite
