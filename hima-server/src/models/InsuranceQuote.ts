import mongoose, { Schema, Document } from "mongoose";

export interface IInsuranceQuote extends Document {
    userId: string;
    motorcycleMake: string;
    motorcycleModel: string;
    motorcycleYear: number;
    registrationNumber: string;
    motorcycleValue: number;
    coverageType: "basic" | "comprehensive" | "premium";
    basePremium: number;
    taxes: number;
    totalPrice: number;
    priceInUSD: number;
    validUntil: Date;
    isAccepted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const InsuranceQuoteSchema = new Schema<IInsuranceQuote>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        motorcycleMake: {
            type: String,
            required: true,
        },
        motorcycleModel: {
            type: String,
            required: true,
        },
        motorcycleYear: {
            type: Number,
            required: true,
        },
        registrationNumber: {
            type: String,
            required: true,
        },
        motorcycleValue: {
            type: Number,
            required: true,
        },
        coverageType: {
            type: String,
            enum: ["basic", "comprehensive", "premium"],
            required: true,
        },
        basePremium: {
            type: Number,
            required: true,
        },
        taxes: {
            type: Number,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        priceInUSD: {
            type: Number,
            required: true,
        },
        validUntil: {
            type: Date,
            required: true,
        },
        isAccepted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export const InsuranceQuote = mongoose.model<IInsuranceQuote>(
    "InsuranceQuote",
    InsuranceQuoteSchema
);
