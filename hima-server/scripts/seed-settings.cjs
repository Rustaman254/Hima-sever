const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Configure dotenv
dotenv.config();

const SystemSettingsSchema = new mongoose.Schema({
    whatsappProvider: { type: String, default: "twilio" },
    whatsappConfig: {
        twilioAccountSid: String,
        twilioAuthToken: String,
        twilioWhatsAppNumber: String,
        metaAccessToken: String,
        metaPhoneNumberId: String,
        metaBusinessAccountId: String,
        metaWebhookVerifyToken: String
    },
}, { timestamps: true });

const SystemSettings = mongoose.model('SystemSettings', SystemSettingsSchema);

async function seedSettings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hima');
        console.log("Connected to MongoDB");

        const config = {
            metaAccessToken: "EAAMu0yPDPZCcBQS2W8jicZB4EC6sUhVq4H7M9JaNRwwdWqVRxPDL8JtvoyaKOfLwsUqVJiXvLwQdZCVErS52ZC4HazpLrCmDlaAxeLjD7QbZAbKVWM9nqToSRoXQkf96G4u9WHoUVU3ZAxWS5CXnQTlZCdrPHgBPvruYXsnPPBEFiWx30yf8LijtDQj13wIuBb37yxet6AlrrHPGlk5ZBWCdi0HA0upehQu1hBYLHJVWTUpH4PsxUBA1spM0Vk6OtBZBqIhPNjYmdhUdPhR50SMFZAINbBqa29QDjcFKCrrQZDZD",
            metaPhoneNumberId: "879843564631752", // Using Business Account ID as placeholder if needed
            metaBusinessAccountId: "879843564631752",
            metaWebhookVerifyToken: "hima_webhook_verify_token",
            twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
            twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
            twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER || ""
        };

        const settings = await SystemSettings.findOneAndUpdate(
            {},
            {
                whatsappProvider: "meta",
                whatsappConfig: config
            },
            { upsert: true, new: true }
        );

        console.log("✅ WhatsApp Settings initialized with Meta provider");
        console.log(settings);

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error seeding settings:", error);
    }
}

seedSettings();
