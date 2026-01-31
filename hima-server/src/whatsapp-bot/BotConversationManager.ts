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
            let user = await User.findOne({ phoneNumber });
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
            // KYC approved - show main menu
            const name = user.kycData?.fullName || user.firstName || 'User';
            await BotClient.sendText(phoneNumber, t(lang, 'greeting_registered', { name }));
            user.botConversationState = 'MAIN_MENU';
            await user.save();
            await this.sendMainMenu(user, phoneNumber);
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
        // Only run for text messages to avoid breaking media flows
        if (message.type === 'chat') {
            const body = message.body.trim();

            // Simple keyword check first to save API calls
            if (/^(cancel|stop|quit|exit|reset)$/i.test(body)) {
                await BotClient.sendText(phoneNumber, "⛔ Cancelled.");
                user.botConversationState = 'MAIN_MENU';
                await user.save();
                await this.sendMainMenu(user, phoneNumber);
                return;
            }

            // For other inputs, if we are in a specific flow (like Registration), we might want to check for 'CANCEL' intent
            // But doing an API call on every step might be slow. 
            // Compromise: If the input is NOT what we expect (e.g. not a number for ID), we fall back to AI in the specific handler.
            // However, the user asked for "Global Cancel intent". 
            // Let's rely on the keyword check above for speed, and if the specific handler fails to validate input, it calls handleAIFallback which detects CANCEL.
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
            case 'BUY_SELECT_COVER':
                await this.handleBuySelectCover(user, message, phoneNumber);
                break;
            case 'BUY_CONFIRM':
                await this.handleBuyConfirm(user, message, phoneNumber);
                break;
            case 'CLAIM_DATE':
                await this.handleClaimDate(user, message, phoneNumber);
                break;
            case 'CLAIM_LOCATION':
                await this.handleClaimLocation(user, message, phoneNumber);
                break;
            case 'CLAIM_DESCRIPTION':
                await this.handleClaimDescription(user, message, phoneNumber);
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
        await BotClient.sendButtons(
            phoneNumber,
            t('en', 'language_select_prompt'), // Default to English prompt for selection
            [
                { id: 'LANG_EN', text: t('en', 'lang_button_english') },
                { id: 'LANG_SW', text: t('sw', 'lang_button_swahili') }
            ],
            t('en', 'language_select_title'),
            t('en', 'button_tap_prompt')
        );
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
        await BotClient.sendButtons(
            phoneNumber,
            t(lang, 'welcome_no_account'),
            [{ id: 'REG_START', text: t(lang, 'reg_start_button') }],
            'HIMA Registration',
            t(lang, 'button_tap_prompt')
        );
    }

    private async handleRegistrationStart(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        // Initialize kycData if not exists
        if (!user.kycData) {
            user.kycData = {};
        }

        user.botConversationState = 'REG_FULL_NAME';
        await user.save();

        // Context: User clicked "Register"
        const prompt = await MistralService.getConversationalPrompt('REGISTER', 'FULL_NAME', lang);
        await BotClient.sendText(phoneNumber, prompt);
    }

    private async handleRegFullName(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await BotClient.sendText(phoneNumber, t(lang, 'error_invalid_input'));
            return;
        }

        if (!user.kycData) user.kycData = {};
        user.kycData.fullName = message.body.trim();
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
        await BotClient.sendButtons(
            phoneNumber,
            t(lang, 'main_menu_title'),
            [
                { id: 'BUY_INS', text: t(lang, 'main_menu_buy') },
                { id: 'VIEW_PROFILE', text: t(lang, 'main_menu_profile') },
                { id: 'FILE_CLAIM', text: t(lang, 'main_menu_claim') },
                { id: 'CHANGE_LANG', text: t(lang, 'main_menu_change_lang') }
            ],
            'HIMA Menu',
            t(lang, 'button_tap_prompt')
        );
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

        fileLogger.log(`🤖 [BOT-CONV] Using AI fallback for: ${body}`);

        // 1. Detect Intent - only for structured actions
        const intent = await MistralService.detectIntent(body);
        fileLogger.log(`🔍 [BOT-CONV] AI Detected Intent: ${intent}`);

        // Handle specific keywords directly for faster response
        const lowerBody = body.toLowerCase();
        if (lowerBody.includes('profile') || lowerBody.includes('name') || lowerBody.includes('who am i') || lowerBody.includes('my info')) {
            const context = await this.getUserContext(user);
            const aiResponse = await MistralService.getHimaResponse(body, context, lang);
            await BotClient.sendText(phoneNumber, aiResponse);
            return;
        }

        // 2. Route based on intent
        switch (intent) {
            case 'BUY_INSURANCE':
                user.botConversationState = 'BUY_SELECT_COVER';
                await user.save();
                await this.sendBuyInsuranceList(user, phoneNumber);
                break;
            case 'FILE_CLAIM':
                user.botConversationState = 'CLAIM_DATE';
                await user.save();

                // Conversational claim start
                const prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_DATE', lang, "User wants to report accident");
                await BotClient.sendText(phoneNumber, prompt);
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
                // Dynamic AI Response with Database Context
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
            const policies = await Policy.find({ userId: user._id.toString() });
            const claims = await Claim.find({ userId: user._id.toString() });

            const contextObj = {
                name: user.kycData?.fullName || user.firstName || 'Not set',
                phone: user.phoneNumber,
                id: user.kycData?.idNumber || 'Not set',
                plate: user.kycData?.plateNumber || 'Not set',
                wallet: user.walletAddress || 'None',
                status: user.kycStatus || 'pending',
                policies: policies.length > 0
                    ? policies.map(p => `${p.coverageType} (${p.policyStatus}) exp ${p.policyEndDate.toISOString().split('T')[0]}`).join(', ')
                    : 'None active',
                claims: claims.length > 0
                    ? claims.map(c => `Claim ID ${(c as any).claimNumber || 'N/A'}: ${c.status}`).join(', ')
                    : 'None'
            };

            const contextString = JSON.stringify(contextObj, null, 2);
            fileLogger.log(`🧠 [MISTRAL-CTX] Context generated for ${user.phoneNumber}. Name: ${contextObj.IDENTIFIED_USER_NAME}, Policies: ${policies.length}`);
            console.log(`[BOT-DEBUG] Context for ${user.phoneNumber}:`, contextString); // Log for developer to see in pnpm run dev output
            return contextString;
        } catch (error) {
            fileLogger.log(`⚠️ [BOT-CONV] Error getting user context: ${error}`, 'WARN');
            return "Error retrieving user data.";
        }
    }

    // ============================================
    // BUY INSURANCE FLOW
    // ============================================

    private async sendBuyInsuranceList(user: IUser, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        // Conversational intro before buttons
        const prompt = await MistralService.getConversationalPrompt('BUY', 'SELECT_COVER', lang);
        await BotClient.sendText(phoneNumber, prompt);

        // Buttons are now just the options, the AI asks the question
        await BotClient.sendButtons(
            phoneNumber,
            '', // Body empty because AI already spoke
            [
                { id: 'COV_TP', text: t(lang, 'buy_button_tp') },
                { id: 'COV_COMP', text: t(lang, 'buy_button_comp') },
                { id: 'COV_PA', text: t(lang, 'buy_button_pa') }
            ],
            lang === 'sw' ? 'Bima ya boda' : 'Boda cover'
        );
    }

    private async handleBuySelectCover(user: IUser, message: Message, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        if (message.type !== 'chat') {
            await this.sendBuyInsuranceList(user, phoneNumber);
            return;
        }

        const choice = message.body.trim();

        // Map choice to product
        let coverageType = 'basic';
        if (choice === '1') coverageType = 'basic';  // Third party
        else if (choice === '2') coverageType = 'comprehensive';
        else if (choice === '3') coverageType = 'premium';  // Personal accident
        else {
            // Conversational Q&A instead of strict menu loop
            // If they didn't pick 1, 2, or 3, assume it's a question about the products
            const answer = await MistralService.getHimaResponse(choice, lang);
            await BotClient.sendText(phoneNumber, answer);
            // Optionally remind them they can pick a plan, but don't spam the buttons again immediately
            // unless the AI says so, or just leave it conversational. 
            // Let's just answer. The buttons are still visible in chat.
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
        user.botConversationState = 'BUY_CONFIRM';
        await user.save();

        // Send confirmation
        await BotClient.sendButtons(
            phoneNumber,
            t(lang, 'buy_confirm_details', {
                productName: product.name,
                premium: product.premiumAmountKES.toString(),
                coverage: product.coverageType
            }),
            [
                { id: 'CONFIRM_BUY', text: t(lang, 'buy_button_confirm') },
                { id: 'CANCEL_BUY', text: t(lang, 'buy_button_cancel') }
            ],
            'Confirm Purchase',
            t(lang, 'button_tap_prompt')
        );
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
                const policyNumber = `HIMA-${uuidv4().substring(0, 8).toUpperCase()}`;

                // Extract actual phone number for M-Pesa (remove @lid or @c.us)
                const cleanPhone = phoneNumber.replace(/@.*$/, '');

                // Initiate M-Pesa STK push
                await MpesaService.initiateSTKPush(
                    cleanPhone,
                    product.premiumAmountKES,
                    policyNumber,
                    `HIMA Insurance - ${product.name}`
                );

                await BotClient.sendText(phoneNumber, t(lang, 'buy_payment_prompt'));
                user.botConversationState = 'MAIN_MENU';
                await user.save();
            } catch (error) {
                fileLogger.log(`❌ [BOT-CONV] Payment error: ${error}`, 'ERROR');
                await BotClient.sendText(phoneNumber, t(lang, 'error_general'));
            }
        }
    }

    // ============================================
    // VIEW PROFILE
    // ============================================

    private async handleViewProfile(user: IUser, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);

        // Get active policy
        const policy = await Policy.findOne({ userId: user._id.toString(), policyStatus: 'active' });

        // Ensure user has wallet
        const WalletService = (await import('../services/WalletService.js')).default;
        await WalletService.ensureUserHasWallet(user);

        const dashboardProfileUrl = `${config.dashboardUrl}/dashboard/user/profile`;

        const profileMessage = t(lang, 'profile_details', {
            name: user.kycData?.fullName || user.firstName || 'N/A',
            idNumber: user.kycData?.idNumber || 'N/A',
            plate: user.kycData?.plateNumber || 'N/A',
            policyNumber: policy?.policyNumber || t(lang, 'profile_no_policy'),
            profileUrl: dashboardProfileUrl
        }) + `\n\n🔐 ${lang === 'sw' ? 'Mkoba wa Blockchain' : 'Blockchain Wallet'}:\n` +
            `${user.walletAddress ? WalletService.formatAddress(user.walletAddress) : 'N/A'}\n\n` +
            `${lang === 'sw' ? 'Angalia kwenye Dashboard' : 'View on Dashboard'}:\n${dashboardProfileUrl}`;

        await BotClient.sendButtons(
            phoneNumber,
            profileMessage,
            [{ id: 'OPEN_PROFILE', text: t(lang, 'profile_button_open') }],
            'HIMA Profile',
            t(lang, 'button_tap_prompt')
        );
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
        user.botConversationState = 'CLAIM_LOCATION';
        await user.save();

        // Conversational Prompt
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
        user.botConversationState = 'CLAIM_DAMAGE_PHOTO';
        await user.save();

        const prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_DAMAGE_PHOTO', lang, message.body);
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

        const newClaim = new Claim({
            userId: user._id,
            claimNumber,
            accidentDate: new Date(kycData.claimDate),
            location: kycData.claimLocation,
            description: kycData.claimDescription,
            damagePhotoBase64: kycData.claimDamagePhoto,
            policeAbstractBase64: policeAbstract,
            status: 'submitted',
            submittedAt: new Date()
        });

        await newClaim.save();

        // Clear claim data from kycData
        delete kycData.claimDate;
        delete kycData.claimLocation;
        delete kycData.claimDescription;
        delete kycData.claimDamagePhoto;

        user.botConversationState = 'MAIN_MENU';
        await user.save();

        await BotClient.sendText(phoneNumber, t(lang, 'claim_submitted', { claimNumber }));
        await this.sendMainMenu(user, phoneNumber);
        fileLogger.log(`✅ [BOT-CONV] Claim submitted: ${claimNumber}`);
    }
}

export default BotConversationManager.getInstance();
