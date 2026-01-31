/**
 * Bot Conversation Manager - State machine for WhatsApp bot interactions
 * Handles all conversation flows for HIMA boda boda insurance
 */

import type { Message } from '@open-wa/wa-automate';
import BotClient from './BotClient.js';
import { t, getUserLanguage, type Language } from './translations.js';
import { User, type IUser } from '../models/User.js';
import { InsuranceProduct } from '../models/InsuranceProduct.js';
import { Policy } from '../models/Policy.js';
import { Claim } from '../models/Claim.js';
import { fileLogger } from '../libs/fileLogger.js';
import { v4 as uuidv4 } from 'uuid';
import MpesaService from '../services/MpesaService.js';
import config from '../Configs/configs.js';
import MistralService from '../services/MistralService.js';

export class BotConversationManager {
    private static instance: BotConversationManager;

    private constructor() { }

    public static getInstance(): BotConversationManager {
        if (!BotConversationManager.instance) {
            BotConversationManager.instance = new BotConversationManager();
        }
        return BotConversationManager.instance;
    }

    /**
     * Main message handler - entry point for all incoming messages
     */
    public async handleMessage(message: Message): Promise<void> {
        try {
            const phoneNumber = BotClient.extractPhoneNumber(message.from);
            fileLogger.log(`📨 [BOT-CONV] Processing message from ${phoneNumber}`);

            // Get or create user
            let user: any = await User.findOne({ phoneNumber });
            if (!user) {
                // Fallback: Check if user exists with just digits (from previous version's truncated ID)
                const cleanPhone = phoneNumber.split(/[@:]/)[0];
                if (cleanPhone && cleanPhone !== phoneNumber) {
                    user = await User.findOne({ phoneNumber: cleanPhone });
                    if (user) {
                        fileLogger.log(`👤 [BOT-CONV] Migrating user ${cleanPhone} to full ChatID ${phoneNumber}`);
                        user.phoneNumber = phoneNumber;
                        await user.save();
                    }
                }
            }

            if (!user) {
                user = new User({
                    phoneNumber,
                    botConversationState: 'LANG_SELECT',
                    registrationComplete: false,
                });
                await user.save();
                fileLogger.log(`👤 [BOT-CONV] New user created: ${phoneNumber}`);

                // Immediately ask for language selection for new users
                await BotClient.sendText(phoneNumber, t('en', 'welcome_message'));
                await this.sendLanguageSelection(phoneNumber);
                return;
            }

            // If existing user hasn't selected a language yet, force selection
            if (!user.botLanguage && user.botConversationState !== 'LANG_SELECT') {
                user.botConversationState = 'LANG_SELECT';
                await user.save();
                await this.sendLanguageSelection(phoneNumber);
                return;
            }

            // Handle greetings - reset to appropriate state
            if (message.type === 'chat') {
                const body = message.body.trim().toLowerCase();
                const greetingRegex = /^(hi|hello|hey|habari|menu|start)$/i;

                if (greetingRegex.test(body)) {
                    fileLogger.log(`👋 [BOT-CONV] Greeting detected from ${phoneNumber}`);
                    await this.handleGreeting(user, phoneNumber);
                    return;
                }

                // Handle HELP command
                if (body === 'help') {
                    const lang = getUserLanguage(user);
                    await BotClient.sendText(phoneNumber, t(lang, 'help_message'));
                    return;
                }
            }

            // Route to appropriate state handler
            await this.routeToState(user, message, phoneNumber);

        } catch (error) {
            fileLogger.log(`❌ [BOT-CONV] Error handling message: ${error}`, 'ERROR');
        }
    }

    /**
     * Handle greeting messages - determine user status and show appropriate menu
     */
    private async handleGreeting(user: IUser, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        // Check user status
        if (!user.botLanguage) {
            // No language selected yet
            user.botConversationState = 'LANG_SELECT';
            await user.save();
            await this.sendLanguageSelection(phoneNumber);
            return;
        }

        // Check KYC status
        if (!user.kycStatus || user.kycStatus === 'pending') {
            if (!user.kycData || Object.keys(user.kycData).length === 0) {
                // No KYC data submitted
                user.botConversationState = 'REGISTER_START';
                await user.save();
                await this.sendRegistrationStart(user, phoneNumber);
            } else {
                // KYC submitted, waiting for approval
                await BotClient.sendText(phoneNumber, t(lang, 'kyc_pending'));
            }
            return;
        }

        if (user.kycStatus === 'rejected') {
            await BotClient.sendText(phoneNumber, t(lang, 'kyc_rejected'));
            return;
        }

        if (user.kycStatus === 'verified') {
            // Check for missing critical data for existing users
            const missingDataTriggered = await this.checkForMissingData(user, phoneNumber);
            if (missingDataTriggered) return;

            // KYC approved - show conversational main menu
            const context = await this.getUserContext(user);
            const prompt = await MistralService.getHimaResponse("Greet me and ask how you can help. Remind me I can buy insurance, file a claim, or view my profile.", context, lang);
            await BotClient.sendText(phoneNumber, prompt);
            user.botConversationState = 'MAIN_MENU';
            await user.save();
            return;
        }
    }

