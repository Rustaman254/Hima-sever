import mongoose, { Schema, Document } from "mongoose";

export type WhatsAppProvider = "meta";

export interface IWhatsAppConfig {
    // Meta WhatsApp Business API Configuration
    metaAccessToken?: string;
    metaPhoneNumberId?: string;
    metaBusinessAccountId?: string;
    metaWebhookVerifyToken?: string;
}

export interface ISystemSettings extends Document {
    whatsappProvider: WhatsAppProvider;
    whatsappConfig: IWhatsAppConfig;
    updatedAt: Date;
    createdAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
    {
        whatsappProvider: {
            type: String,
            enum: ["meta"],
            default: "meta",
            required: true,
        },
        whatsappConfig: {
            // Meta
            metaAccessToken: { type: String },
            metaPhoneNumberId: { type: String },
            metaBusinessAccountId: { type: String },
            metaWebhookVerifyToken: { type: String },
        },
    },
    {
        timestamps: true,
    }
);

// Ensure only one settings document exists (singleton pattern)
SystemSettingsSchema.index({}, { unique: true });

/**
 * Get or create system settings
 */
SystemSettingsSchema.statics.getSettings = async function (): Promise<ISystemSettings> {
    let settings = await this.findOne();

    if (!settings) {
        // Create default settings from environment variables
        settings = await this.create({
            whatsappProvider: "meta",
            whatsappConfig: {
                metaAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
                metaPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
                metaBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
                metaWebhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "hima_webhook_verify_token",
            },
        });
    }

    return settings;
};

/**
 * Update system settings
 */
SystemSettingsSchema.statics.updateSettings = async function (
    provider: WhatsAppProvider,
    config: IWhatsAppConfig
): Promise<ISystemSettings> {
    let settings = await this.findOne();

    if (!settings) {
        settings = await this.create({
            whatsappProvider: provider,
            whatsappConfig: config,
        });
    } else {
        settings.whatsappProvider = provider;
        settings.whatsappConfig = { ...settings.whatsappConfig, ...config };
        await settings.save();
    }

    return settings;
};

export interface ISystemSettingsModel extends mongoose.Model<ISystemSettings> {
    getSettings(): Promise<ISystemSettings>;
    updateSettings(provider: WhatsAppProvider, config: IWhatsAppConfig): Promise<ISystemSettings>;
}

const SystemSettings = mongoose.model<ISystemSettings, ISystemSettingsModel>("SystemSettings", SystemSettingsSchema);

export default SystemSettings;
