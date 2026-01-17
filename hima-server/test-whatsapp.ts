import WhatsAppClient from "./src/whatsapp/WhatsAppClient.js";

async function testWhatsApp() {
    console.log("🚀 Starting WhatsApp Integration Test");

    // Config check
    console.log("Config Check:");
    console.log("- Phone Number ID:", "852829371256540");
    console.log("- Business ID:", "879843564631752");

    // Test Number
    const testNumber = process.env.TEST_NUMBER || "254710865696"; // Hardcoded from user prompt example logic if needed, or use safe default

    try {
        console.log(`📤 Sending test message to ${testNumber}...`);

        // Test 1: Simple Text
        const textRes = await WhatsAppClient.sendTextMessage(testNumber, "Hello! This is a test message from Hima Insurance (v22.0 Integration).");
        console.log("✅ Text Message Sent:", textRes.messages ? textRes.messages[0].id : textRes);

        // Test 2: Template (as per user optional request, if valid)
        // Note: 'jaspers_market_image_cta_v1' is a sample template, might not exist in this account.
        // We will try a standard 'hello_world' if available or just skip if we passed text test.
        try {
            console.log(`📤 Sending template message 'hello_world' to ${testNumber}...`);
            const tmplRes = await WhatsAppClient.sendTemplateMessage(testNumber, "hello_world", "en_US");
            console.log("✅ Template Message Sent:", tmplRes.messages ? tmplRes.messages[0].id : tmplRes);
        } catch (e) {
            console.log("⚠️ Template 'hello_world' might not exist or failed:", e.message);
        }

    } catch (error: any) {
        console.error("❌ Test Failed:", error.message);
        if (error.response) {
            console.error("DEBUG Data:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testWhatsApp();
