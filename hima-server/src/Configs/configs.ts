import dotenv from "dotenv";

dotenv.config();

function getConfig() {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8100;
    const dbUrl = process.env.MONGODB_URI || process.env.DB_URL || "mongodb://localhost:27017/hima";
    const jwtSecret = process.env.JWT_SECRET || "defaultsecret";
    const mongoDbUri = dbUrl;

    // ============================================
    // TWILIO WHATSAPP API (ACTIVE)
    // ============================================
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || "";
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || "";
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || ""; // Format: whatsapp:+14155238886

    // ============================================
    // WHATSAPP BUSINESS API (COMMENTED - KEPT FOR REFERENCE)
    // ============================================
    // const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
    // const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    // const whatsappBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "";
    // const whatsappWebhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "hima_webhook_verify_token";
    // const whatsappAppSecret = process.env.WHATSAPP_APP_SECRET || "";

    // Blockchain config - Mantle Testnet
    const rpcUrl = process.env.RPC_URL || "https://rpc.testnet.mantle.xyz";
    const contractAddress = process.env.INSURANCE_CONTRACT_ADDRESS || "";
    const privateKey = process.env.PRIVATE_KEY || "";
    const stableCoinAddress = process.env.USDC_ADDRESS || ""; // Will deploy test USDC
    const chainId = parseInt(process.env.CHAIN_ID || "5001", 10); // Mantle Testnet
    const explorerUrl = process.env.EXPLORER_URL || "https://explorer.testnet.mantle.xyz";
    const paymentGatewayUrl = process.env.PAYMENT_GATEWAY_URL || "";

    // Admin Credentials
    const adminEmail = process.env.ADMIN_EMAIL || "admin@hima.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "hima_admin_2026";

    // Security & Encryption
    const encryptionKey = process.env.ENCRYPTION_KEY || "default_encryption_key_change_in_production";

    return {
        port,
        dbUrl,
        mongoDbUri,
        jwtSecret,

        // Twilio WhatsApp (Active)
        twilioAccountSid,
        twilioAuthToken,
        twilioWhatsAppNumber,

        // WhatsApp Business API (Commented)
        // whatsappAccessToken,
        // whatsappPhoneNumberId,
        // whatsappBusinessAccountId,
        // whatsappWebhookVerifyToken,
        // whatsappAppSecret,

        blockchain: {
            rpcUrl,
            contractAddress,
            privateKey,
            stableCoinAddress,
            chainId,
            explorerUrl,
        },
        payment: {
            gatewayUrl: paymentGatewayUrl,
        },
        encryptionKey,
        admin: {
            email: adminEmail,
            password: adminPassword,
        }
    };
}

const config = getConfig();
export default config;