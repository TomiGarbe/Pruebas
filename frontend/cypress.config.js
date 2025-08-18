const { defineConfig } = require("cypress");
require('dotenv').config();

module.exports = defineConfig({
  reporter: 'mocha-junit-reporter',
  reporterOptions: {
    mochaFile: 'cypress/results-[hash].xml'
  },
  e2e: {
    baseUrl: process.env.VITE_FRONTEND_URL,
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents(on, config) {
      const fs = require('fs');
      const path = require('path');

      on('task', {
        readFixture(filename) {
          const fixturePath = path.join(__dirname, 'cypress', 'fixtures', filename);
          return fs.readFileSync(fixturePath, 'utf8');
        },
        resetDB() {
          // Implement DB reset logic here
          console.log('resetDB called');
          return null;
        }
      });

      return config;
    }
  },
  experimentalStudio: true
});