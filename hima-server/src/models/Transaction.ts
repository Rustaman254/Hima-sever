import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
    userId: string;
    policyId?: string;
    txHash: string;
    blockNumber?: number;
    type: "payment" | "activation" | "claim" | "refund";
    amount: number;
    currency: "USDC" | "MNT";
    status: "pending" | "confirmed" | "failed";
    network: "mantle-testnet" | "mantle-mainnet";
    fromAddress: string;
    toAddress: string;
    gasUsed?: number;
    gasFee?: number;
    metadata?: {
        policyNumber?: string;
        claimId?: string;
        notes?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        policyId: {
            type: String,
            index: true,
        },
        txHash: {
            type: String,
            required: true,
            unique: true,
        },
        blockNumber: Number,
        type: {
            type: String,
            enum: ["payment", "activation", "claim", "refund"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            enum: ["USDC", "MNT"],
            default: "USDC",
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "failed"],
            default: "pending",
        },
        network: {
            type: String,
            enum: ["mantle-testnet", "mantle-mainnet"],
            default: "mantle-testnet",
        },
        fromAddress: {
            type: String,
            required: true,
        },
        toAddress: {
            type: String,
            required: true,
        },
        gasUsed: Number,
        gasFee: Number,
        metadata: {
            policyNumber: String,
            claimId: String,
            notes: String,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });

export const Transaction = mongoose.model<ITransaction>("Transaction", TransactionSchema);
