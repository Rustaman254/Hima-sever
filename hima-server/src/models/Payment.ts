import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
    userId: string;
    policyId?: string;
    claimId?: string;
    mpesaTransactionId: string;
    phoneNumber: string;
    amountKES: number;
    status: "pending" | "completed" | "failed";
    paymentType: "premium" | "claim_payout";
    rawCallbackPayload?: any;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
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
        claimId: {
            type: String,
            index: true,
        },
        mpesaTransactionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        amountKES: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
            index: true,
        },
        paymentType: {
            type: String,
            enum: ["premium", "claim_payout"],
            required: true,
        },
        rawCallbackPayload: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
