import mongoose, { Schema, Document } from "mongoose";

export interface IPolicy extends Document {
    userId: string;
    productId: string;
    quoteId?: string;
    policyNumber: string;

    // Motorcycle details
    motorcycleMake?: string;
    motorcycleModel?: string;
    motorcycleYear?: number;
    registrationNumber?: string;

    // Coverage details
    coverageType: "basic" | "comprehensive" | "premium" | "trip" | "daily" | "weekly" | "monthly";
    tier?: string;
    premiumAmount: number;
    premiumAmountKES?: number; // Optional for backward compatibility
    sumAssuredKES?: number;

    // Policy period
    policyStartDate: Date;
    policyEndDate: Date;
    startTime?: Date;
    endTime?: Date;

    // Status
    paymentStatus: "pending" | "completed" | "failed";
    policyStatus: "pending" | "active" | "expired" | "claimed" | "cancelled";
    isClaimable: boolean;
    maturityDate: Date;

    // Blockchain tracking
    onChainTxHash?: string;
    transactionHash?: string; // Alias for onChainTxHash
    activationTxHash?: string;
    onChainPolicyId?: string;
    blockchainNetwork?: string;

    // Metadata
    offChainMetadata?: {
        quoteDetails?: any;
        userPreferences?: any;
        notes?: string;
        checkoutRequestID?: string;
    };

    createdAt: Date;
    updatedAt: Date;
}

const PolicySchema = new Schema<IPolicy>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        productId: {
            type: String,
            required: true,
        },
        quoteId: {
            type: String,
        },
        policyNumber: {
            type: String,
            unique: true,
            required: true,
        },
        motorcycleMake: String,
        motorcycleModel: String,
        motorcycleYear: Number,
        registrationNumber: String,
        coverageType: {
            type: String,
            required: true,
        },
        tier: String,
        premiumAmount: {
            type: Number,
            required: true,
        },
        premiumAmountKES: Number,
        sumAssuredKES: Number,
        policyStartDate: {
            type: Date,
            required: true,
        },
        policyEndDate: {
            type: Date,
            required: true,
        },
        startTime: Date,
        endTime: Date,
        paymentStatus: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
        },
        policyStatus: {
            type: String,
            enum: ["pending", "active", "expired", "claimed", "cancelled"],
            default: "pending",
        },
        isClaimable: {
            type: Boolean,
            default: false,
        },
        maturityDate: {
            type: Date,
            required: true,
        },
        onChainTxHash: String,
        transactionHash: String,
        activationTxHash: String,
        onChainPolicyId: String,
        blockchainNetwork: String,
        offChainMetadata: {
            quoteDetails: Schema.Types.Mixed,
            userPreferences: Schema.Types.Mixed,
            notes: String,
        },
    },
    {
        timestamps: true,
    }
);

export const Policy = mongoose.model<IPolicy>("Policy", PolicySchema);
