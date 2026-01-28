/**
 * WhatsApp Bot Client using @open-wa/wa-automate
 * Handles session management, QR authentication, and message sending
 */

import { create, Client } from '@open-wa/wa-automate';
import type { Message, Chat } from '@open-wa/wa-automate';
import config from '../Configs/configs.js';
import { fileLogger } from '../libs/fileLogger.js';

export class BotClient {
    private static instance: BotClient;
    private client: Client | null = null;
    private isReady: boolean = false;

    private constructor() { }

    public static getInstance(): BotClient {
        if (!BotClient.instance) {
            BotClient.instance = new BotClient();
        }
        return BotClient.instance;
    }

    /**
     * Initialize the WhatsApp bot client
     * @param onMessage - Callback function to handle incoming messages
     */
    public async initialize(onMessage: (message: Message) => Promise<void>): Promise<void> {
        try {
            fileLogger.log('🤖 [BOT] Initializing WhatsApp bot...');

            this.client = await create({
                sessionId: config.bot?.sessionName || 'hima-bot',
                headless: true, // Force headless on server
                qrTimeout: config.bot?.qrTimeout || 60000,
                authTimeout: 60000,
                disableSpins: true,
                logConsole: false,
                popup: false,
                sessionDataPath: config.bot?.sessionDataPath || './sessions',
                qrRefreshS: 15,

                // Callbacks
                qrLogSkip: false,

                // Performance optimizations
                skipBrokenMethodsCheck: true,
                cacheEnabled: false,

                // Session management
                killProcessOnBrowserClose: true,
                throwErrorOnTosBlock: false,
                // Ensure we use the installed Chrome
                useChrome: false,
                chromiumArgs: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            });

            // Set up event handlers
            this.client.onMessage(async (message: Message) => {
                try {
                    // Only process messages from users (not from bot itself)
                    if (!message.fromMe && message.type === 'chat' || message.type === 'image') {
                        await onMessage(message);
                    }
                } catch (error) {
                    fileLogger.log(`❌ [BOT] Error processing message: ${error}`, 'ERROR');
                }
            });

            this.client.onStateChanged((state: string) => {
                fileLogger.log(`🔄 [BOT] State changed: ${state}`);
                if (state === 'CONNECTED') {
                    this.isReady = true;
                    fileLogger.log('✅ [BOT] Bot is ready and connected!');
                }
            });

            this.isReady = true;
            fileLogger.log('✅ [BOT] WhatsApp bot initialized successfully');
        } catch (error) {
            fileLogger.log(`❌ [BOT] Failed to initialize bot: ${error}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Send a text message
     * @param to - Phone number (format: 254XXXXXXXXX@c.us)
     * @param text - Message text
     */
    public async sendText(to: string, text: string): Promise<void> {
        if (!this.client || !this.isReady) {
            throw new Error('Bot client is not ready');
        }

        try {
            const chatId = this.formatChatId(to);
            await this.client.sendText(chatId as any, text);
            fileLogger.log(`📤 [BOT] Sent text to ${to}`);
        } catch (error) {
            fileLogger.log(`❌ [BOT] Error sending text: ${error}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Send a message with options (text-based, no buttons)
     * @param to - Phone number
     * @param body - Message body text
     * @param buttons - Array of button objects with id and text
     */
    public async sendButtons(
        to: string,
        body: string,
        buttons: Array<{ id: string; text: string }>,
        title?: string,
        footer?: string
    ): Promise<void> {
        if (!this.client || !this.isReady) {
            throw new Error('Bot client is not ready');
        }

        try {
            // Use text-based menu instead of buttons (buttons require Insiders license)
            const optionsText = buttons.map((btn, i) => `${i + 1}. ${btn.text}`).join('\n');
            const fullMessage = `${title ? title + '\n\n' : ''}${body}\n\n${optionsText}${footer ? '\n\n' + footer : ''}`;

            await this.sendText(to, fullMessage);
            fileLogger.log(`📤 [BOT] Sent options menu to ${to}`);
        } catch (error) {
            fileLogger.log(`❌ [BOT] Error sending options: ${error}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Send an image
     * @param to - Phone number
     * @param imageUrl - URL or base64 of the image
     * @param caption - Optional caption
     */
    public async sendImage(to: string, imageUrl: string, caption?: string): Promise<void> {
        if (!this.client || !this.isReady) {
            throw new Error('Bot client is not ready');
        }

        try {
            const chatId = this.formatChatId(to);
            await this.client.sendImage(chatId as any, imageUrl, 'image.jpg', caption || '');
            fileLogger.log(`📤 [BOT] Sent image to ${to}`);
        } catch (error) {
            fileLogger.log(`❌ [BOT] Error sending image: ${error}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Download media from a message
     * @param message - Message object containing media
     * @returns Base64 encoded media data
     */
    public async downloadMedia(message: Message): Promise<string> {
        if (!this.client || !this.isReady) {
            throw new Error('Bot client is not ready');
        }

        try {
            // Try to decrypt media
            const mediaData = await this.client.decryptMedia(message);
            fileLogger.log(`✅ [BOT] Media downloaded successfully`);
            return mediaData;
        } catch (error) {
            fileLogger.log(`⚠️ [BOT] Error downloading media with decryptMedia: ${error}`, 'WARN');

            // Fallback: Try alternative method
            try {
                // For some media types, we can use the message ID
                if (message.id) {
                    const mediaData = await this.client.decryptMedia(message);
                    return mediaData;
                }
                throw new Error('No media ID available');
            } catch (fallbackError) {
                fileLogger.log(`❌ [BOT] Fallback media download also failed: ${fallbackError}`, 'ERROR');
                // Return a placeholder or throw
                throw new Error('Failed to download media. Please try sending the image again.');
            }
        }
    }

    /**
     * Format phone number to WhatsApp chat ID
     * @param phoneNumber - Phone number (can be with or without @c.us or @lid)
     * @returns Formatted chat ID
     */
    private formatChatId(phoneNumber: string): string {
        // If it already has @ (like @c.us or @lid), return as is
        if (phoneNumber.includes('@')) {
            return phoneNumber;
        }

        // Remove any non-digit characters
        const cleaned = phoneNumber.replace(/\D/g, '');

        // Add @c.us suffix for regular numbers
        return `${cleaned}@c.us`;
    }

    /**
     * Extract phone number from chat ID
     * @param chatId - Chat ID (e.g., 254XXXXXXXXX@c.us or 97826621157619@lid)
     * @returns Full chat ID (preserving @lid or @c.us for proper routing)
     */
    public extractPhoneNumber(chatId: string): string {
        // Return the full chat ID to preserve @lid or @c.us
        return chatId;
    }

    /**
     * Check if bot is ready
     */
    public isClientReady(): boolean {
        return this.isReady && this.client !== null;
    }

    /**
     * Gracefully close the bot client
     */
    public async close(): Promise<void> {
        if (this.client) {
            try {
                await this.client.kill();
                fileLogger.log('🛑 [BOT] Bot client closed gracefully');
            } catch (error) {
                fileLogger.log(`❌ [BOT] Error closing bot: ${error}`, 'ERROR');
            }
        }
    }
}

export default BotClient.getInstance();