    /**
     * Route message to appropriate state handler
     */
    private async routeToState(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const currentState = user.botConversationState || 'LANG_SELECT';
        fileLogger.log(`🔀 [BOT-CONV] Routing to state: ${currentState}`);

        // GLOBAL INTENT CHECK (Middleware-like)
        if (message.type === 'chat') {
            const body = message.body.trim();

            if (/^(cancel|stop|quit|exit|reset)$/i.test(body)) {
                await BotClient.sendText(phoneNumber, "⛔ Cancelled.");
                user.botConversationState = 'MAIN_MENU';
                await user.save();
                await this.sendMainMenu(user, phoneNumber);
                return;
            }

            const intent = await MistralService.detectIntent(body);

            if (intent === 'EXIT') {
                const lang = getUserLanguage(user);
                const exitMsg = lang === 'sw' ? "Asante! Karibu tena HIMA insurance. 🙏" : "You're welcome! Thank you for choosing HIMA insurance. Have a great day! 🙏";
                await BotClient.sendText(phoneNumber, exitMsg);
                user.botConversationState = 'MAIN_MENU';
                await user.save();
                return;
            }
        }

        switch (currentState) {
            case 'LANG_SELECT':
                await this.handleLanguageSelection(user, message, phoneNumber);
                break;
            case 'REGISTER_START':
                await this.handleRegistrationStart(user, message, phoneNumber);
                break;
            case 'REG_FULL_NAME':
                await this.handleRegFullName(user, message, phoneNumber);
                break;
            case 'REG_LOGIN_PHONE':
                await this.handleRegLoginPhone(user, message, phoneNumber);
                break;
            case 'REG_ID_NUMBER':
                await this.handleRegIdNumber(user, message, phoneNumber);
                break;
            case 'REG_DOB':
                await this.handleRegDOB(user, message, phoneNumber);
                break;
            case 'REG_PLATE_NUMBER':
                await this.handleRegPlateNumber(user, message, phoneNumber);
                break;
            case 'REG_ID_PHOTO':
                await this.handleRegIdPhoto(user, message, phoneNumber);
                break;
            case 'REG_LOGBOOK_PHOTO':
                await this.handleRegLogbookPhoto(user, message, phoneNumber);
                break;
            case 'REG_BIKE_PHOTO':
                await this.handleRegBikePhoto(user, message, phoneNumber);
                break;
            case 'REG_SELFIE_PHOTO':
                await this.handleRegSelfiePhoto(user, message, phoneNumber);
                break;
            case 'MAIN_MENU':
                await this.handleMainMenu(user, message, phoneNumber);
                break;
            case 'COLLECT_MISSING_DATA':
                await this.handleCollectMissingData(user, message, phoneNumber);
                break;

            // Buying Flows
            case 'BUY_SELECT_COVER':
                await this.handleBuySelectCover(user, message, phoneNumber);
                break;
            case 'BUY_BIKE_COLOR':
                await this.handleBuyBikeColor(user, message, phoneNumber);
                break;
            case 'BUY_BIKE_YEAR':
                await this.handleBuyBikeYear(user, message, phoneNumber);
                break;
            case 'BUY_BIKE_PHOTO':
                await this.handleBuyBikePhoto(user, message, phoneNumber);
                break;
            case 'BUY_PA_BENEFICIARY':
                await this.handleBuyPABeneficiary(user, message, phoneNumber);
                break;
            case 'BUY_CONFIRM':
                await this.handleBuyConfirm(user, message, phoneNumber);
                break;

            // Claims Flows
            case 'CLAIM_DATE':
                await this.handleClaimDate(user, message, phoneNumber);
                break;
            case 'CLAIM_TIME':
                await this.handleClaimTime(user, message, phoneNumber);
                break;
            case 'CLAIM_LOCATION':
                await this.handleClaimLocation(user, message, phoneNumber);
                break;
            case 'CLAIM_DESCRIPTION':
                await this.handleClaimDescription(user, message, phoneNumber);
                break;
            case 'CLAIM_BIKE_PHOTO':
                await this.handleClaimBikePhoto(user, message, phoneNumber);
                break;
            case 'CLAIM_DAMAGE_PHOTO':
                await this.handleClaimDamagePhoto(user, message, phoneNumber);
                break;
            case 'CLAIM_POLICE_ABSTRACT':
                await this.handleClaimPoliceAbstract(user, message, phoneNumber);
                break;

            default:
                fileLogger.log(`⚠️ [BOT-CONV] Unknown state or unhandled input in state: ${currentState}`, 'WARN');
                if (currentState === 'MAIN_MENU' || currentState === 'WAITING_KYC_APPROVAL') {
                    await this.handleAIFallback(user, message, phoneNumber);
                } else {
                    await this.handleGreeting(user, phoneNumber);
                }
                break;
        }
    }

