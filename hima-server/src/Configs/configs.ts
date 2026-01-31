import dotenv from "dotenv";

dotenv.config();

function getConfig() {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8100;
    const dbUrl = process.env.MONGODB_URI || process.env.DB_URL || "mongodb://localhost:27017/hima";
    const jwtSecret = process.env.JWT_SECRET || "defaultsecret";
    const mongoDbUri = dbUrl;

    // Blockchain config - Mantle Testnet
    const rpcUrl = process.env.RPC_URL || "https://rpc.testnet.mantle.xyz";
    const contractAddress = process.env.INSURANCE_CONTRACT_ADDRESS || "";
    const privateKey = process.env.PRIVATE_KEY || "";
    const stableCoinAddress = process.env.USDC_ADDRESS || ""; // Will deploy test USDC
    const chainId = parseInt(process.env.CHAIN_ID || "5001", 10); // Mantle Testnet
    const explorerUrl = process.env.EXPLORER_URL || "https://explorer.testnet.mantle.xyz";
    const paymentGatewayUrl = process.env.PAYMENT_GATEWAY_URL || "";
    const dashboardUrl = process.env.DASHBOARD_URL || "https://hima-dashboard-ten.vercel.app";

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
        dashboardUrl,
        encryptionKey,
        admin: {
            email: adminEmail,
            password: adminPassword,
        },
        whatsapp: {
            apiVersion: "v22.0",
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "852829371256540",
            businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "879843564631752",
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
            verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "hima_secure_webhook_token_2026",
            testNumber: "+1 555 146 5823"
        },
        bot: {
            sessionName: process.env.BOT_SESSION_NAME || "hima-bot",
            headless: process.env.BOT_HEADLESS !== "false",
            qrTimeout: parseInt(process.env.BOT_QR_TIMEOUT || "60000", 10),
            sessionDataPath: process.env.BOT_SESSION_DATA_PATH || "./sessions"
        },
        mistral: {
            apiKey: process.env.MISTRAL_API_KEY || "",
            apiUrl: process.env.MISTRAL_API_URL || "https://api.mistral.ai/v1",
            model: process.env.MISTRAL_MODEL || "mistral-tiny"
        }
    };
}

const config = getConfig();
export default config;