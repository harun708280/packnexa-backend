"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const routes_1 = __importDefault(require("./app/routes"));
const config_1 = require("./config");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000", "http://localhost:5173", "https://packnexa-frontend.vercel.app"],
    credentials: true,
}));
// kf
app.use(express_1.default.json({ limit: "10mb" }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/v1", routes_1.default);
app.use("/uploads", express_1.default.static("uploads"));
app.get("/", (req, res) => {
    res.send({
        message: "Server is running..",
        environment: config_1.envVariables.NODE_ENV,
        uptime: process.uptime().toFixed(2) + " sec",
        timeStamp: new Date().toISOString(),
    });
});
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
