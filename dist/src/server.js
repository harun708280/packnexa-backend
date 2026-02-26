"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        let server;
        const shutdown = (reason, error) => {
            console.log(chalk_1.default.yellow(`\n${reason}`));
            if (error) {
                console.error(error);
            }
            if (server) {
                server.close(() => {
                    console.log(chalk_1.default.green("✔ Server closed gracefully"));
                    process.exit(0);
                });
            }
            else {
                process.exit(1);
            }
        };
        try {
            server = app_1.default.listen(config_1.envVariables.PORT, () => {
                console.log(chalk_1.default.green("🚀 Server is running on http://localhost:") +
                    chalk_1.default.red.bold(config_1.envVariables.PORT));
            });
            process.on("unhandledRejection", (error) => {
                shutdown("❌ Unhandled Rejection detected. Shutting down server...", error);
            });
            process.on("uncaughtException", (error) => {
                shutdown("❌ Uncaught Exception detected. Shutting down server...", error);
            });
            process.on("SIGINT", () => shutdown("🛑 SIGINT received. Shutting down gracefully..."));
            process.on("SIGTERM", () => shutdown("🛑 SIGTERM received. Shutting down gracefully..."));
        }
        catch (error) {
            console.error("❌ Error during server startup:", error);
            process.exit(1);
        }
    });
}
bootstrap();
