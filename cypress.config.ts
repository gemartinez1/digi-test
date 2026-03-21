import { defineConfig } from 'cypress';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const configureVisualRegression = require('cypress-image-diff-js/plugin');

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
      visualRegression: {
        type: 'regression',     // 'base' = generate baseline, 'regression' = compare
      },
    },
    setupNodeEvents(on, config) {
      configureVisualRegression(on);

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
