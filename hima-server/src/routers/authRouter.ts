import express from "express";
import type { Request, Response, Router } from "express";
import { User } from "../models/User.ts";
import jwt from "jsonwebtoken";
import config from "../Configs/configs.ts";
import TwilioWhatsAppClient from "../whatsapp/TwilioWhatsAppClient.ts";

const router: Router = express.Router();

const twilioClient = new TwilioWhatsAppClient(
    config.twilioAccountSid || "",
    config.twilioAuthToken || "",
    config.twilioWhatsAppNumber || ""
);

/**
 * POST /api/auth/whatsapp/login
 * Request a login code via WhatsApp
 */
router.post("/whatsapp/login", async (req: Request, res: Response) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: "Phone number is required" });
        }

        // Clean phone number (remove +, spaces, etc.)
        const cleanedPhone = phoneNumber.replace(/[\s\+]/g, "");

        // Find user
        let user = await User.findOne({ phoneNumber: cleanedPhone });
        if (!user) {
            return res.status(404).json({
                error: "Account not found. Please register via WhatsApp by messaging us first!"
            });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to user
        user.lastLoginCode = code;
        user.loginCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Send via WhatsApp
        const messageBody = `🔐 Your Hima Insurance login code is: *${code}*\n\nIt expires in 10 minutes. Do not share this code with anyone.`;

        await twilioClient.sendTextMessage(cleanedPhone, messageBody);

        res.json({ success: true, message: "Login code sent via WhatsApp" });
    } catch (error) {
        console.error("Auth Login Error:", error);
        res.status(500).json({ error: "Failed to send login code" });
    }
});

/**
 * POST /api/auth/whatsapp/verify
 * Verify the code and return JWT
 */
router.post("/whatsapp/verify", async (req: Request, res: Response) => {
    try {
        const { phoneNumber, code } = req.body;

        if (!phoneNumber || !code) {
            return res.status(400).json({ error: "Phone number and code are required" });
        }

        const cleanedPhone = phoneNumber.replace(/[\s\+]/g, "");

        const user = await User.findOne({ phoneNumber: cleanedPhone });

        if (!user || user.lastLoginCode !== code) {
            return res.status(401).json({ error: "Invalid login code" });
        }

        if (user.loginCodeExpires && new Date() > user.loginCodeExpires) {
            return res.status(401).json({ error: "Login code expired" });
        }

        // Clear code after use
        user.lastLoginCode = undefined;
        user.loginCodeExpires = undefined;
        await user.save();

        // Sign JWT
        const token = jwt.sign(
            { id: user._id, phoneNumber: user.phoneNumber, role: user.role || "user" },
            config.jwtSecret,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                phoneNumber: user.phoneNumber,
                name: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "New User",
                kycStatus: user.kycStatus
            }
        });
    } catch (error) {
        console.error("Auth Verify Error:", error);
        res.status(500).json({ error: "Failed to verify code" });
    }
});

export default router;
