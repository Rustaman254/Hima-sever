import { ActivityLog } from "../models/ActivityLog.ts";
import { EventEmitter } from "events";

export const logEmitter = new EventEmitter();

export async function logActivity(
    type: "REGISTRATION" | "KYC_SUBMITTED" | "KYC_APPROVED" | "KYC_REJECTED" | "QUOTE_GENERATED" | "POLICY_PURCHASED" | "CLAIM_FILED" | "PAYMENT_RECEIVED" | "SYSTEM" | "WEBHOOK" | "WEBHOOK_ERROR" | "ADMIN_BROADCAST" | "ADMIN_OUTBOUND",
    message: string,
    userId?: string,
    metadata?: any,
    sender: "USER" | "ADMIN" | "SYSTEM" = "SYSTEM",
    recipient?: string
) {
    try {
        const { ActivityLog } = await import("../models/ActivityLog.ts");
        const log: any = await ActivityLog.create({
            type,
            message,
            sender,
            ...(userId && { userId }),
            ...(metadata && { metadata }),
            ...(recipient && { recipient })
        } as any);

        // Broadcast log event
        logEmitter.emit("new_log", {
            ...log.toObject(),
            timestamp: new Date()
        });

        console.log(`[ACTIVITY LOG] ${type}: ${message}`);
    } catch (error) {
        console.error("Failed to save activity log:", error);
    }
}
