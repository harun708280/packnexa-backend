import chalk from "chalk";
import { Server } from "http";
import app from "./app";
import { envVariables } from "./config";

async function bootstrap() {
  let server: Server;

  const shutdown = (reason: string, error?: unknown) => {
    console.log(chalk.yellow(`\n${reason}`));

    if (error) {
      console.error(error);
    }

    if (server) {
      server.close(() => {
        console.log(chalk.green("✔ Server closed gracefully"));
        process.exit(0);
      });
    } else {
      process.exit(1);
    }
  };

  try {
    server = app.listen(envVariables.PORT, () => {
      console.log(
        chalk.green("🚀 Server is running on http://localhost:") +
        chalk.red.bold(envVariables.PORT)
      );
    });

    process.on("unhandledRejection", (error) => {
      shutdown(
        "❌ Unhandled Rejection detected. Shutting down server...",
        error
      );
    });

    process.on("uncaughtException", (error) => {
      shutdown(
        "❌ Uncaught Exception detected. Shutting down server...",
        error
      );
    });

    process.on("SIGINT", () =>
      shutdown("🛑 SIGINT received. Shutting down gracefully...")
    );

    process.on("SIGTERM", () =>
      shutdown("🛑 SIGTERM received. Shutting down gracefully...")
    );
  } catch (error) {
    console.error("❌ Error during server startup:", error);
    process.exit(1);
  }
}

bootstrap();
