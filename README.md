# IoT Monitoring Platform — Test Automation Demo

A full-stack demo showcasing Senior Test Automation Engineer skills:
**Cypress · TypeScript · GraphQL · IoT event-driven architecture · CI/CD testing · Visual Regression**

---

## Architecture

```
sensor simulator
      │
      ▼  GraphQL mutation (postTelemetry)
  Backend API  ──► Alert Processor ──► In-Memory DB
  (Express +                                │
  Apollo Server)                            │
      │                                     │
      ▼ WebSocket push                      ▼
  Frontend Dashboard ◄──── GraphQL queries (Apollo Client)
     (React/TS)              devices | alerts | alertConfigs
```

---

## Project Structure

```
iot-monitoring-demo/
├── backend/                      # Express + Apollo Server (GraphQL)
│   └── src/
│       ├── graphql/              # schema.ts | resolvers.ts
│       ├── services/             # database.ts | alertProcessor.ts | websocket.ts
│       ├── types/                # index.ts (shared types)
│       └── __tests__/            # Jest unit tests
│
├── frontend/                     # React + TypeScript (Vite)
│   └── src/
│       ├── api/                  # client.ts (Apollo Client setup)
│       ├── graphql/              # queries.ts (GET_DEVICES, GET_ALERTS, mutations)
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
│   │   ├── alerts.cy.ts          # Alert lifecycle + GraphQL contract tests
│   │   └── visual.cy.ts          # Visual regression tests
│   ├── fixtures/
│   │   ├── telemetry.json        # Normal, breach, and invalid payloads
│   │   ├── devices.json          # Stub data for cy.intercept()
│   │   └── alert-configs.json    # Stub alert configs for visual tests
│   ├── snapshots/                # Baseline PNGs (committed to git)
│   │   └── __diff_output__/      # Diff images on failure (gitignored)
│   └── support/
│       ├── commands.ts           # Custom commands: login, postTelemetry, clearAlerts, etc.
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
# Install all workspaces at once
npm run install:all

# Or individually:
npm install                        # Root (Cypress + tooling)
cd backend && npm install
cd frontend && npm install
cd simulator && npm install
cd performance && npm install
```

### 2. Start the Backend

```bash
cd backend
npm run dev
# GraphQL API at http://localhost:3001/graphql
# WebSocket  at ws://localhost:3001/ws
# Health     at http://localhost:3001/health
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

## GraphQL API

All data access goes through a single endpoint: `POST http://localhost:3001/graphql`

### Queries

```graphql
# List all registered devices
query { devices { id name location type lastSeen lastTemperature status } }

# Get single device
query { device(id: "sensor-001") { id name status lastTemperature } }

# Get active alerts (pass includeAll: true to include acknowledged)
query { alerts { id deviceId deviceName type message temperature threshold timestamp acknowledged } }

# Get alert config for a device
query { alertConfig(deviceId: "sensor-001") { temperatureThreshold minTemperatureThreshold enabled } }

# List all alert configs
query { alertConfigs { deviceId temperatureThreshold minTemperatureThreshold enabled } }

# Recent telemetry log
query { telemetryLog { deviceId temperature timestamp } }
```

### Mutations

```graphql
# Ingest sensor telemetry
mutation {
  postTelemetry(deviceId: "sensor-001", temperature: 42, timestamp: "2026-01-01T12:00:00Z") {
    success alertTriggered alert { id message }
  }
}

# Set alert threshold for a device
mutation {
  setAlertConfig(deviceId: "sensor-001", temperatureThreshold: 35, minTemperatureThreshold: -2, enabled: true) {
    success config { deviceId temperatureThreshold }
  }
}

# Acknowledge an alert
mutation {
  acknowledgeAlert(id: "alert-id-here") { success message }
}
```

### Example: curl

```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { postTelemetry(deviceId: \"sensor-001\", temperature: 42) { success alertTriggered } }"}'
```

---

## Backend Tests

```bash
cd backend
npm test              # All tests with coverage
npm run test:unit     # Unit tests only

# Or from root:
npm run test:backend
```

---

## Cypress E2E Tests

```bash
# Interactive mode (Cypress UI)
npm run cypress:open

# Smoke tests (@smoke tag)
npm run cypress:smoke

# Full regression suite (@regression tag)
npm run cypress:regression

# All E2E specs
npm run cypress:all
```

### Test Tags

| Tag           | Description                              |
|---------------|------------------------------------------|
| `@smoke`      | Core happy-path tests — run on every PR  |
| `@regression` | Full coverage — run pre-release          |
| `@visual`     | Visual regression — separate config      |

