import express, { type Request, type Response, Router } from "express";
import WhatsAppBusinessClient from "../whatsapp/WhatsAppBusinessClient.ts";
import ConversationManager from "../whatsapp/ConversationManager.ts";
import config from "../Configs/configs.ts";

const router: Router = express.Router();

// Initialize WhatsApp client
const whatsappClient = new WhatsAppBusinessClient(
    config.whatsappAccessToken || "",
    config.whatsappPhoneNumberId || ""
);

/**
 * GET /webhook - Webhook verification endpoint
 * Meta will call this to verify your webhook URL
 */
router.get("/", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Check if mode and token are correct
    if (mode === "subscribe" && token === config.whatsappWebhookVerifyToken) {
        console.log("✅ Webhook verified successfully");
        res.status(200).send(challenge);
    } else {
        console.error("❌ Webhook verification failed");
        res.sendStatus(403);
    }
});

/**
 * POST /webhook - Receive incoming messages
 * Meta sends incoming messages to this endpoint
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        // Verify webhook signature for security
        const signature = req.headers["x-hub-signature-256"] as string;
        if (signature && config.whatsappAppSecret) {
            const isValid = whatsappClient.verifyWebhookSignature(
                signature,
                JSON.stringify(req.body),
                config.whatsappAppSecret
            );

            if (!isValid) {
                console.error("❌ Invalid webhook signature");
                return res.sendStatus(403);
            }
        }

        // Parse the incoming message
        const message = whatsappClient.parseWebhookMessage(req.body);

        if (!message) {
            // Not a message event, could be status update
            return res.sendStatus(200);
        }

        console.log(`📱 Received message from ${message.from}: ${message.text?.body || message.type}`);

        // Mark message as read
        await whatsappClient.markMessageAsRead(message.id);

        // Handle different message types
        if (message.type === "text" && message.text) {
            // Get user phone number
            const phoneNumber = message.from;
            const messageText = message.text.body;

            // Process message through conversation manager
            const response = await ConversationManager.handleUserMessage(
                phoneNumber,
                messageText
            );

            // Send response back to user
            await whatsappClient.sendTextMessage(phoneNumber, response);
        } else if (message.type === "image" && message.image) {
            // Handle image upload (for KYC documents)
            const phoneNumber = message.from;

            // Download the image
            const imageBuffer = await whatsappClient.downloadMedia(message.image.id);

            // Process image through conversation manager (for KYC)
            const response = await ConversationManager.handleMediaMessage(
                phoneNumber,
                "image",
                imageBuffer,
                message.image.mime_type
            );

            // Send response
            await whatsappClient.sendTextMessage(phoneNumber, response);
        }

        // Always return 200 to acknowledge receipt
        res.sendStatus(200);
    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        // Still return 200 to prevent Meta from retrying
        res.sendStatus(200);
    }
});

export default router;
