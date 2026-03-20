import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    env: {
      API_URL: 'http://localhost:3001',
    },
    setupNodeEvents(on, config) {
      // Emit test tags for smoke vs regression filtering
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
      });
      return config;
    },
  },
});