### Custom Cypress Commands

```typescript
cy.login()                                       // UI login flow
cy.loginViaSession()                             // Cached session login (faster)
cy.postTelemetry({ deviceId, temperature })      // GraphQL postTelemetry mutation
cy.setAlertThreshold(deviceId, threshold)        // GraphQL setAlertConfig mutation
cy.clearAlerts()                                 // Acknowledge all active alerts via GraphQL
cy.getActiveAlerts()                             // GraphQL alerts query via cy.request
cy.compareSnapshot(name, threshold)              // Visual regression snapshot
```

All GraphQL commands post to `Cypress.env('API_URL') + '/graphql'`. Override via `CYPRESS_API_URL` in CI.

---

## Visual Regression Tests

Uses [cypress-image-diff-js](https://github.com/uktrade/cypress-image-diff) for pixel-by-pixel screenshot comparison.

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

The **3% threshold** accounts for sub-pixel font rendering differences across OS versions.

### What is visually tested

| Snapshot                | What it catches                         |
|-------------------------|-----------------------------------------|
| `login-page`            | Layout shift, missing elements          |
| `login-page-error`      | Error state styling regression          |
| `dashboard-no-alerts`   | Full dashboard layout                   |
| `stats-bar`             | Stats bar rendering                     |
| `device-list`           | Device card grid layout                 |
| `dashboard-with-alerts` | Alert badge and alert list appearance   |
| `alert-list-item`       | Alert card styling                      |
| `device-card-online`    | Green status color coding               |
| `device-card-critical`  | Red status color coding                 |
| `device-card-warning`   | Amber status color coding               |
| `alert-config-page`     | Form and table layout                   |
| `alert-config-table`    | Config table rows                       |

### Updating baselines

```bash
npm run cypress:visual:update
git add cypress/snapshots/
git commit -m "chore: update visual regression baselines"
```

Diff images in `cypress/snapshots/__diff_output__/` are gitignored — uploaded as CI artifacts only on failure.

---

## Performance Load Test

```bash
cd performance && npm install

npm test               # Default: 1000 requests, concurrency 10
npm run test:light     # 100 requests
npm run test:heavy     # 5000 requests, concurrency 50

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
    ├── cypress-smoke      (dashboard.cy.ts + alerts.cy.ts @smoke)
    │                       uploads screenshots on failure
    │
    ├── cypress-visual     (visual.cy.ts via cypress.visual.config.js)
    │                       uploads diff images as artifact on failure
    │
    └── cypress-regression (dashboard.cy.ts + alerts.cy.ts, 2× parallel shards)
                            uploads JSON results per shard as artifact
```

See `.github/workflows/ci.yml` for the full pipeline definition.

### Notes on Cypress config split

`cypress.config.ts` handles all E2E and regression specs.
`cypress.visual.config.js` is a plain CommonJS file used exclusively for visual tests — this isolates the `cypress-image-diff-js` plugin, which requires CJS `require()` to load correctly.

---

## Login Credentials (Demo)

| Username  | Password  |
|-----------|-----------|
| admin     | admin123  |
| engineer  | test1234  |

---

## WebSocket Live Updates

The dashboard connects to `ws://localhost:3001/ws` and receives push events — no polling required.

| Event            | Payload | Trigger                           |
|------------------|---------|-----------------------------------|
| `connected`      | —       | Sent on WS handshake              |
| `device_updated` | Device  | Fired on every telemetry received |
| `alert_created`  | Alert   | Fired when threshold is breached  |

On receiving `device_updated` or `alert_created`, the dashboard calls Apollo's `refetch()` to re-query GraphQL and refresh the UI.

---

## Key Testing Patterns Demonstrated

- **`cy.intercept()`** — Stub GraphQL responses (`POST /api/graphql`) to isolate UI from backend state
- **`cy.request()`** — GraphQL contract testing without the UI
- **`cy.wait('@alias')`** — Wait for intercepted requests to resolve (never `cy.wait(number)`)
- **`cy.session()`** — Cache login state across tests for speed
- **`cy.compareSnapshot()`** — Pixel-by-pixel visual regression with diff output
- **Custom Commands** — Reusable `login`, `postTelemetry`, `setAlertThreshold`, `clearAlerts`
- **Fixtures** — Centralized deterministic test data for E2E and visual tests
- **Separate Cypress configs** — Isolate plugin concerns between E2E and visual suites
- **Parallel execution** — Matrix strategy in GitHub Actions for regression sharding
- **GraphQL intercepts** — Operation-level stubbing via `req.body.operationName`
- **API + UI testing** — Both layers covered in the same suite
