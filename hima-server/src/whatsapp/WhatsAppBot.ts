/*
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg as any;
import qrcode from "qrcode-terminal";
import ConversationManager from "./ConversationManager.js";

export class WhatsAppBot {
    private client: any;
    private isReady: boolean = false;

    constructor() {
        const puppeteerExecPath = process.env.PUPPETEER_EXEC_PATH || process.env.CHROME_PATH || undefined;
        const puppeteerOptions: any = {
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        };
        if (puppeteerExecPath) {
            puppeteerOptions.executablePath = puppeteerExecPath;
            console.log("Using Chrome executable:", puppeteerExecPath);
        } else {
            console.log("No Chrome executable path provided; puppeteer will attempt to download Chromium or use bundled browser.");
        }

        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: puppeteerOptions,
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.client.on("qr", (qr: any) => {
            console.log("\n📱 Scan this QR code with WhatsApp to authenticate:");
            qrcode.generate(qr, { small: true });
        });

        this.client.on("ready", () => {
            console.log("✅ WhatsApp Bot is ready!");
            this.isReady = true;
        });

        this.client.on("message", async (message: any) => {
            try {
                await this.handleMessage(message);
            } catch (error) {
                console.error("Error handling message:", error);
            }
        });

        this.client.on("disconnected", (reason: any) => {
            console.log("⚠️  WhatsApp Bot disconnected:", reason);
            this.isReady = false;
        });
    }

    private async handleMessage(message: any): Promise<void> {
        // Ignore group messages and media
        if (message.from.includes("@g.us") || message.type !== "chat") {
            return;
        }

        // Get user phone number from message
        const phoneNumber = message.from.split("@")[0];

        // Get response from conversation manager
        const response = await ConversationManager.handleUserMessage(
            phoneNumber,
            message.body
        );

        // Send response back
        await message.reply(response);
    }

    async start(): Promise<void> {
        try {
            console.log("🚀 Starting Hima Connect WhatsApp Bot...");
            await this.client.initialize();
        } catch (error) {
            console.error("Error starting WhatsApp Bot:", error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        try {
            await this.client.destroy();
            console.log("🛑 WhatsApp Bot stopped");
        } catch (error) {
            console.error("Error stopping WhatsApp Bot:", error);
            throw error;
        }
    }

    isConnected(): boolean {
        return this.isReady;
    }
}
*/

// SWITCHED TO META WHATSAPP (WEBHOOK MODE)
// Primary interaction is now handled via the Meta /webhook endpoint.

export class WhatsAppBot {
    async start() { console.log("Hima Bot: Using Meta WhatsApp Provider (Webhook Mode)"); }
    async stop() { }
    isConnected() { return true; }
}

export default WhatsAppBot;