    // ============================================
    // LANGUAGE SELECTION
    // ============================================

    private async sendLanguageSelection(phoneNumber: string): Promise<void> {
        const prompt = "Please choose your preferred language: \n1. English\n2. Swahili\n(You can just say 'English' or 'Swahili')";
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleLanguageSelection(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        let selectedLang: Language = 'en';

        if (message.type === 'chat') {
            const body = message.body.trim().toLowerCase();
            // Accept: 1, 2, english, swahili, en, sw
            if (body === '1' || body.includes('english') || body === 'en') {
                selectedLang = 'en';
            } else if (body === '2' || body.includes('swahili') || body.includes('kiswahili') || body === 'sw') {
                selectedLang = 'sw';
            } else {
                // Invalid selection, ask again
                await this.sendLanguageSelection(phoneNumber);
                return;
            }
        } else {
            // Not a text message, ask again
            await this.sendLanguageSelection(phoneNumber);
            return;
        }

        user.botLanguage = selectedLang;
        user.preferredLanguage = selectedLang;
        await user.save();

        // If user is already verified (e.g. changing language from menu), go to main menu
        if (user.kycStatus === 'verified') {
            user.botConversationState = 'MAIN_MENU';
            await user.save();
            await BotClient.sendText(phoneNumber, t(selectedLang, 'greeting_registered', { name: user.firstName || 'User' }));
            await this.sendMainMenu(user, phoneNumber);
        } else {
            // New user or incomplete registration
            user.botConversationState = 'REGISTER_START';
            await user.save();
            await this.sendRegistrationStart(user, phoneNumber);
        }
    }

    // ============================================
    // REGISTRATION FLOW
    // ============================================

    private async sendRegistrationStart(user: IUser, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);
        const prompt = await MistralService.getConversationalPrompt('REGISTER', 'REG_START', lang);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleRegistrationStart(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await this.sendRegistrationStart(user, phoneNumber);
            return;
        }

        const body = message.body.trim().toLowerCase();

        // Match: yes, start, anza, ndio, ok, or just '1' (common habit)
        const positiveIntent = body.includes('yes') || body.includes('ndio') || body.includes('start') ||
            body.includes('anza') || body.includes('ready') || body.match(/^(1|ok|okay|sawa|let's go)$/);

        if (positiveIntent) {
            if (!user.kycData) user.kycData = {};
            user.botConversationState = 'REG_FULL_NAME';
            await user.save();
            const prompt = await MistralService.getConversationalPrompt('REGISTER', 'FULL_NAME', lang);
            await BotClient.sendText(phoneNumber, prompt);
        } else {
            // Conversational fallback - explain why it's needed
            const aiResponse = await MistralService.getHimaResponse(message.body, "Explain that registration is required to buy insurance or file claims. Ask if they want to proceed now.", lang);
            await BotClient.sendText(phoneNumber, aiResponse);
        }
    }

    private async handleRegFullName(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_input'));
            return;
        }

        if (!user.kycData) user.kycData = {};
        user.kycData.fullName = message.body.trim();
        user.botConversationState = 'REG_LOGIN_PHONE';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('REGISTER', 'LOGIN_PHONE', lang, message.body);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleRegLoginPhone(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_input'));
            return;
        }

        // Basic validation: at least 9-10 digits
        const phone = message.body.trim().replace(/[\s\+]/g, '');
        if (!/^\d{9,15}$/.test(phone)) {
            await BotClient.sendText(phoneNumber, lang === 'sw' ? "Tafadhali weka namba sahihi ya simu." : "Please enter a valid phone number.");
            return;
        }

        user.loginPhoneNumber = phone;
        user.botConversationState = 'REG_ID_NUMBER';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('REGISTER', 'ID_NUMBER', lang, message.body);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleRegIdNumber(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_input'));
            return;
        }

        if (!user.kycData) user.kycData = {};
        user.kycData.idNumber = message.body.trim();
        user.botConversationState = 'REG_DOB';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('REGISTER', 'DOB', lang, message.body);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleRegDOB(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_input'));
            return;
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(message.body.trim())) {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_date'));
            return;
        }

        if (!user.kycData) user.kycData = {};
        user.kycData.dateOfBirth = message.body.trim();
        user.botConversationState = 'REG_PLATE_NUMBER';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('REGISTER', 'PLATE_NUMBER', lang, message.body);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleRegPlateNumber(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_input'));
            return;
        }

        if (!user.kycData) user.kycData = {};
        user.kycData.plateNumber = message.body.trim();
        user.botConversationState = 'REG_ID_PHOTO';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('REGISTER', 'ID_PHOTO', lang, message.body);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleRegIdPhoto(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'image') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_image'));
            return;
        }

        try {
            const mediaData = await BotClient.downloadMedia(message);
            if (!user.kycData) user.kycData = {};
            user.kycData.idPhotoBase64 = mediaData;
            user.botConversationState = 'REG_LOGBOOK_PHOTO';
            await user.save();

            const prompt = await MistralService.getConversationalPrompt('REGISTER', 'LOGBOOK_PHOTO', lang, "ID Photo Received");
            await BotClient.sendText(phoneNumber, prompt);
        } catch (error) {
            fileLogger.log(`❌ [BOT-CONV] Error downloading ID photo: ${error}`, 'ERROR');
            await BotClient.sendText(phoneNumber, "Failed to download image. Please try again.");
        }
    }

