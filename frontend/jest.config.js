module.exports = {
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy'
  },
  testResultsProcessor: 'jest-junit',
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["js", "jsx"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/cypress/"
  ],
  "collectCoverage": true,
  "coverageDirectory": "coverage",
  "coverageReporters": ["json", "lcov", "text", "html"],
  "coveragePathIgnorePatterns": ["/src/config.js"],
  "collectCoverageFrom": [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.test.{js,jsx,ts,tsx}",
    "!src/**/index.{js,jsx,ts,tsx}"
  ]
};
