import mongoose, { Schema, Document } from "mongoose";

export interface IClaim extends Document {
    policyId: string;
    userId: string;
    incidentTime: Date;
    incidentLocation: string;
    incidentDescription: string;
    status: "received" | "review" | "approved" | "rejected" | "paid";
    payoutAmountKES?: number;
    mediaUrls: string[];
    onChainClaimId?: string;
    onChainTxHash?: string;
    blockchainNetwork?: string;
    rejectionReason?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ClaimSchema = new Schema<IClaim>(
    {
        policyId: {
            type: String,
            required: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        incidentTime: {
            type: Date,
            required: true,
        },
        incidentLocation: {
            type: String,
            required: true,
        },
        incidentDescription: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["received", "review", "approved", "rejected", "paid"],
            default: "received",
            index: true,
        },
        payoutAmountKES: {
            type: Number,
        },
        mediaUrls: {
            type: [String],
            default: [],
        },
        onChainClaimId: {
            type: String,
            index: true,
        },
        onChainTxHash: String,
        blockchainNetwork: String,
        rejectionReason: {
            type: String,
        },
        reviewedBy: {
            type: String,
        },
        reviewedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export const Claim = mongoose.model<IClaim>("Claim", ClaimSchema);
