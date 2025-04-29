export default {
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy'
  },
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["js", "jsx"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/cypress/"
  ],
};
