const { defineConfig } = require('cypress');
const configureVisualRegression = require('cypress-image-diff-js/plugin');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/visual.cy.ts',
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    env: {
      API_URL: 'http://localhost:3001',
      visualRegression: {
        type: 'regression',
      },
    },
    setupNodeEvents(on, config) {
      configureVisualRegression(on, config);
      return config;
    },
  },
});
