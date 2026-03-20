import http from 'http';
import express from 'express';
import cors from 'cors';
import telemetryRouter from './routes/telemetry';
import devicesRouter from './routes/devices';
import alertsRouter from './routes/alerts';
import { initWebSocket } from './services/websocket';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/telemetry', telemetryRouter);
app.use('/devices', devicesRouter);
app.use('/alerts', alertsRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Create HTTP server and attach WebSocket
const server = http.createServer(app);
initWebSocket(server);

// Only listen when not in test mode
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`\n🚀 IoT Monitor API running at http://localhost:${PORT}`);
    console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
    console.log(`📡 Endpoints: GET /devices | GET /alerts | POST /telemetry | POST /alerts/config\n`);
  });
}

export { app, server };
