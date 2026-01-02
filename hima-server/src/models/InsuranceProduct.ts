import mongoose, { Schema, Document } from "mongoose";

export interface IInsuranceProduct extends Document {
    name: string;
    description: string;
    premiumAmountKES: number;
    sumAssuredKES: number;
    coverageType: "trip" | "daily" | "weekly";
    tier: "basic" | "standard" | "plus";
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const InsuranceProductSchema = new Schema<IInsuranceProduct>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
        },
        premiumAmountKES: {
            type: Number,
            required: true,
        },
        sumAssuredKES: {
            type: Number,
            required: true,
        },
        coverageType: {
            type: String,
            enum: ["trip", "daily", "weekly"],
            required: true,
        },
        tier: {
            type: String,
            enum: ["basic", "standard", "plus"],
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export const InsuranceProduct = mongoose.model<IInsuranceProduct>("InsuranceProduct", InsuranceProductSchema);
