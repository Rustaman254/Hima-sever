
import dotenv from "dotenv";
import WhatsAppBusinessClient from "../src/whatsapp/WhatsAppBusinessClient.ts";
import mongoose from "mongoose";
import SystemSettings from "../src/models/SystemSettings.ts";

dotenv.config();

async function debug() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const testNumber = process.argv[2] || process.env.TEST_PHONE_NUMBER;

    console.log("🔍 Debugging WhatsApp Reply Flow...");
    console.log(`📱 Target Number: ${testNumber}`);
    console.log(`🔑 Token (last 10 chars): ...${token?.substring(token.length - 10)}`);
    console.log(`📞 Phone ID: ${phoneId}`);

    if (!token || !phoneId || !testNumber) {
        console.error("❌ Missing configuration. Check .env and provide a phone number.");
        process.exit(1);
    }

    // 1. Check Database Settings
    try {
        console.log("\n📡 Checking Database Settings...");
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/hima");
        const settings = await SystemSettings.findOne();
        if (settings) {
            console.log("✅ DB Settings Found");
            const dbToken = settings.whatsappConfig?.metaAccessToken;
            console.log(`🔗 DB Token Match: ${dbToken === token ? "YES ✅" : "NO ❌"}`);
            if (dbToken !== token) {
                console.log(`   - DB Token (last 10): ...${dbToken?.substring((dbToken?.length || 10) - 10)}`);
            }
        } else {
            console.log("ℹ️ No DB Settings found. Factory will default to .env");
        }
    } catch (dbErr) {
        console.warn("⚠️ Could not check DB settings (is MongoDB running?)");
    } finally {
        await mongoose.disconnect();
    }

    const client = new WhatsAppBusinessClient(token, phoneId);

    // 2. Test Plain Text Message (Like Admin/OTP fallback)
    console.log("\n🧪 Test 1: Sending Plain Text Message...");
    try {
        const textResult = await client.sendTextMessage(testNumber, "Hello from Hima Debug! This is a plain text message.");
        console.log("✅ Plain Text Sent Successfully!", textResult.messageId);
    } catch (err: any) {
        console.error("❌ Plain Text Failed");
        console.error(`   - Status: ${err.response?.status}`);
        console.error(`   - Error:`, JSON.stringify(err.response?.data?.error || err.message, null, 2));
    }

    // 3. Test Button Message (Like Bot Greeting)
    console.log("\n🧪 Test 2: Sending Interactive Button Message...");
    try {
        const btnResult = await client.sendButtonMessage(testNumber, "Are you ready to join Hima?", ["Register Now"]);
        console.log("✅ Button Message Sent Successfully!", btnResult.messageId);
    } catch (err: any) {
        console.error("❌ Button Message Failed");
        console.error(`   - Status: ${err.response?.status}`);
        console.error(`   - Error:`, JSON.stringify(err.response?.data?.error || err.message, null, 2));
    }

    console.log("\n🏁 Debug Complete.");
    process.exit(0);
}

debug();
