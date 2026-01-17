import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    phoneNumber: string;
    firstName: string;
    lastName?: string;
    email?: string;
    role: "user" | "admin" | "lp";
    status: "active" | "blocked";

    // KYC Information (encrypted)
    kycStatus?: "pending" | "verified" | "rejected";
    kycData?: {
        fullName?: string;
        idNumber?: string;
        dateOfBirth?: string;
        plateNumber?: string;
        idPhotoBase64?: string;
        logbookPhotoBase64?: string;
        bikePhotoBase64?: string;
        selfiePhotoBase64?: string;
    };
    nationalId?: string; // Encrypted
    dateOfBirth?: Date;
    address?: string; // Encrypted
    idPhotoUrl?: string; // URL to encrypted storage
    kycVerifiedAt?: Date;
    kycDocuments?: Array<{
        type: string;
        url: string;
        uploadedAt: Date;
    }>;

    // Motorcycle Information (minimal for micro-insurance)
    motorcycleMake?: string;
    motorcycleModel?: string;
    motorcycleYear?: number;
    motorcycleValue?: number;
    registrationNumber?: string;
    selectedProductId?: string;
    plateNumber?: string; // Optional motorcycle plate number

    // Preferences
    preferredLanguage?: "en" | "sw"; // English or Swahili
    botLanguage?: "en" | "sw"; // Bot conversation language
    botConversationState?: string; // Current state in bot conversation

    // Coverage & Policy
    coverageType?: "basic" | "comprehensive" | "premium";
    quotedPrice?: number;
    policyStatus?: "pending" | "active" | "expired" | "cancelled";
    policyStartDate?: Date;
    policyEndDate?: Date;

    // Wallet Information (custodial)
    walletAddress?: string;
    walletPrivateKey?: string; // Encrypted private key
    walletCreatedAt?: Date;
    onChainRegistered?: boolean;
    registrationTxHash?: string;

    // Blockchain
    transactionHash?: string;

    // Conversation State
    conversationState?: string;
    registrationComplete?: boolean;

    // Authentication (OTP)
    lastLoginCode?: string | undefined;
    loginCodeExpires?: Date | undefined;

    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        role: {
            type: String,
            enum: ["user", "admin", "lp"],
            default: "user",
        },
        status: {
            type: String,
            enum: ["active", "blocked"],
            default: "active",
        },

        // KYC fields
        kycStatus: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
        },
        nationalId: String, // Encrypted
        dateOfBirth: Date,
        address: String, // Encrypted
        idPhotoUrl: String,
        kycVerifiedAt: Date,
        kycDocuments: [{
            type: {
                type: String,
            },
            url: String,
            uploadedAt: Date,
        }],

        // Motorcycle info
        motorcycleMake: String,
        motorcycleModel: String,
        motorcycleYear: Number,
        motorcycleValue: Number,
        registrationNumber: String,
        selectedProductId: String,
        plateNumber: String,

        // Preferences
        preferredLanguage: {
            type: String,
            enum: ["en", "sw"],
            default: "en",
        },
        botLanguage: {
            type: String,
            enum: ["en", "sw"],
            default: "en",
        },
        botConversationState: {
            type: String,
            default: "LANG_SELECT",
        },
        kycData: {
            type: Object,
            default: {},
        },

        // Coverage
        coverageType: {
            type: String,
            enum: ["basic", "comprehensive", "premium"],
        },
        quotedPrice: Number,
        policyStatus: {
            type: String,
            enum: ["pending", "active", "expired", "cancelled"],
            default: "pending",
        },
        policyStartDate: Date,
        policyEndDate: Date,

        // Wallet
        walletAddress: String,
        walletPrivateKey: String, // Encrypted
        walletCreatedAt: Date,
        onChainRegistered: { type: Boolean, default: false },
        registrationTxHash: String,
        transactionHash: String,

        // Conversation
        conversationState: {
            type: String,
            default: "initial",
        },
        registrationComplete: {
            type: Boolean,
            default: false,
        },

        // Authentication
        lastLoginCode: {
            type: String,
        },
        loginCodeExpires: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model<IUser>("User", UserSchema);
