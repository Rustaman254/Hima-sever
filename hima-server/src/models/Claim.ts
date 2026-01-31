import mongoose, { Schema, Document } from "mongoose";

export interface IClaim extends Document {
    userId: string;
    policyId: string; // Added missing field
    claimNumber: string;
    onChainClaimId?: string; // Added missing field
    incidentTime: Date;
    incidentLocation: string;
    incidentDescription: string;
    bikePhotoBase64?: string;
    damagePhotoBase64?: string;
    policeAbstractBase64?: string;
    status: "received" | "review" | "approved" | "rejected" | "paid" | "submitted";
    payoutAmountKES?: number;
    mediaUrls: string[];
    rejectionReason?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ClaimSchema = new Schema<IClaim>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        policyId: {
            type: String,
            required: true,
            index: true,
        },
        claimNumber: {
            type: String,
            required: true,
            unique: true,
        },
        onChainClaimId: {
            type: String,
            sparse: true,
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
        bikePhotoBase64: String,
        damagePhotoBase64: String,
        policeAbstractBase64: String,
        status: {
            type: String,
            enum: ["received", "review", "approved", "rejected", "paid", "submitted"],
            default: "submitted",
            index: true,
        },
        payoutAmountKES: {
            type: Number,
        },
        mediaUrls: {
            type: [String],
            default: [],
        },
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
