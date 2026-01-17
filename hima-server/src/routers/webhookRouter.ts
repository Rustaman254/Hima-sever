import express from "express";
import type { Request, Response, Router } from "express";
import config from "../Configs/configs.js";
import ConversationManager from "../whatsapp/ConversationManager.js";

import { fileLogger } from "../libs/fileLogger.js";

const router: Router = express.Router();

// 1. Webhook Verification (GET)
router.get("/", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Check if mode and token are in the query string
    if (mode && token) {
        // Check if mode and token are correct
        if (mode === "subscribe" && token === config.whatsapp.verifyToken) {
            fileLogger.log("✅ [WEBHOOK] Webhook verified successfully!");
            res.status(200).send(challenge);
        } else {
            fileLogger.log("❌ [WEBHOOK] Verification failed. Token mismatch.", "ERROR");
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// 2. Event Handling (POST)
router.post("/", async (req: Request, res: Response) => {
    try {
        const body = req.body;
        fileLogger.log(`🔍 [WEBHOOK] Received payload: ${JSON.stringify(body, null, 2)}`);

        if (body.object === "whatsapp_business_account") {
            fileLogger.log("✅ [WEBHOOK] Valid WhatsApp Business Account event");

            for (const entry of body.entry) {
                fileLogger.log(`📦 [WEBHOOK] Processing entry ID: ${entry.id}`);

                for (const change of entry.changes) {
                    const value = change.value;
                    fileLogger.log(`🔄 [WEBHOOK] Change field: ${change.field}`);

                    if (value.messages && value.messages.length > 0) {
                        const message = value.messages[0];
                        fileLogger.log(`📨 [WEBHOOK] Message type: ${message.type}, from: ${message.from}`);

                        const enrichedMessage = {
                            ...message,
                            profile: value.contacts?.[0]?.profile || null
                        };

                        console.log(`🚀 [WEBHOOK] Calling ConversationManager.handleMessage()`);

                        // Add await to catch errors immediately
                        try {
                            await ConversationManager.handleMessage(enrichedMessage);
                            fileLogger.log(`✅ [WEBHOOK] ConversationManager completed successfully`);
                        } catch (handlerError) {
                            fileLogger.log(`❌ [WEBHOOK] ConversationManager error: ${handlerError}`, "ERROR");
                        }
                    } else if (value.statuses) {
                        const status = value.statuses[0];
                        fileLogger.log(`ℹ️ [WHATSAPP] Status update: ${status.status} for ${status.recipient_id}`);
                    } else {
                        fileLogger.log("⚠️ [WEBHOOK] No messages or statuses in this change", "WARN");
                    }
                }
            }

            res.sendStatus(200);
        } else {
            fileLogger.log(`⚠️ [WEBHOOK] Unexpected object type: ${body.object}`, "WARN");
            res.sendStatus(404);
        }
    } catch (error) {
        fileLogger.log(`❌ [WEBHOOK] Critical error: ${error}`, "ERROR");
        res.sendStatus(500);
    }
});

export default router;
