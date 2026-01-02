import { ActivityLog } from "../models/ActivityLog.ts";

export async function logActivity(
    type: "REGISTRATION" | "KYC_SUBMITTED" | "KYC_APPROVED" | "KYC_REJECTED" | "QUOTE_GENERATED" | "POLICY_PURCHASED" | "CLAIM_FILED" | "PAYMENT_RECEIVED" | "SYSTEM",
    message: string,
    userId?: string,
    metadata?: any
) {
    try {
        const log = new ActivityLog({
            userId,
            type,
            message,
            metadata
        });
        await log.save();
        console.log(`[ACTIVITY LOG] ${type}: ${message}`);
    } catch (error) {
        console.error("Failed to save activity log:", error);
    }
}
