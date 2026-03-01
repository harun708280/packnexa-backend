"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const config_1 = require("prisma/config");
dotenv_1.default.config();
exports.default = (0, config_1.defineConfig)({
    schema: node_path_1.default.join("prisma/schema"),
    migrations: {
        path: "prisma/migrations",
    },
    engine: "classic",
    datasource: {
        url: (0, config_1.env)("DATABASE_URL"),
    },
});
