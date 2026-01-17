import express from "express";
import type { Router } from "express";
import WhatsAppClient from "../whatsapp/WhatsAppClient.js";

const router: Router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "Test router is active but empty." });
});

router.post("/template", async (req, res) => {
    try {
        const { to } = req.body;

        if (!to) {
            res.status(400).json({ error: "Missing 'to' phone number" });
            return;
        }

        // Example component structure from user request
        const components = [{
            type: "header",
            parameters: [{
                type: "image",
                image: {
                    link: "https://scontent.xx.fbcdn.net/mci_ab/uap/asset_manager/id/?ab_b=e&ab_page=AssetManagerID&ab_entry=1530053877871776"
                }
            }]
        }];

        const response = await WhatsAppClient.sendTemplateMessage(
            to,
            "jaspers_market_image_cta_v1",
            "en_US",
            components
        );

        res.json({ success: true, data: response });
    } catch (error: any) {
        console.error("Error sending template:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
