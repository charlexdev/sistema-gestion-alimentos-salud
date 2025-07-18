/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/controllers/**/*.test.ts"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  moduleNameMapper: {
    // Esto resuelve cualquier importación que empiece con '@/' al directorio src.
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
