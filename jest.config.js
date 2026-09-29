module.exports = {
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.js"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    testTimeout: 30000,
    verbose: true,
    maxWorkers: 1,
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/server.js",
        "!src/server-test.js",
        "!src/jobs/**",
        "!src/config/database.js"
    ]
};
