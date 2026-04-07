import http from 'http';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { initWebSocket } from './services/websocket';
import { validateCredentials, signToken, verifyToken } from './services/auth';
import type { GraphQLContext } from './types';

const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';

const apollo = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: !isProd,
});

// Apollo requires async start — expose promise so tests can await readiness
export const apolloReady = (async () => {
  await apollo.start();

  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // ── Auth ────────────────────────────────────────────────────────────────────
  app.post(
    '/auth/login',
    cors<cors.CorsRequest>({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }),
    express.json(),
    (req, res) => {
      const { username, password } = req.body as { username?: string; password?: string };
      if (!username || !password) {
        res.status(400).json({ error: 'username and password are required' });
        return;
      }
      const user = validateCredentials(username, password);
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }
      const token = signToken(user);
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    },
  );

  // ── GraphQL ─────────────────────────────────────────────────────────────────
  // Apollo Server v4 requires cors() and express.json() applied directly on the route
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }),
    express.json(),
    expressMiddleware(apollo, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const authHeader = req.headers.authorization ?? '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        const user = token ? verifyToken(token) : null;
        return { user };
      },
    }),
  );

  // ── Health check ─────────────────────────────────────────────────────────────
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
