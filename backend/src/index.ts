import http from 'http';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { initWebSocket } from './services/websocket';

const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const apollo = new ApolloServer({ typeDefs, resolvers });

// Apollo requires async start — expose promise so tests can await readiness
export const apolloReady = (async () => {
  await apollo.start();

  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Apollo Server v4 requires cors() and express.json() applied directly on the route
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }),
    express.json(),
    expressMiddleware(apollo),
  );

  // Health check stays as REST
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  initWebSocket(server);

  if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
      console.log(`\n🚀 IoT Monitor GraphQL API at http://localhost:${PORT}/graphql`);
      console.log(`🔌 WebSocket at ws://localhost:${PORT}/ws`);
      console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
    });
  }
})();

export { app, server };