    private async handleRegLogbookPhoto(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'image') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_image'));
            return;
        }

        try {
            const mediaData = await BotClient.downloadMedia(message);
            if (!user.kycData) user.kycData = {};
            user.kycData.logbookPhotoBase64 = mediaData;
            user.botConversationState = 'REG_BIKE_PHOTO';
            await user.save();

            const prompt = await MistralService.getConversationalPrompt('REGISTER', 'BIKE_PHOTO', lang, "Logbook Photo Received");
            await BotClient.sendText(phoneNumber, prompt);
        } catch (error) {
            fileLogger.log(`❌ [BOT-CONV] Error downloading logbook photo: ${error}`, 'ERROR');
            await BotClient.sendText(phoneNumber, "Failed to download image. Please try again.");
        }
    }

    private async handleRegBikePhoto(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'image') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_image'));
            return;
        }

        try {
            const mediaData = await BotClient.downloadMedia(message);
            if (!user.kycData) user.kycData = {};
            user.kycData.bikePhotoBase64 = mediaData;
            user.botConversationState = 'REG_SELFIE_PHOTO';
            await user.save();

            const prompt = await MistralService.getConversationalPrompt('REGISTER', 'SELFIE_PHOTO', lang, "Bike Photo Received");
            await BotClient.sendText(phoneNumber, prompt);
        } catch (error) {
            fileLogger.log(`❌ [BOT-CONV] Error downloading bike photo: ${error}`, 'ERROR');
            await BotClient.sendText(phoneNumber, "Failed to download image. Please try again.");
        }
    }

    private async handleRegSelfiePhoto(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'image') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_image'));
            return;
        }

        try {
            const mediaData = await BotClient.downloadMedia(message);
            if (!user.kycData) user.kycData = {};
            user.kycData.selfiePhotoBase64 = mediaData;

            // Submit KYC for review
            user.kycStatus = 'pending';
            user.botConversationState = 'WAITING_KYC_APPROVAL';

            // Create blockchain wallet for the user
            const WalletService = (await import('../services/WalletService.js')).default;
            const { address, created } = await WalletService.ensureUserHasWallet(user);

            // Populate kycDocuments for admin dashboard
            user.kycDocuments = [
                { type: 'ID_PHOTO', url: user.kycData.idPhotoBase64, uploadedAt: new Date() },
                { type: 'LOGBOOK_PHOTO', url: user.kycData.logbookPhotoBase64, uploadedAt: new Date() },
                { type: 'BIKE_PHOTO', url: user.kycData.bikePhotoBase64, uploadedAt: new Date() },
                { type: 'SELFIE_PHOTO', url: user.kycData.selfiePhotoBase64, uploadedAt: new Date() }
            ] as any;

            await user.save();

            // Send confirmation with wallet info
            const dashboardProfileUrl = `${config.dashboardUrl}/dashboard/user/profile`;

            const confirmationMessage = t(lang, 'reg_thank_you') +
                `\n\n🔐 ${lang === 'sw' ? 'Mkoba wako wa blockchain' : 'Your blockchain wallet'}:\n` +
                `${WalletService.formatAddress(address)}\n\n` +
                `${lang === 'sw' ? 'Angalia kwenye Dashboard' : 'View on Dashboard'}:\n${dashboardProfileUrl}`;

            await BotClient.sendText(phoneNumber, confirmationMessage);
            fileLogger.log(`✅ [BOT-CONV] KYC submitted for ${phoneNumber}, wallet: ${address}`);
        } catch (error) {
            fileLogger.log(`❌ [BOT-CONV] Error downloading selfie photo: ${error}`, 'ERROR');
            await BotClient.sendText(phoneNumber, "Failed to download image. Please try again.");
        }
    }

    // ============================================
    // MAIN MENU (KYC APPROVED)
    // ============================================

    private async sendMainMenu(user: IUser, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);
        const context = await this.getUserContext(user);
        const prompt = await MistralService.getHimaResponse("Greet me and list my options: Buy Insurance, View Profile, File Claim, or Change Language.", context, lang);
        await BotClient.sendText(phoneNumber, prompt);
    }

    // ============================================
    // DATA ENRICHMENT (FOR EXISTING USERS)
    // ============================================

    private async checkForMissingData(user: IUser, phoneNumber: string): Promise<boolean> {
        if (!user.loginPhoneNumber) {
            const lang = getUserLanguage(user);
            user.botConversationState = 'COLLECT_MISSING_DATA';
            await user.save();

            const prompt = await MistralService.getConversationalPrompt('REGISTER', 'MISSING_DATA_REQUEST', lang, "Needs loginPhoneNumber");
            await BotClient.sendText(phoneNumber, prompt);
            return true;
        }
        return false;
    }

    private async handleCollectMissingData(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            const prompt = await MistralService.getConversationalPrompt('REGISTER', 'MISSING_DATA_REQUEST', lang, "Invalid input");
            await BotClient.sendText(phoneNumber, prompt);
            return;
        }

        const phone = message.body.trim().replace(/[\s\+]/g, '');
        if (!/^\d{9,15}$/.test(phone)) {
            await BotClient.sendText(phoneNumber, lang === 'sw' ? "Tafadhali weka namba sahihi ya simu." : "Please enter a valid phone number.");
            return;
        }

        user.loginPhoneNumber = phone;
        user.botConversationState = 'MAIN_MENU';
        await user.save();

        const successMsg = lang === 'sw'
            ? "Asante! Taarifa zako zimepokelewa. Sasa unaweza kuendelea."
            : "Thank you! Your information has been updated. Now you can continue.";
        await BotClient.sendText(phoneNumber, successMsg);
        await this.sendMainMenu(user, phoneNumber);
    }

    private async handleMainMenu(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await this.sendMainMenu(user, phoneNumber);
            return;
        }

        const choice = message.body.trim();

        if (choice === '1') {
            // Buy insurance
            user.botConversationState = 'BUY_SELECT_COVER';
            await user.save();
            await this.sendBuyInsuranceList(user, phoneNumber);
        } else if (choice === '2') {
            // View profile
            await this.handleViewProfile(user, phoneNumber);
        } else if (choice === '3') {
            // File claim
            user.botConversationState = 'CLAIM_DATE';
            await user.save();

            const prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_DATE', lang);
            await BotClient.sendText(phoneNumber, prompt);
        } else if (choice === '4') {
            // Change Language
            user.botConversationState = 'LANG_SELECT';
            await user.save();
            await this.sendLanguageSelection(phoneNumber);
        } else {
            // Try AI fallback for natural language matching
            await this.handleAIFallback(user, message, phoneNumber);
        }
    }

    /**
     * AI Fallback - handles natural language inputs using Mistral 7B
     */
    private async handleAIFallback(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);
        const body = message.body.trim();

        if (message.type !== 'chat') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_input'));
            return;
        }

        const intent = await MistralService.detectIntent(body);
        const lowerBody = body.toLowerCase();

        if (lowerBody.includes('profile') || lowerBody.includes('name') || lowerBody.includes('who am i') || lowerBody.includes('my info')) {
            const context = await this.getUserContext(user);
            const aiResponse = await MistralService.getHimaResponse(body, context, lang);
            await BotClient.sendText(phoneNumber, aiResponse);
            return;
        }

        switch (intent) {
            case 'BUY_INSURANCE':
                user.botConversationState = 'BUY_SELECT_COVER';
                await user.save();
                const buyPrompt = await MistralService.getConversationalPrompt('BUY', 'SELECT_COVER', lang, body);
                await BotClient.sendText(phoneNumber, buyPrompt);
                break;
            case 'FILE_CLAIM':
                user.botConversationState = 'CLAIM_DATE';
                await user.save();
                const claimPrompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_START', lang, body);
                await BotClient.sendText(phoneNumber, claimPrompt);
                break;
            case 'CHANGE_LANGUAGE':
                user.botConversationState = 'LANG_SELECT';
                await user.save();
                await this.sendLanguageSelection(phoneNumber);
                break;
            case 'CONTACT_SUPPORT':
                await BotClient.sendText(phoneNumber, lang === 'sw'
                    ? "Tafadhali wasiliana nasi kupitia:\nSimu: 0712345678\nBarua pepe: support@hima.co.ke"
                    : "Please contact us via:\nPhone: 0712345678\nEmail: support@hima.co.ke"
                );
                break;
            default:
                const context = await this.getUserContext(user);
                const aiResponse = await MistralService.getHimaResponse(body, context, lang);
                await BotClient.sendText(phoneNumber, aiResponse);
                break;
        }
    }

    /**
     * Fetch comprehensive user context from the database for the AI
     */
    private async getUserContext(user: IUser): Promise<string> {
        try {
            const cleanPhone = user.phoneNumber.split(/[@:]/)[0];

            // Search by both userId (standard) and fallbacks (linked by plate or phone)
            const policies = await Policy.find({
                $or: [
                    { userId: user._id.toString() },
                    { registrationNumber: user.kycData?.plateNumber },
                    { userId: user.phoneNumber }, // Full chatId fallback
                    { userId: cleanPhone } // Clean digits fallback
                ]
            } as any);

            const claims = await Claim.find({
                $or: [
                    { userId: user._id.toString() },
                    { userId: user.phoneNumber },
                    { userId: cleanPhone }
                ]
            } as any);

            const contextObj = {
                name: user.kycData?.fullName || user.firstName || 'Not recorded',
                id_number: user.kycData?.idNumber || 'Not recorded',
                plate: user.kycData?.plateNumber || 'Not recorded',
                login_phone: user.loginPhoneNumber || 'Not recorded',
                account_status: user.kycStatus || 'pending',
                wallet: user.walletAddress || 'None',
                hima_policies: policies.length > 0
                    ? policies.map(p => `Policy ${p.policyNumber}: ${p.coverageType.toUpperCase()} cover (${p.policyStatus})`).join(', ')
                    : 'No policies found in database.',
                claims_record: claims.length > 0
                    ? claims.map(c => `Claim ID ${(c as any).claimNumber || 'N/A'}: ${c.status}`).join(', ')
                    : 'No claims found.'
            };

            const contextString = JSON.stringify(contextObj, null, 2);
            fileLogger.log(`🧠 [MISTRAL-CTX] Context generated for ${user.phoneNumber}. Policies: ${policies.length}`);
            return contextString;
        } catch (error) {
            fileLogger.log(`⚠️ [BOT-CONV] Error getting user context: ${error}`, 'WARN');
            return "Error retrieving database records.";
        }
    }

    // ============================================
    // BUY INSURANCE FLOW
    // ============================================

    private async sendBuyInsuranceList(user: IUser, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);
        const prompt = await MistralService.getConversationalPrompt('BUY', 'SELECT_COVER', lang);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleBuySelectCover(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await this.sendBuyInsuranceList(user, phoneNumber);
            return;
        }

        const choice = message.body.trim().toLowerCase();

        // Map choice to product (1. Basic, 2. Comprehensive, 3. Personal Accident/Premium)
        let coverageType = '';
        if (choice === '1' || choice.includes('basic') || choice.includes('third party')) coverageType = 'basic';
        else if (choice === '2' || choice.includes('comprehensive')) coverageType = 'comprehensive';
        else if (choice === '3' || choice.includes('personal accident') || choice.includes('premium')) coverageType = 'premium';
        else {
            // Conversational Q&A
            const answer = await MistralService.getHimaResponse(choice, "Explain the difference between Third Party, Comprehensive, and Personal Accident insurance for boda bodas.", lang);
            await BotClient.sendText(phoneNumber, answer);
            return;
        }

        // Find product
        const product = await InsuranceProduct.findOne({ coverageType, isActive: true });
        if (!product) {
            await BotClient.sendText(phoneNumber, t(lang, 'error_general'));
            return;
        }

        // Store selected product
        user.selectedProductId = product._id.toString();

        // Dynamic Routing based on Policy Type
        if (coverageType === 'comprehensive') {
            user.botConversationState = 'BUY_BIKE_COLOR';
            await user.save();
            const prompt = await MistralService.getConversationalPrompt('BUY', 'BUY_BIKE_COLOR', lang, choice);
            await BotClient.sendText(phoneNumber, prompt);
        } else if (coverageType === 'premium') {
            user.botConversationState = 'BUY_PA_BENEFICIARY';
            await user.save();
            const prompt = await MistralService.getConversationalPrompt('BUY', 'BUY_PA_BENEFICIARY', lang, choice);
            await BotClient.sendText(phoneNumber, prompt);
        } else {
            // Third Party is fast-track
            user.botConversationState = 'BUY_CONFIRM';
            await user.save();
            const prompt = await MistralService.getConversationalPrompt('BUY', 'BUY_CONFIRM', lang, `Selected ${product.name}`);
            await BotClient.sendText(phoneNumber, prompt);
        }
    }

    private async handleBuyBikeColor(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);
        if (message.type !== 'chat') return;

        if (!user.kycData) user.kycData = {};
        (user.kycData as any).buyBikeColor = message.body.trim();
        user.botConversationState = 'BUY_BIKE_YEAR';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('BUY', 'BUY_BIKE_YEAR', lang, message.body);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleBuyBikeYear(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);
        if (message.type !== 'chat') return;

        if (!user.kycData) user.kycData = {};
        (user.kycData as any).buyBikeYear = message.body.trim();
        user.botConversationState = 'BUY_BIKE_PHOTO';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('BUY', 'BUY_BIKE_PHOTO', lang, message.body);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleBuyBikePhoto(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);
        if (message.type !== 'image') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_image'));
            return;
        }

        const mediaData = await BotClient.downloadMedia(message);
        if (!user.kycData) user.kycData = {};
        (user.kycData as any).buyBikePhoto = mediaData;
        user.botConversationState = 'BUY_CONFIRM';
        await user.save();

        const product = await InsuranceProduct.findById(user.selectedProductId);
        const prompt = await MistralService.getConversationalPrompt('BUY', 'BUY_CONFIRM', lang, `Product: ${product?.name}`);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleBuyPABeneficiary(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);
        if (message.type !== 'chat') return;

        if (!user.kycData) user.kycData = {};
        (user.kycData as any).buyPaBeneficiary = message.body.trim();
        user.botConversationState = 'BUY_CONFIRM';
        await user.save();

        const product = await InsuranceProduct.findById(user.selectedProductId);
        const prompt = await MistralService.getConversationalPrompt('BUY', 'BUY_CONFIRM', lang, `Product: ${product?.name}`);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleBuyConfirm(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            return;
        }

        const choice = message.body.trim().toLowerCase();

        if (choice === '2' || choice.includes('cancel') || choice.includes('no')) {
            user.botConversationState = 'MAIN_MENU';
            await user.save();
            await BotClient.sendText(phoneNumber, t(lang, 'buy_cancelled'));
            await this.sendMainMenu(user, phoneNumber);
            return;
        }

        if (choice === '1' || choice.includes('yes') || choice.includes('confirm')) {
            // Initiate payment
            const product = await InsuranceProduct.findById(user.selectedProductId);
            if (!product) {
                await BotClient.sendText(phoneNumber, t(lang, 'error_general'));
                return;
            }

            try {
                const policyNumber = `HIMA - ${uuidv4().substring(0, 8).toUpperCase()} `;

                // Extract actual phone number for M-Pesa (remove @lid or @c.us)
                const cleanPhone = phoneNumber.replace(/@.*$/, '');

                // Initiate M-Pesa STK push
                await MpesaService.initiateSTKPush(
                    cleanPhone,
                    product.premiumAmountKES,
                    policyNumber,
                    `HIMA Insurance - ${product.name} `
                );

                await BotClient.sendText(phoneNumber, t(lang, 'buy_payment_prompt'));
                user.botConversationState = 'MAIN_MENU';
                await user.save();
            } catch (error) {
                fileLogger.log(`❌[BOT - CONV] Payment error: ${error} `, 'ERROR');
                await BotClient.sendText(phoneNumber, t(lang, 'error_general'));
            }
        }
    }

    // ============================================
    // VIEW PROFILE
    // ============================================

    private async handleViewProfile(user: IUser, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);
        const context = await this.getUserContext(user);
        const prompt = await MistralService.getHimaResponse("Summarize my profile details naturally. Mention my name, ID, plate, and status.", context, lang);
        await BotClient.sendText(phoneNumber, prompt);
    }

    // ============================================
    // FILE CLAIM FLOW
    // ============================================

    private async handleClaimDate(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_input'));
            return;
        }

        // Validate date
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(message.body.trim())) {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_date'));
            return;
        }

        if (!user.kycData) user.kycData = {};
        (user.kycData as any).claimDate = message.body.trim();
        user.botConversationState = 'CLAIM_TIME';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_TIME', lang, message.body);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleClaimTime(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_input'));
            return;
        }

        if (!user.kycData) user.kycData = {};
        (user.kycData as any).claimTime = message.body.trim();
        user.botConversationState = 'CLAIM_LOCATION';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_LOCATION', lang, message.body);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleClaimLocation(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_input'));
            return;
        }

        if (!user.kycData) user.kycData = {};
        (user.kycData as any).claimLocation = message.body.trim();
        user.botConversationState = 'CLAIM_DESCRIPTION';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_DESCRIPTION', lang, message.body);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleClaimDescription(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_input'));
            return;
        }

        if (!user.kycData) user.kycData = {};
        (user.kycData as any).claimDescription = message.body.trim();
        user.botConversationState = 'CLAIM_BIKE_PHOTO';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_BIKE_PHOTO', lang, message.body);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleClaimBikePhoto(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'image') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_image'));
            return;
        }

        const mediaData = await BotClient.downloadMedia(message);
        if (!user.kycData) user.kycData = {};
        (user.kycData as any).claimBikePhoto = mediaData;
        user.botConversationState = 'CLAIM_DAMAGE_PHOTO';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_DAMAGE_PHOTO', lang);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleClaimDamagePhoto(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'image') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_image'));
            return;
        }

        const mediaData = await BotClient.downloadMedia(message);
        if (!user.kycData) user.kycData = {};
        (user.kycData as any).claimDamagePhoto = mediaData;
        user.botConversationState = 'CLAIM_POLICE_ABSTRACT';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_POLICE_ABSTRACT', lang);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleClaimPoliceAbstract(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        let policeAbstract = '';

        if (message.type === 'image') {
            policeAbstract = await BotClient.downloadMedia(message);
        } else if (message.type === 'chat' && message.body.trim().toUpperCase() === 'SKIP') {
            policeAbstract = '';
        } else {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_input'));
            return;
        }

        // Create claim
        const claimNumber = `CLM-${uuidv4().substring(0, 8).toUpperCase()}`;
        const kycData = user.kycData as any;

        // Combine date and time
        const incidentDateStr = `${kycData.claimDate} ${kycData.claimTime || '12:00'}`;

        // Find active policy for this user to link the claim
        const userPolicy = await Policy.findOne({ userId: user._id.toString(), policyStatus: 'active' });

        const newClaim = new Claim({
            userId: user._id,
            policyId: userPolicy ? userPolicy._id.toString() : 'manual_submission', // Added required policyId
            claimNumber,
            incidentTime: new Date(incidentDateStr),
            incidentLocation: kycData.claimLocation,
            incidentDescription: kycData.claimDescription,
            bikePhotoBase64: kycData.claimBikePhoto,
            damagePhotoBase64: kycData.claimDamagePhoto,
            policeAbstractBase64: policeAbstract,
            status: 'submitted'
        });

        await newClaim.save();

        // Clear temporary data
        delete kycData.claimDate;
        delete kycData.claimTime;
        delete kycData.claimLocation;
        delete kycData.claimDescription;
        delete kycData.claimBikePhoto;
        delete kycData.claimDamagePhoto;

        user.botConversationState = 'MAIN_MENU';
        await user.save();

        const successMsg = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_SUBMITTED', lang, claimNumber);
        await BotClient.sendText(phoneNumber, successMsg);
        await this.sendMainMenu(user, phoneNumber);
        fileLogger.log(`✅ [BOT-CONV] Claim submitted: ${claimNumber}`);
    }
}

export default BotConversationManager.getInstance();
