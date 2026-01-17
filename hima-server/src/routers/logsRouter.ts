import express from "express";
import type { Request, Response, Router } from "express";
import { logEmitter } from "../libs/activityLogger.js";

const router: Router = express.Router();

import { ActivityLog } from "../models/ActivityLog.js"; // Add import



/**
 * GET /api/logs - Fetch historical logs
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const { type, limit } = req.query;
        const query: any = {};
        if (type && type !== "ALL") {
            query.type = type;
        }

        const logs = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit) || 100);

        res.json({ success: true, logs });
    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ success: false, error: "Failed to fetch logs" });
    }
});
router.get("/stream", (req: Request, res: Response) => {
    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: "SYSTEM", message: "Connected to log stream", timestamp: new Date() })}\n\n`);

    // Listener function
    const onNewLog = (log: any) => {
        // Send log data
        res.write(`data: ${JSON.stringify(log)}\n\n`);
    };

    // Subscribe to new logs
    logEmitter.on("new_log", onNewLog);

    // Clean up on disconnect
    req.on("close", () => {
        logEmitter.off("new_log", onNewLog);
    });
});

export default router;
