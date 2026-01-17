import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSettings extends Document {
    updatedAt: Date;
    createdAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
    {},
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
        settings = await this.create({});
    }

    return settings;
};

/**
 * Update system settings
 */
SystemSettingsSchema.statics.updateSettings = async function (
    provider: string,
    config: any
): Promise<ISystemSettings> {
    let settings = await this.findOne();

    if (!settings) {
        settings = await this.create({});
    } else {
        await settings.save();
    }

    return settings;
};

export interface ISystemSettingsModel extends mongoose.Model<ISystemSettings> {
    getSettings(): Promise<ISystemSettings>;
    updateSettings(provider: string, config: any): Promise<ISystemSettings>;
}

const SystemSettings = mongoose.model<ISystemSettings, ISystemSettingsModel>("SystemSettings", SystemSettingsSchema);

export default SystemSettings;
