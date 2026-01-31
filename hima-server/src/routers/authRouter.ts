import express from "express";
import type { Request, Response, Router } from "express";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import config from "../Configs/configs.js";

const router: Router = express.Router();

/**
 * POST /api/auth/otp/request
 * Request a login code (Generic OTP)
 */
router.post("/otp/request", async (req: Request, res: Response) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: "Phone number is required" });
        }

        // Clean phone number (remove +, spaces, etc.)
        const cleanedPhone = phoneNumber.replace(/[\s\+]/g, "");

        // Find user by WhatsApp ChatID or dedicated loginPhoneNumber
        let user = await User.findOne({
            $or: [
                { phoneNumber: cleanedPhone },
                { loginPhoneNumber: cleanedPhone }
            ]
        });

        if (!user) {
            return res.status(404).json({
                error: "Account not found. Please register first!"
            });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to user
        user.lastLoginCode = code;
        user.loginCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Send via WhatsApp
        try {
            const BotClient = (await import("../whatsapp-bot/BotClient.js")).default;
            console.log(`📤 [AUTH] Sending login code to ${user.phoneNumber} via Bot`);

            await BotClient.sendText(
                user.phoneNumber,
                `Your Hima Insurance login code is: *${code}*\n\nIt expires in 10 minutes. Do not share this code.`
            );
            console.log(`✅ [AUTH] WhatsApp message sent successfully via Bot`);
        } catch (error) {
            console.warn(`⚠️ [AUTH] Failed to send WhatsApp message via Bot, falling back to console log: ${error}`);
            console.log(`🔐 [AUTH] Generated Login Code for ${user.phoneNumber}: ${code}`);
        }

        res.json({ success: true, message: "Login code sent via WhatsApp" });
    } catch (error) {
        console.error("Auth Login Error:", error);
        res.status(500).json({ error: "Failed to send login code" });
    }
});

/**
 * POST /api/auth/otp/verify
 * Verify the code and return JWT
 */
router.post("/otp/verify", async (req: Request, res: Response) => {
    try {
        const { phoneNumber, code } = req.body;

        if (!phoneNumber || !code) {
            return res.status(400).json({ error: "Phone number and code are required" });
        }

        const cleanedPhone = phoneNumber.replace(/[\s\+]/g, "");

        const user = await User.findOne({
            $or: [
                { phoneNumber: cleanedPhone },
                { loginPhoneNumber: cleanedPhone }
            ]
        });

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
