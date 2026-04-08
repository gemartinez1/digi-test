# IoT Monitoring Platform — Test Automation Demo

A full-stack demo showcasing Senior Test Automation Engineer skills:
**Cypress · TypeScript · GraphQL · JWT Authentication · IoT event-driven architecture · CI/CD testing**

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

Authentication flow:

```
POST /auth/login → JWT token → Authorization: Bearer <token>
                                       │
                          Apollo Client (frontend)
                          cy.gql() / API helpers (Cypress)
                          GraphQL resolvers (backend guard)
```

---

## Project Structure

```
iot-monitoring-demo/
├── backend/                      # Express + Apollo Server (GraphQL)
│   └── src/
│       ├── graphql/              # schema.ts | resolvers.ts
│       ├── services/             # database.ts | alertProcessor.ts | websocket.ts | auth.ts
│       ├── types/                # index.ts (shared types + GraphQLContext)
│       └── __tests__/            # Jest integration tests
│
├── frontend/                     # React + TypeScript (Vite)
│   └── src/
│       ├── api/                  # client.ts (Apollo Client + auth link)
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
│   │   ├── ui/                   # UI layer tests (require frontend + backend)
│   │   │   ├── dashboard.cy.ts   # Login + device list + real-time dashboard
│   │   │   ├── alerts.cy.ts      # Alert config page + alert lifecycle
│   │   │   └── viewer.cy.ts      # Viewer role UI access control
│   │   └── api/                  # API layer tests (backend only)
│   │       ├── contracts.cy.ts   # GraphQL schema shape + input validation + threshold logic
│   │       └── viewer.cy.ts      # Viewer permitted + forbidden operations
│   ├── fixtures/
│   │   ├── telemetry.json        # Normal, breach, and invalid payloads
│   │   ├── devices.json          # Stub data for cy.intercept()
│   │   └── alert-configs.json    # Stub alert configs
│   └── support/
│       ├── commands.ts           # Custom commands: login, gql, postTelemetry, clearAlerts, etc.
│       └── e2e.ts
│
├── cypress.config.ts             # Main Cypress config
├── .github/workflows/ci.yml      # GitHub Actions CI pipeline
└── package.json
```

---

## Quick Start

### 1. Install Dependencies

```bash
npm run install:all

# Or individually:
npm install                        # Root (Cypress + tooling)
cd backend && npm install
cd frontend && npm install
```

### 2. Start the Backend

```bash
cd backend
npm run dev
# GraphQL API at http://localhost:3001/graphql
# Auth endpoint at http://localhost:3001/auth/login
# WebSocket    at ws://localhost:3001/ws
# Health       at http://localhost:3001/health
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

## Authentication

All GraphQL operations require a valid JWT. Obtain one via the login endpoint:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# → { "token": "<jwt>", "user": { "id": "1", "username": "admin", "role": "admin" } }
```

Pass the token on subsequent requests:

```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"query":"{ devices { id name status } }"}'
```

### Roles

| Role     | Permissions                                        |
|----------|----------------------------------------------------|
| `admin`  | All queries + all mutations (incl. setAlertConfig) |
| `viewer` | All queries + postTelemetry + acknowledgeAlert     |

Role is enforced at the GraphQL resolver level via `requireAuth()` and `requireAdmin()` guards.
The frontend additionally hides the Alert Config page and nav link for viewer accounts.

### Credentials

| Username | Password   | Role   |
|----------|------------|--------|
| admin    | admin123   | admin  |
| viewer   | viewer123  | viewer |

> `JWT_SECRET` defaults to a dev placeholder. Set it via environment variable in production.

---

## GraphQL API

All data access goes through a single endpoint: `POST http://localhost:3001/graphql`

### Queries

```graphql
query { devices { id name location type lastSeen lastTemperature status } }
query { device(id: "sensor-001") { id name status lastTemperature } }
query { alerts { id deviceId deviceName type message temperature threshold timestamp acknowledged } }
query { alertConfig(deviceId: "sensor-001") { temperatureThreshold minTemperatureThreshold enabled } }
query { alertConfigs { deviceId temperatureThreshold minTemperatureThreshold enabled } }
query { telemetryLog { deviceId temperature timestamp } }
```

### Mutations

