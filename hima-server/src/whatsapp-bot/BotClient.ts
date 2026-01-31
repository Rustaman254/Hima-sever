/**
 * WhatsApp Bot Client using @open-wa/wa-automate
 * Handles session management, QR authentication, and message sending
 */

import { create, Client } from '@open-wa/wa-automate';
import type { Message, Chat, ConfigObject } from '@open-wa/wa-automate';
import config from '../Configs/configs.js';
import { fileLogger } from '../libs/fileLogger.js';
import * as fs from 'fs';
import * as path from 'path';

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

            // Helper to find Chrome executable
            const getChromePath = () => {
                // First check if PUPPETEER_EXECUTABLE_PATH is set
                if (process.env.PUPPETEER_EXECUTABLE_PATH) {
                    if (fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
                        fileLogger.log(`✅ [BOT] Using PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
                        return process.env.PUPPETEER_EXECUTABLE_PATH;
                    } else {
                        fileLogger.log(`⚠️ [BOT] PUPPETEER_EXECUTABLE_PATH set but file not found: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
                    }
                }

                // Check common Puppeteer cache locations
                const cacheDirs = [
                    process.env.PUPPETEER_CACHE_DIR,
                    '/opt/render/.cache/puppeteer',
                    path.join(process.cwd(), '.puppeteer'),
                    config.bot?.sessionDataPath ? path.join(config.bot.sessionDataPath, '../.puppeteer') : null
                ].filter(Boolean);

                for (const cacheDir of cacheDirs) {
                    if (!cacheDir || !fs.existsSync(cacheDir)) {
                        continue;
                    }

                    fileLogger.log(`🔍 [BOT] Checking cache dir: ${cacheDir}`);

                    // Try to find chrome binary
                    // Structure: chrome/linux-<version>/chrome-linux64/chrome
                    const chromeDir = path.join(cacheDir, 'chrome');
                    if (fs.existsSync(chromeDir)) {
                        try {
                            const platforms = fs.readdirSync(chromeDir);
                            fileLogger.log(`📁 [BOT] Found platforms in ${chromeDir}: ${platforms.join(', ')}`);

                            for (const platform of platforms) {
                                if (platform.startsWith('linux-')) {
                                    const binaryPath = path.join(chromeDir, platform, 'chrome-linux64', 'chrome');
                                    if (fs.existsSync(binaryPath)) {
                                        fileLogger.log(`✅ [BOT] Found Chrome at: ${binaryPath}`);
                                        return binaryPath;
                                    } else {
                                        fileLogger.log(`⚠️ [BOT] Chrome binary not found at expected path: ${binaryPath}`);
                                    }
                                }
                            }
                        } catch (error) {
                            fileLogger.log(`⚠️ [BOT] Error reading chrome dir: ${error}`);
                        }
                    } else {
                        fileLogger.log(`⚠️ [BOT] Chrome dir not found: ${chromeDir}`);
                    }
                }

                fileLogger.log(`⚠️ [BOT] No Chrome installation found in any cache directory`);
                return undefined;
            };

            const executablePath = getChromePath();
            if (executablePath) {
                fileLogger.log(`🚀 [BOT] Using custom executable path: ${executablePath}`);
            } else {
                fileLogger.log(`⚠️ [BOT] No custom Chrome path found, using default`);
            }

            const clientConfig: ConfigObject = {
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
                skipBrokenMethodsCheck: false,
                cacheEnabled: true,
                safeMode: true,

                // Session management
                killProcessOnBrowserClose: true,
                throwErrorOnTosBlock: false,

                // IMPORTANT: Set useChrome to true when we have executablePath
                useChrome: !!executablePath,

                // Chrome args - remove the ones causing issues with multi-device
                chromiumArgs: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-infobars',
                    '--window-size=1280,720'
                ]
            };

            // Only add executablePath if we found one
            if (executablePath) {
                clientConfig.executablePath = executablePath;
            }

            this.client = await create(clientConfig);

            // Set up event handlers
            this.client.onMessage(async (message: Message) => {
                try {
                    // Only process messages from users (not from bot itself)
                    if (!message.fromMe && (message.type === 'chat' || message.type === 'image')) {
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
        // Return the full chat ID to preserve @lid or @c.us for proper routing and license compliance
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