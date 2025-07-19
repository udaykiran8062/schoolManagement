export default {
    transform: {},
    testMatch: ["**/__tests__/**/*.mjs", "**/?(*.)+(spec|test).mjs"],
    moduleFileExtensions: ["mjs", "js", "json"],
    testEnvironment: "node",
    testTimeout: 10000,
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageReporters: [
        "json",
        "text",
        "lcov",
        "clover"
    ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/src/config/"
    ],
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 75,
            lines: 75,
            statements: 75
        }
    }
};