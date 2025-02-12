// jest.config.js

// Import the "next/jest" preset from Next.js
import nextJest from "next/jest.js";

// Create the Jest config using the "createJestConfig" function from next/jest
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Any custom Jest configuration goes in this object
const customJestConfig = {
  // Where Jest looks for tests
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],

  // The test environment that simulates the DOM
  testEnvironment: "jest-environment-jsdom",

  // A setup file that is run immediately after the testing framework is installed in the environment
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Jest transformations: using ts-jest to handle TypeScript files
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },

  // Example ignoring of certain folders (optional)
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

// Export the wrapped config
export default createJestConfig(customJestConfig);
