import type { Express } from "express";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import config from "./Configs/configs.ts";

// ============================================
// WHATSAPP INTEGRATIONS (BOTH ACTIVE)
// ============================================
import webhookRouter from "./routers/webhookRouter.ts";
import settingsRouter from "./routers/settingsRouter.ts";
import logsRouter from "./routers/logsRouter.ts";
import userRouter from "./routers/userRouter.ts";

import insuranceRouter from "./routers/insurance.ts";
import authRouter from "./routers/authRouter.ts";
import testRouter from "./routers/testRouter.ts";

dotenv.config();

const app: Express = express();
const PORT = config.port || 8100;

// Middleware
app.use(cors()); // Enable CORS for dashboard connectivity
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", async (req, res) => {
    const WhatsAppClientFactory = (await import("./whatsapp/WhatsAppClientFactory.ts")).default;
    const currentProvider = WhatsAppClientFactory.getCurrentProvider() || "meta";

    res.json({
        status: "ok",
        message: "Hima Insurance Server is running",
        whatsappProvider: currentProvider,
        network: "Mantle Testnet",
        chainId: config.blockchain.chainId
    });
});

// Routes
// ============================================
// WHATSAPP WEBHOOKS (BOTH ACTIVE)
// ============================================
app.use("/webhook", webhookRouter);

app.use("/api/insurance", insuranceRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/logs", logsRouter);
app.use("/api/test", testRouter);

const startServer = async () => {
    try {
        // Connect to MongoDB
        if (config.mongoDbUri) {
            await mongoose.connect(config.mongoDbUri);
            console.log("✅ Connected to MongoDB");
        }

        // Log configuration
        const WhatsAppClientFactory = (await import("./whatsapp/WhatsAppClientFactory.ts")).default;
        await WhatsAppClientFactory.getClient(); // Ensure initialized
        const currentProvider = WhatsAppClientFactory.getCurrentProvider() || "unknown";

        console.log("🔧 Configuration:");
        console.log(`   - WhatsApp Provider: ${currentProvider}`);
        console.log(`   - Meta Phone ID: ${config.whatsappPhoneNumberId || 'Not configured'}`);
        console.log(`   - Network: Mantle Testnet (Chain ID: ${config.blockchain.chainId})`);
        console.log(`   - RPC URL: ${config.blockchain.rpcUrl}`);

        app.listen(PORT, () => {
            console.log(`🚀 Server started on port ${PORT}`);
            console.log(`📱 Hima Insurance WhatsApp Bot is ready`);
            console.log(`🔗 Meta Webhook URL: https://unmeet-meghan-displeasedly.ngrok-free.dev/webhook`);
            console.log(`💡 Configure webhooks in your respective platforms`);
        });
    } catch (error) {
        console.error("❌ Error starting server:", error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    await mongoose.disconnect();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    await mongoose.disconnect();
    process.exit(0);
});

startServer();