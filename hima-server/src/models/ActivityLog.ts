import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
    userId?: string;
    type: "REGISTRATION" | "KYC_SUBMITTED" | "KYC_APPROVED" | "KYC_REJECTED" | "QUOTE_GENERATED" | "POLICY_PURCHASED" | "CLAIM_FILED" | "PAYMENT_RECEIVED" | "SYSTEM";
    message: string;
    metadata?: any;
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
            enum: ["REGISTRATION", "KYC_SUBMITTED", "KYC_APPROVED", "KYC_REJECTED", "QUOTE_GENERATED", "POLICY_PURCHASED", "CLAIM_FILED", "PAYMENT_RECEIVED", "SYSTEM"],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
