const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Configure dotenv
dotenv.config();

const SystemSettingsSchema = new mongoose.Schema({}, { timestamps: true });

const SystemSettings = mongoose.model('SystemSettings', SystemSettingsSchema);

async function seedSettings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hima');
        console.log("Connected to MongoDB");

        const settings = await SystemSettings.findOneAndUpdate(
            {},
            {},
            { upsert: true, new: true }
        );

        console.log("✅ System Settings initialized");
        console.log(settings);

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error seeding settings:", error);
    }
}

seedSettings();