```graphql
mutation {
  postTelemetry(deviceId: "sensor-001", temperature: 42, timestamp: "2026-01-01T12:00:00Z") {
    success alertTriggered alert { id message }
  }
}

# admin role required
mutation {
  setAlertConfig(deviceId: "sensor-001", temperatureThreshold: 35, minTemperatureThreshold: -2, enabled: true) {
    success config { deviceId temperatureThreshold }
  }
}

mutation {
  acknowledgeAlert(id: "alert-id-here") { success message }
}
```

---

## Backend Tests

```bash
cd backend
npm test              # All tests with coverage

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

### Test Structure

Tests are split into two layers under `cypress/e2e/`:

| Folder | What it tests | Requires |
|--------|--------------|----------|
| `ui/`  | Rendered pages, user interactions, nav visibility, route guards | Frontend + Backend |
| `api/` | GraphQL schema shape, input validation, RBAC enforcement, threshold logic | Backend only |

### Test Tags

| Tag           | Description                             |
|---------------|-----------------------------------------|
| `@smoke`      | Core happy-path tests — run on every PR |
| `@regression` | Full coverage — run pre-release         |

### Custom Cypress Commands

| Command | Description |
|---|---|
| `cy.login()` | Full UI login flow — fetches JWT and stores it in `Cypress.env` |
| `cy.loginViaSession()` | Cached session login + fresh JWT fetch (faster across suites) |
| `cy.gql(query, variables?)` | Authenticated GraphQL request — JWT applied automatically |
| `cy.postTelemetry({ deviceId, temperature })` | GraphQL postTelemetry mutation |
| `cy.setAlertThreshold(deviceId, threshold)` | GraphQL setAlertConfig mutation (admin token required) |
| `cy.clearAlerts()` | Acknowledge all active alerts via GraphQL |
| `cy.getActiveAlerts()` | GraphQL alerts query |

All GraphQL commands route through `cy.gql()`, which reads the stored JWT from `Cypress.env('authToken')` and attaches it as `Authorization: Bearer`. No manual header management in tests.

---

## Performance Load Test

```bash
cd performance && npm install

npm test               # Default: 1000 requests, concurrency 10
npm run test:light     # 100 requests
npm run test:heavy     # 5000 requests, concurrency 50
```

---

## CI/CD Pipeline (GitHub Actions)

```
Push / PR
    │
    ├── lint               (backend ESLint + frontend ESLint)
    │
    ├── backend-tests      (Jest integration tests + coverage upload)
    │
    ├── cypress-smoke      (ui/ + api/ @smoke — all specs)
    │                       uploads screenshots on failure
    │
    └── cypress-regression (2× parallel shards)
                            shard 1 → ui/*.cy.ts
                            shard 2 → api/*.cy.ts
                            merges mocha JSON shards → HTML report artifact
```

See `.github/workflows/ci.yml` for the full pipeline definition.

---

## Key Testing Patterns Demonstrated

- **JWT auth in Cypress** — `cy.login()` fetches a real token; `cy.gql()` attaches it automatically to all GraphQL requests
- **Role-based access control tests** — viewer role tested at both UI layer (nav hidden, route blocked) and API layer (FORBIDDEN error code asserted)
- **UI vs API test separation** — `cypress/e2e/ui/` for rendered interactions, `cypress/e2e/api/` for pure GraphQL contract and permission tests
- **`cy.intercept()` for GraphQL** — stub responses by `operationName` (`POST /api/graphql`) to isolate UI from backend state
- **`cy.gql()`** — single command for authenticated GraphQL requests, eliminates manual header boilerplate
- **`cy.session()`** — cache login state across tests for speed; JWT re-fetched after restore since `Cypress.env` is not persisted
- **`cy.request()`** — GraphQL contract testing without the UI
- **`cy.wait('@alias')`** — wait for intercepted requests to resolve (never `cy.wait(number)`)
- **Custom commands** — reusable `login`, `postTelemetry`, `setAlertThreshold`, `clearAlerts`
- **Fixtures** — centralized deterministic test data (`devices.json`, `alert-configs.json`)
- **Real parallelism** — regression matrix splits UI specs (shard 1) from API specs (shard 2)
- **Defense in depth** — admin-only operations blocked at resolver level regardless of frontend state

---

## WebSocket Live Updates

The dashboard connects to `ws://localhost:3001/ws` and receives push events — no polling required.

| Event            | Trigger                           |
|------------------|-----------------------------------|
| `connected`      | Sent on WS handshake              |
| `device_updated` | Fired on every telemetry received |
| `alert_created`  | Fired when threshold is breached  |
