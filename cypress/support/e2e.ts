import './commands';

// Silence uncaught WebSocket reconnect errors in tests
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('WebSocket') || err.message.includes('ws://')) {
    return false;
  }
});
