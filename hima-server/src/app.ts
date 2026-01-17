import type { Express } from "express";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import config from "./Configs/configs.js";
import { fileLogger } from "./libs/fileLogger.js";

import settingsRouter from "./routers/settingsRouter.js";
import logsRouter from "./routers/logsRouter.js";
import userRouter from "./routers/userRouter.js";

import insuranceRouter from "./routers/insurance.js";
import authRouter from "./routers/authRouter.js";
import testRouter from "./routers/testRouter.js";
import webhookRouter from "./routers/webhookRouter.js";
import mpesaRouter from "./routers/mpesaRouter.js";
import himaRouter from "./routers/himaRouter.js";
import { startBot, stopBot } from "./whatsapp-bot/index.js";

dotenv.config();

const app: Express = express();
const PORT = config.port || 8100;

// Middleware
app.use(cors()); // Enable CORS for dashboard connectivity
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", async (req, res) => {
    res.json({
        status: "ok",
        message: "Hima Insurance Server is running",
        network: "Mantle Testnet",
        chainId: config.blockchain.chainId
    });
});

// Routes
// ============================================
// ROUTES
// ============================================

app.use("/api/insurance", insuranceRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/logs", logsRouter);
app.use("/api/test", testRouter);
app.use("/api/webhook", webhookRouter);
app.use("/api/mpesa", mpesaRouter);
app.use("/api/hima", himaRouter);

const startServer = async () => {
    try {
        // Connect to MongoDB
        if (config.mongoDbUri) {
            await mongoose.connect(config.mongoDbUri);
            console.log("✅ Connected to MongoDB");
        }

        // Log configuration
        console.log("🔧 Configuration:");
        console.log(`   - Network: Mantle Testnet (Chain ID: ${config.blockchain.chainId})`);
        console.log(`   - RPC URL: ${config.blockchain.rpcUrl}`);

        // Only start the listener and bot if not running as a Vercel serverless function
        if (process.env.VERCEL !== '1') {
            app.listen(PORT, "0.0.0.0", async () => {
                console.log(`🚀 Server started on port ${PORT}`);
                fileLogger.log(`🚀 Server started on port ${PORT}`);
                console.log(`💡 Hima Insurance Server is ready`);

                // Start WhatsApp bot
                try {
                    await startBot();
                    console.log(`✅ WhatsApp bot initialized`);
                } catch (error) {
                    console.error(`⚠️ WhatsApp bot failed to start: ${error}`);
                    console.log(`   Server will continue without bot functionality`);
                }
            });
        } else {
            console.log("⚡ Running in Vercel Serverless environment. Bot initialization skipped.");
        }
    } catch (error) {
        console.error("❌ Error starting server:", error);
        if (process.env.VERCEL !== '1') {
            process.exit(1);
        }
    }
};

// Graceful shutdown
if (process.env.VERCEL !== '1') {
    process.on("SIGINT", async () => {
        console.log("\n🛑 Shutting down gracefully...");
        await stopBot();
        await mongoose.disconnect();
        process.exit(0);
    });

    process.on("SIGTERM", async () => {
        console.log("\n🛑 Shutting down gracefully...");
        await stopBot();
        await mongoose.disconnect();
        process.exit(0);
    });
}

// Initial connection for serverless environments
if (config.mongoDbUri && process.env.VERCEL === '1') {
    mongoose.connect(config.mongoDbUri).then(() => {
        console.log("✅ MongoDB Connected (Serverless Mode)");
    }).catch(err => {
        console.error("❌ MongoDB Connection Error (Serverless Mode):", err);
    });
}

if (process.env.VERCEL !== '1') {
    startServer();
}

export default app;