import express from "express";
import type { Request, Response, Router } from "express";
import config from "../Configs/configs.js";
import SystemSettings from "../models/SystemSettings.js";

const router: Router = express.Router();

/**
 * GET /api/settings - Fetch system settings (masked)
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const maskedConfig = {
            blockchain: {
                chainId: process.env.CHAIN_ID,
                rpcUrl: process.env.RPC_URL ? "Configured" : "Not Set"
            }
        };

        res.json({ success: true, settings: maskedConfig });
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ success: false, error: "Failed to fetch settings" });
    }
});

/**
 * PUT /api/settings - Update system settings
 */
router.put("/", async (req: Request, res: Response) => {
    try {
        const { provider, config: newConfig } = req.body;

        const updatedSettings = await SystemSettings.updateSettings(provider, newConfig);

        res.json({ success: true, settings: updatedSettings });
    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ success: false, error: "Failed to update settings" });
    }
});

export default router;
