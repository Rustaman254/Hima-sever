import express from "express";
import type { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";

const router: Router = express.Router();

/**
 * GET /api/users - Get all users
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
});

/**
 * PUT /api/users/:id/status - Update user status (Approve KYC, Block, etc.)
 */
router.put("/:id/status", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve_kyc', 'reject_kyc', 'block_user', 'unblock_user', 'make_admin'

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        switch (action) {
            case "approve_kyc":
                user.kycStatus = "verified";
                // Optionally proceed conversation state if they were waiting
                if (user.conversationState === "WAITING_FOR_APPROVAL") {
                    // We don't change state here blindly, but the next message will trigger the success flow
                    // Or we could proactively send a message if we had access to the client here
                }
                break;
            case "reject_kyc":
                user.kycStatus = "rejected";
                break;
            case "block_user":
                user.status = "blocked"; // Assuming 'status' field exists or we use another flag
                break;
            case "unblock_user":
                user.status = "active";
                break;
            case "make_admin":
                user.role = "admin";
                break;
            default:
                return res.status(400).json({ success: false, error: "Invalid action" });
        }

        await user.save();
        res.json({ success: true, user });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ success: false, error: "Failed to update user" });
    }
});

/**
 * POST /api/users/:id/message - Send a direct WhatsApp message to a user
 */
router.post("/:id/message", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { message, type, buttons } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: "Message body is required" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        const whatsappClient = (await import("../whatsapp/WhatsAppClient.js")).default;
        const activityLogger = (await import("../libs/activityLogger.js")).logActivity;

        let response;
        if (type === "buttons" && Array.isArray(buttons) && buttons.length > 0) {
            response = await whatsappClient.sendButtonMessage(user.phoneNumber, message, buttons);
            await activityLogger("ADMIN_OUTBOUND", message, user._id.toString(), { buttons }, "ADMIN", user.phoneNumber);
        } else {
            response = await whatsappClient.sendTextMessage(user.phoneNumber, message);
            await activityLogger("ADMIN_OUTBOUND", message, user._id.toString(), undefined, "ADMIN", user.phoneNumber);
        }

        res.json({ success: true, message: "Message sent", details: response });
    } catch (error: any) {
        console.error("Error sending message:", error);
        res.status(500).json({ success: false, error: "Failed to send message: " + (error.message || "Unknown error") });
    }
});

/**
 * POST /api/users/broadcast - Send a message to ALL users
 */
router.post("/broadcast", async (req: Request, res: Response) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: "Message body is required" });
        }

        const users = await User.find({ status: { $ne: 'blocked' } });
        const whatsappClient = (await import("../whatsapp/WhatsAppClient.js")).default;

        let sentCount = 0;
        let failedCount = 0;

        for (const user of users) {
            if (!user.phoneNumber) continue;
            try {
                await whatsappClient.sendTextMessage(user.phoneNumber, message);
                sentCount++;
            } catch (e) {
                failedCount++;
            }
        }

        res.json({ success: true, sent: sentCount, failed: failedCount });
    } catch (error: any) {
        console.error("Error broadcasting:", error);
        res.status(500).json({ success: false, error: "Failed to broadcast" });
    }
});


/**
 * GET /api/users/messages/history - Get message history (logs)
 */
router.get("/messages/history", async (req: Request, res: Response) => {
    try {
        const { ActivityLog } = await import("../models/ActivityLog.js");

        // Fetch logs related to communications
        const logs = await ActivityLog.find({
            type: { $in: ["WEBHOOK", "ADMIN_BROADCAST", "ADMIN_OUTBOUND", "REGISTRATION", "ADMIN_BROADCAST_SUMMARY"] }
        })
            .sort({ createdAt: -1 })
            .limit(50);

        // Populate basic user info manually (since userId is a string, not always ObjectId)
        const enrichedLogs = await Promise.all(logs.map(async (log) => {
            const logObj = log.toObject();
            if (logObj.userId && mongoose.Types.ObjectId.isValid(logObj.userId)) {
                const user = await User.findById(logObj.userId).select("firstName lastName phoneNumber profilePicture");
                if (user) {
                    (logObj as any).user = user;
                }
            }
            return logObj;
        }));

        res.json({ success: true, logs: enrichedLogs });
    } catch (error: any) {
        console.error("Error fetching history:", error);
        res.status(500).json({ success: false, error: "Failed to fetch history" });
    }
});

/**
 * GET /api/users/chats - Get list of users with their last message
 */
router.get("/chats", async (req: Request, res: Response) => {
    try {
        const { ActivityLog } = await import("../models/ActivityLog.js");

        // Find latest message for each user
        const chats = await ActivityLog.aggregate([
            { $match: { userId: { $exists: true, $ne: null } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$userId",
                    lastMessage: { $first: "$message" },
                    lastType: { $first: "$type" },
                    lastSender: { $first: "$sender" },
                    lastCreatedAt: { $first: "$createdAt" },
                    unreadCount: {
                        $sum: {
                            $cond: [{ $and: [{ $eq: ["$isRead", false] }, { $eq: ["$sender", "USER"] }] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { lastCreatedAt: -1 } }
        ]);

        // Enrich with user details
        const enrichedChats = await Promise.all(chats.map(async (chat) => {
            let user = null;
            if (chat._id && mongoose.Types.ObjectId.isValid(chat._id)) {
                try {
                    user = await User.findById(chat._id).select("firstName lastName phoneNumber profilePicture");
                } catch (e) { }
            }

            return {
                ...chat,
                user
            };
        }));

        res.json({ success: true, chats: enrichedChats });
    } catch (error: any) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ success: false, error: "Failed to fetch chats" });
    }
});

/**
 * GET /api/users/chats/:userId/messages - Get full conversation with a user
 */
router.get("/chats/:userId/messages", async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { ActivityLog } = await import("../models/ActivityLog.js");

        const messages = await (ActivityLog as any).find({ userId })
            .sort({ createdAt: 1 });

        res.json({ success: true, messages });
    } catch (error: any) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({ success: false, error: "Failed to fetch chat messages" });
    }
});

/**
 * POST /api/users/chats/:userId/read - Mark conversation as read
 */
router.post("/chats/:userId/read", async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { ActivityLog } = await import("../models/ActivityLog.js");

        await (ActivityLog as any).updateMany(
            { userId, sender: "USER", isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ success: true });
    } catch (error: any) {
        console.error("Error marking as read:", error);
        res.status(500).json({ success: false, error: "Failed to mark as read" });
    }
});

/**
 * GET /api/users/chats/unread-total - Get total unread count for badge
 */
router.get("/chats/unread-total", async (req: Request, res: Response) => {
    try {
        const { ActivityLog } = await import("../models/ActivityLog.js");
        const count = await ActivityLog.countDocuments({ sender: "USER", isRead: false });
        res.json({ success: true, count });
    } catch (error: any) {
        res.status(500).json({ success: false, error: "Failed to fetch unread total" });
    }
});

export default router;
