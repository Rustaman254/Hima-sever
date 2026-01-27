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
        environment: process.env.VERCEL === '1' ? 'Vercel Serverless' : 'Standalone',
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

/**
 * Handle serverless MongoDB connection
 */
let cachedDb: any = null;

const connectToDatabase = async () => {
    if (cachedDb) return cachedDb;
    if (!config.mongoDbUri) return null;

    console.log("📂 [DB] Connecting to MongoDB...");
    const db = await mongoose.connect(config.mongoDbUri);
    cachedDb = db;
    console.log("✅ [DB] Connected successfully");
    return db;
};

const startServer = async () => {
    try {
        await connectToDatabase();

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

                // Start WhatsApp bot using dynamic import to avoid heavy dependency load on Vercel
                try {
                    const { startBot } = await import("./whatsapp-bot/index.js");
                    await startBot();
                    console.log(`✅ WhatsApp bot initialized`);
                } catch (error) {
                    console.error(`⚠️ WhatsApp bot failed to start: ${error}`);
                    console.log(`   Server will continue without bot functionality`);
                }
            });
        }
    } catch (error) {
        console.error("❌ Error starting server:", error);
        if (process.env.VERCEL !== '1') {
            process.exit(1);
        }
    }
};

// Graceful shutdown handling
if (process.env.VERCEL !== '1') {
    const handleShutdown = async (signal: string) => {
        console.log(`\n🛑 [${signal}] Shutting down gracefully...`);
        try {
            const { stopBot } = await import("./whatsapp-bot/index.js");
            await stopBot();
        } catch (e) { }
        await mongoose.disconnect();
        process.exit(0);
    };

    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
}

// Optimization for Vercel Serverless Functions
if (process.env.VERCEL === '1') {
    // Connect to database but don't call startBot
    connectToDatabase().catch(err => {
        console.error("❌ Fatal MongoDB Connection Error:", err);
    });
} else {
    // Start standard server
    startServer();
}

export default app;