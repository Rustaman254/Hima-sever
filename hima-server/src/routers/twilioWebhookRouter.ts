import express from "express";
import type { Request, Response, Router } from "express";
import TwilioWhatsAppClient from "../whatsapp/TwilioWhatsAppClient.ts";
import ConversationManager from "../whatsapp/ConversationManager.ts";
import config from "../Configs/configs.ts";

const router: Router = express.Router();

// Initialize Twilio WhatsApp client
const twilioClient = new TwilioWhatsAppClient(
    config.twilioAccountSid || "",
    config.twilioAuthToken || "",
    config.twilioWhatsAppNumber || ""
);

/**
 * POST /twilio-webhook - Receive incoming WhatsApp messages from Twilio
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        // Validate Twilio signature for security
        const signature = req.headers["x-twilio-signature"] as string;
        // When running behind ngrok or a proxy, req.protocol might be 'http' but Twilio sees 'https'
        // We need to reconstruct the URL exactly as Twilio sees it
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const url = `${protocol}://${req.get("host")}${req.originalUrl}`;

        if (signature && config.twilioAuthToken) {
            const isValid = twilioClient.validateWebhookSignature(signature, url, req.body);
            if (!isValid) {
                console.error("❌ Invalid Twilio signature");
                return res.sendStatus(403);
            }
        }

        // Parse the incoming message
        const message = twilioClient.parseWebhookMessage(req.body);

        if (!message.body && message.numMedia === "0") {
            // No text or media, ignore
            return res.sendStatus(200);
        }

        console.log(`📱 Received message from ${message.from}: ${message.body || "[Media]"}`);

        // Extract phone number (remove whatsapp: prefix)
        const phoneNumber = twilioClient.extractPhoneNumber(message.from);

        // Check for media
        const mediaUrl = (message.numMedia && parseInt(message.numMedia) > 0) ? message.mediaUrl0 : undefined;

        if (message.body || mediaUrl) {
            console.log(`💬 Processing message from ${phoneNumber} (Media: ${!!mediaUrl})`);

            // Process message through conversation manager
            const response = await ConversationManager.handleUserMessage(
                phoneNumber,
                message.body || "",
                mediaUrl
            );

            // Send response back to user based on content type
            if (response.buttons && response.buttons.length > 0) {
                await twilioClient.sendButtonMessage(message.from, response.body, response.buttons);
            } else if (response.cta) {
                await twilioClient.sendCtaMessage(message.from, response.body, response.cta.label, response.cta.url);
            } else {
                await twilioClient.sendTextMessage(message.from, response.body);
            }
        }

        // Always return 200 to acknowledge receipt
        res.sendStatus(200);
    } catch (error) {
        console.error("❌ Error processing Twilio webhook:", error);
        // Still return 200 to prevent Twilio from retrying
        res.sendStatus(200);
    }
});

/**
 * GET /twilio-webhook - Health check for Twilio webhook
 */
router.get("/", (req: Request, res: Response) => {
    res.json({
        status: "ok",
        message: "Twilio WhatsApp webhook is active",
        timestamp: new Date().toISOString(),
    });
});

export default router;
