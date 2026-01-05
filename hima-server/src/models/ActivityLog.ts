import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
    userId?: string;
    type: "REGISTRATION" | "KYC_SUBMITTED" | "KYC_APPROVED" | "KYC_REJECTED" | "QUOTE_GENERATED" | "POLICY_PURCHASED" | "CLAIM_FILED" | "PAYMENT_RECEIVED" | "SYSTEM" | "ADMIN_BROADCAST" | "ADMIN_OUTBOUND" | "WEBHOOK";
    message: string;
    metadata?: any;
    isRead: boolean;
    sender: "USER" | "ADMIN" | "SYSTEM";
    recipient?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
    {
        userId: {
            type: String,
            index: true,
        },
        type: {
            type: String,
            enum: ["REGISTRATION", "KYC_SUBMITTED", "KYC_APPROVED", "KYC_REJECTED", "QUOTE_GENERATED", "POLICY_PURCHASED", "CLAIM_FILED", "PAYMENT_RECEIVED", "SYSTEM", "ADMIN_BROADCAST", "ADMIN_OUTBOUND", "WEBHOOK"],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        sender: {
            type: String,
            enum: ["USER", "ADMIN", "SYSTEM"],
            required: true,
            default: "SYSTEM"
        },
        recipient: {
            type: String, // Phone number if outbound
        },
    },
    {
        timestamps: true,
    }
);

ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
