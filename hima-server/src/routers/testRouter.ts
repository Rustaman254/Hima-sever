import express from "express";
import type { Request, Response, Router } from "express";
import WhatsAppClientFactory from "../whatsapp/WhatsAppClientFactory.ts";

const router: Router = express.Router();

/**
 * POST /api/test/whatsapp - Test WhatsApp message sending
 * Use this endpoint to test if your WhatsApp configuration is working
 */
router.post("/whatsapp", async (req: Request, res: Response) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: "Missing 'to' or 'message' in request body"
            });
        }

        console.log(`\ud83e\uddea [TEST] Testing WhatsApp message send to ${to}`);
        console.log(`\ud83e\uddea [TEST] Message: ${message}`);

        // Get the active WhatsApp client
        const whatsappClient = await WhatsAppClientFactory.getClient();
        const provider = WhatsAppClientFactory.getCurrentProvider();

        console.log(`\ud83e\uddea [TEST] Using provider: ${provider}`);

        // Send test message
        const result = await whatsappClient.sendTextMessage(to, message);

        console.log(`\u2705 [TEST] Message sent successfully`);

        return res.json({
            success: true,
            provider,
            result,
            message: "Test message sent successfully"
        });
    } catch (error: any) {
        console.error(`\u274c [TEST] Error sending test message:`, error.message);
        console.error(`\u274c [TEST] Full error:`, error);

        return res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data || error
        });
    }
});

/**
 * GET /api/test/config - Check WhatsApp configuration
 */
router.get("/config", async (req: Request, res: Response) => {
    try {
        const provider = WhatsAppClientFactory.getCurrentProvider();
        const config = {
            provider: provider || "Not initialized",
            hasMetaToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
            hasMetaPhoneId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
        };

        console.log(`\ud83d\udd0d [TEST] Configuration check:`, config);

        return res.json({
            success: true,
            config
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
