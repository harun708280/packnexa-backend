const { defineConfig, env } = require("prisma/config");
const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config();

module.exports = defineConfig({
    schema: path.join("prisma/schema"),
    migrations: {
        path: "prisma/migrations",
    },
    engine: "classic",
    datasource: {
        url: env("DATABASE_URL"),
    },
});
