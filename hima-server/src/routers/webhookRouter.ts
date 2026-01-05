import express from "express";
import type { Request, Response, Router } from "express";
import conversationManager from "../whatsapp/ConversationManager.ts";
import WhatsAppClientFactory from "../whatsapp/WhatsAppClientFactory.ts";
import { logActivity } from "../libs/activityLogger.ts";
import config from "../Configs/configs.ts";

const router: Router = express.Router();
console.log("⚡ [ROUTER] Webhook Router Loaded");

/**
 * GET /api/webhooks/whatsapp
 * Meta verification handler (Hub Verification)
 */
router.get("/", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Use token from config
    const verifyToken = config.whatsappWebhookVerifyToken || "hima_webhook_verify_token";

    if (mode && token) {
        if (mode === "subscribe" && token === verifyToken) {
            console.log("✅ Webhook verified successfully!");
            return res.status(200).send(challenge);
        }
        console.warn("❌ Webhook verification failed. Invalid token.");
        return res.sendStatus(403);
    }
    return res.sendStatus(400);
});

/**
 * POST /api/webhooks/whatsapp
 * This is the endpoint that WhatsApp/Meta calls when a user sends a message.
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        console.log("\n" + "=".repeat(50));
        console.log("📥 [WEBHOOK] NEW INCOMING REQUEST");
        console.log("⏰ Time:", new Date().toISOString());
        console.log("📦 Raw Payload:", JSON.stringify(req.body, null, 2));
        console.log("=".repeat(50));

        // Log raw webhook payload for debugging
        await logActivity("WEBHOOK", "Incoming Webhook Payload", undefined, req.body);

        // Get the active WhatsApp client
        const whatsappClient = await WhatsAppClientFactory.getClient();

        // Parse the incoming message
        const message = whatsappClient.parseWebhookMessage(req.body);

        if (!message) {
            console.log("ℹ️ [WEBHOOK] Request received but no message found (likely a status update or verification)");
            console.log("=".repeat(50) + "\n");
            return res.sendStatus(200);
        }

        console.log(`📱 [WEBHOOK] Message Parsed:`);
        console.log(`   - From: ${message.from}`);
        console.log(`   - Type: ${message.type}`);
        console.log(`   - Body: ${message.body || "N/A"}`);
        console.log("=".repeat(50) + "\n");

        // Resolve user to link activity
        const { User } = await import("../models/User.ts");
        const user = await User.findOne({ phoneNumber: message.from });

        await logActivity(
            "WEBHOOK",
            message.body || `Media received: ${message.type}`,
            user?._id.toString(),
            { from: message.from, type: message.type },
            "USER"
        );

        // Handle different message types (text or interactive responses)
        if ((message.type === "text" || message.type === "interactive") && message.body) {
            const phoneNumber = message.from;
            const messageText = message.body;

            // Process message through conversation manager
            console.log(`💬 [WEBHOOK] Processing message from ${phoneNumber}`);
            const responses = await conversationManager.handleUserMessage(
                phoneNumber,
                messageText
            );

            // Send each response back to user
            for (const response of responses) {
                console.log(`📨 [WEBHOOK] Sending response:`, {
                    bodyPreview: response.body.substring(0, 100)
                });
                try {
                    await sendWhatsAppResponse(whatsappClient, phoneNumber, response);
                } catch (sendError: any) {
                    console.error(`❌ [WEBHOOK] Failed to send response to ${phoneNumber}`);
                    const errorCode = sendError.response?.data?.error?.code;

                    if (errorCode === 131030) {
                        console.error(`🚫 [WEBHOOK] SANDBOX RESTRICTION: ${phoneNumber} is not in the allowed list`);
                        console.error(`    → This message cannot be delivered until ${phoneNumber} is added to Meta sandbox`);
                        console.error(`    → See WHATSAPP_SETUP.md for instructions`);
                    } else {
                        console.error(`    → Error:`, sendError.message);
                    }

                    // Log the failed message for debugging but continue processing
                    await logActivity(
                        "WEBHOOK_ERROR",
                        `Failed to send message to ${phoneNumber}: ${sendError.message}`,
                        user?._id.toString(),
                        { errorCode, phoneNumber, response: response.body.substring(0, 100) }
                    );
                }
            }
        } else if (message.type === "image" && message.mediaUrl) {
            const phoneNumber = message.from;

            // Handle media using conversation manager
            const response = await conversationManager.handleMediaMessage(
                phoneNumber,
                "image",
                Buffer.from([]), // Buffer is usually downloaded inside CM if needed
                "image/jpeg"
            );

            await sendWhatsAppResponse(whatsappClient, phoneNumber, response);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("Webhook Error:", error);
        res.sendStatus(500);
    }
});

/**
 * Helper to send different types of WhatsApp responses
 */
async function sendWhatsAppResponse(client: any, to: string, response: any) {
    if (response.list) {
        await client.sendListMessage(to, response.body, response.list.buttonText, response.list.sections);
    } else if (response.buttons && response.buttons.length > 0) {
        if (response.buttons.length <= 3) {
            await client.sendButtonMessage(to, response.body, response.buttons);
        } else {
            const sections = [{
                title: "Available Options",
                rows: response.buttons.map((btn: string, idx: number) => ({
                    id: `opt_${idx}`,
                    title: btn.substring(0, 24),
                    description: `Select ${btn}`
                }))
            }];
            await client.sendListMessage(to, response.body, "Select Option", sections);
        }
    } else if (response.cta) {
        await client.sendCTAMessage(to, response.body, response.cta.label, response.cta.url);
    } else {
        await client.sendTextMessage(to, response.body);
    }
}

export default router;
