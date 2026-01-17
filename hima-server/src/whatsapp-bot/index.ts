/**
 * WhatsApp Bot Initialization Module
 * Starts the bot and registers message handlers
 */

import BotClient from './BotClient.js';
import BotConversationManager from './BotConversationManager.js';
import { fileLogger } from '../libs/fileLogger.js';

/**
 * Start the WhatsApp bot
 */
export async function startBot(): Promise<void> {
    try {
        fileLogger.log('🚀 [BOT] Starting WhatsApp bot...');

        // Initialize bot client with message handler
        await BotClient.initialize(async (message) => {
            await BotConversationManager.handleMessage(message);
        });

        fileLogger.log('✅ [BOT] WhatsApp bot started successfully');
    } catch (error) {
        fileLogger.log(`❌ [BOT] Failed to start bot: ${error}`, 'ERROR');
        throw error;
    }
}

/**
 * Stop the WhatsApp bot gracefully
 */
export async function stopBot(): Promise<void> {
    try {
        fileLogger.log('🛑 [BOT] Stopping WhatsApp bot...');
        await BotClient.close();
        fileLogger.log('✅ [BOT] WhatsApp bot stopped');
    } catch (error) {
        fileLogger.log(`❌ [BOT] Error stopping bot: ${error}`, 'ERROR');
    }
}
