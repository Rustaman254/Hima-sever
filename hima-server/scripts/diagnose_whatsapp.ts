import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

/**
 * Diagnostic script to test WhatsApp Business API configuration
 */
async function diagnoseWhatsApp() {
    console.log("🔍 WhatsApp Business API Diagnostic Tool\n");
    console.log("=".repeat(60));

    // Check environment variables
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    console.log("\n📋 Configuration Check:");
    console.log(`   Access Token: ${accessToken ? `${accessToken.substring(0, 20)}...` : "❌ MISSING"}`);
    console.log(`   Phone Number ID: ${phoneNumberId || "❌ MISSING"}`);
    console.log(`   Business Account ID: ${businessAccountId || "❌ MISSING"}`);
    console.log(`   Webhook Verify Token: ${webhookVerifyToken || "❌ MISSING"}`);

    if (!accessToken || !phoneNumberId) {
        console.log("\n❌ ERROR: Missing required configuration!");
        console.log("   Please check your .env file and ensure:");
        console.log("   - WHATSAPP_ACCESS_TOKEN is set");
        console.log("   - WHATSAPP_PHONE_NUMBER_ID is set");
        process.exit(1);
    }

    // Test 1: Verify Phone Number ID
    console.log("\n" + "=".repeat(60));
    console.log("🧪 Test 1: Verify Phone Number ID");
    console.log("=".repeat(60));

    try {
        const response = await axios.get(
            `https://graph.facebook.com/v22.0/${phoneNumberId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        console.log("✅ Phone Number ID is valid");
        console.log(`   Display Name: ${response.data.display_phone_number || "N/A"}`);
        console.log(`   Verified Name: ${response.data.verified_name || "N/A"}`);
        console.log(`   Quality Rating: ${response.data.quality_rating || "N/A"}`);
    } catch (error: any) {
        console.log("❌ Phone Number ID verification failed");
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }

    // Test 2: Send a test message
    console.log("\n" + "=".repeat(60));
    console.log("🧪 Test 2: Test Message Sending");
    console.log("=".repeat(60));

    const testPhoneNumber = process.argv[2] || process.env.TEST_PHONE_NUMBER || "254712345678";
    console.log(`   Attempting to send test message to: ${testPhoneNumber}`);
    console.log(`   Note: This number must be added to your Meta sandbox allowed list`);

    try {
        const response = await axios.post(
            `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: testPhoneNumber,
                type: "text",
                text: {
                    preview_url: false,
                    body: "🧪 Test message from Hima Insurance diagnostic tool",
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        console.log("✅ Test message sent successfully!");
        console.log(`   Message ID: ${response.data.messages?.[0]?.id}`);
    } catch (error: any) {
        console.log("❌ Test message failed");
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error Code: ${error.response.data?.error?.code}`);
            console.log(`   Error Message: ${error.response.data?.error?.message}`);
            console.log(`   Error Type: ${error.response.data?.error?.type}`);
            console.log(`   Full Error: ${JSON.stringify(error.response.data, null, 2)}`);

            // Provide helpful suggestions
            if (error.response.status === 400) {
                console.log("\n💡 Suggestions:");
                if (error.response.data?.error?.code === 131030) {
                    console.log("   ⚠️  SANDBOX RESTRICTION DETECTED");
                    console.log("   - You're in sandbox mode. Add recipient to allowed list in Meta Developer Portal");
                    console.log("   - Steps to fix:");
                    console.log("     1. Go to: https://developers.facebook.com/apps");
                    console.log("     2. Select your app");
                    console.log("     3. Navigate to: WhatsApp > API Setup");
                    console.log("     4. Scroll to 'To' section and click 'Manage phone number list'");
                    console.log(`     5. Add ${testPhoneNumber} and verify it via WhatsApp`);
                    console.log("   - See WHATSAPP_SETUP.md for detailed instructions");
                } else if (error.response.data?.error?.code === 100) {
                    console.log("   - Invalid phone number format");
                    console.log("   - Ensure number includes country code (e.g., 254712345678)");
                    console.log(`   - Try: npx tsx scripts/diagnose_whatsapp.ts 254712345678`);
                } else if (error.response.data?.error?.message?.includes("template")) {
                    console.log("   - Template message required for this account");
                    console.log("   - You may need to use approved message templates");
                }
            } else if (error.response.status === 401) {
                console.log("\n💡 Suggestions:");
                console.log("   - Access token is invalid or expired");
                console.log("   - Generate a new token from Meta Developer Portal");
            } else if (error.response.status === 404) {
                console.log("\n💡 Suggestions:");
                console.log("   - Phone Number ID is incorrect");
                console.log("   - Verify the ID in Meta Developer Portal");
            }
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }

    // Test 3: Test Interactive Button Message
    console.log("\n" + "=".repeat(60));
    console.log("🧪 Test 3: Test Interactive Button Message");
    console.log("=".repeat(60));

    try {
        const response = await axios.post(
            `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: testPhoneNumber,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: {
                        text: "🧪 Test interactive buttons",
                    },
                    action: {
                        buttons: [
                            {
                                type: "reply",
                                reply: {
                                    id: "btn_0",
                                    title: "Option 1",
                                },
                            },
                            {
                                type: "reply",
                                reply: {
                                    id: "btn_1",
                                    title: "Option 2",
                                },
                            },
                        ],
                    },
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        console.log("✅ Interactive button message sent successfully!");
        console.log(`   Message ID: ${response.data.messages?.[0]?.id}`);
    } catch (error: any) {
        console.log("❌ Interactive button message failed");
        if (error.response?.data?.error?.code === 131030) {
            console.log(`   → Sandbox restriction: Add ${testPhoneNumber} to allowed list`);
        } else {
            console.log(`   → Error: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    // Test 4: Check Business Account
    if (businessAccountId) {
        console.log("\n" + "=".repeat(60));
        console.log("🧪 Test 4: Verify Business Account");
        console.log("=".repeat(60));

        try {
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${businessAccountId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            console.log("✅ Business Account is valid");
            console.log(`   Name: ${response.data.name || "N/A"}`);
            console.log(`   ID: ${response.data.id}`);
        } catch (error: any) {
            console.log("❌ Business Account verification failed");
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
            }
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Diagnostic complete!");
    console.log("=".repeat(60));

    console.log("\n📚 Next Steps:");
    console.log("   1. If you see sandbox restrictions, add phone numbers to Meta allowed list");
    console.log("   2. See WHATSAPP_SETUP.md for detailed setup instructions");
    console.log("   3. Run this script with a phone number: npx tsx scripts/diagnose_whatsapp.ts 254712345678");
    console.log("   4. Test the full flow by sending 'hi' to your WhatsApp Business number");
}

diagnoseWhatsApp().catch(console.error);
