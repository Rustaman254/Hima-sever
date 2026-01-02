import type { Express } from "express";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import config from "./Configs/configs.ts";

// ============================================
// TWILIO WHATSAPP (ACTIVE)
// ============================================
import twilioWebhookRouter from "./routers/twilioWebhookRouter.ts";

// ============================================
// WHATSAPP BUSINESS API (COMMENTED - KEPT FOR REFERENCE)
// ============================================
// import webhookRouter from "./routers/webhookRouter.ts";

import insuranceRouter from "./routers/insurance.ts";
import authRouter from "./routers/authRouter.ts";

dotenv.config();

const app: Express = express();
const PORT = config.port || 8100;

// Middleware
app.use(cors()); // Enable CORS for dashboard connectivity
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Hima Insurance Server is running",
        whatsappProvider: "Twilio",
        network: "Mantle Testnet",
        chainId: config.blockchain.chainId
    });
});

// Routes
// ============================================
// TWILIO WHATSAPP WEBHOOK (ACTIVE)
// ============================================
app.use("/twilio-webhook", twilioWebhookRouter);

// ============================================
// WHATSAPP BUSINESS API WEBHOOK (COMMENTED)
// ============================================
// app.use("/webhook", webhookRouter);

app.use("/api/insurance", insuranceRouter);
app.use("/api/auth", authRouter);

const startServer = async () => {
    try {
        // Connect to MongoDB
        if (config.mongoDbUri) {
            await mongoose.connect(config.mongoDbUri);
            console.log("✅ Connected to MongoDB");
        }

        // Log configuration
        console.log("🔧 Configuration:");
        console.log(`   - WhatsApp Provider: Twilio`);
        console.log(`   - Twilio Number: ${config.twilioWhatsAppNumber || 'Not configured'}`);
        console.log(`   - Network: Mantle Testnet (Chain ID: ${config.blockchain.chainId})`);
        console.log(`   - RPC URL: ${config.blockchain.rpcUrl}`);

        app.listen(PORT, () => {
            console.log(`🚀 Server started on port ${PORT}`);
            console.log(`📱 Hima Insurance WhatsApp Bot is ready (Twilio)`);
            console.log(`🔗 Twilio Webhook URL: http://localhost:${PORT}/twilio-webhook`);
            console.log(`💡 Configure this URL in your Twilio WhatsApp Sandbox`);
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