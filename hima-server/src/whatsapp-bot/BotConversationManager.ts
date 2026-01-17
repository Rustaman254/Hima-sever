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
            await BotClient.sendText(phoneNumber, t(lang, 'kyc_approved_welcome'));
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
        const state = user.botConversationState || 'LANG_SELECT';
        fileLogger.log(`🔀 [BOT-CONV] Routing to state: ${state}`);

        switch (state) {
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
                fileLogger.log(`⚠️ [BOT-CONV] Unknown state: ${state}`, 'WARN');
                await this.handleGreeting(user, phoneNumber);
                break;
        }
    }

    // ============================================
    // LANGUAGE SELECTION
    // ============================================

    private async sendLanguageSelection(phoneNumber: string): Promise<void> {
        await BotClient.sendButtons(
            phoneNumber,
            t('en', 'welcome_language'),
            [
                { id: 'LANG_EN', text: t('en', 'lang_button_english') },
                { id: 'LANG_SW', text: t('sw', 'lang_button_swahili') }
            ],
            'HIMA Language',
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
            }
        }

        user.botLanguage = selectedLang;
        user.preferredLanguage = selectedLang;
        user.botConversationState = 'REGISTER_START';
        await user.save();

        await this.sendRegistrationStart(user, phoneNumber);
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
        await BotClient.sendText(phoneNumber, t(lang, 'reg_full_name'));
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

        await BotClient.sendText(phoneNumber, t(lang, 'reg_id_number'));
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

        await BotClient.sendText(phoneNumber, t(lang, 'reg_dob'));
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

        await BotClient.sendText(phoneNumber, t(lang, 'reg_plate_number'));
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

        await BotClient.sendText(phoneNumber, t(lang, 'reg_id_photo'));
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

            await BotClient.sendText(phoneNumber, t(lang, 'reg_logbook_photo'));
        } catch (error) {
            fileLogger.log(`❌ [BOT-CONV] Error downloading ID photo: ${error}`, 'ERROR');
            await BotClient.sendText(
                phoneNumber,
                lang === 'sw'
                    ? 'Samahani, imeshindikana kupakua picha. Tafadhali jaribu tena.'
                    : 'Sorry, failed to download the image. Please try again.'
            );
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

            await BotClient.sendText(phoneNumber, t(lang, 'reg_bike_photo'));
        } catch (error) {
            fileLogger.log(`❌ [BOT-CONV] Error downloading logbook photo: ${error}`, 'ERROR');
            await BotClient.sendText(
                phoneNumber,
                lang === 'sw'
                    ? 'Samahani, imeshindikana kupakua picha. Tafadhali jaribu tena.'
                    : 'Sorry, failed to download the image. Please try again.'
            );
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

            await BotClient.sendText(phoneNumber, t(lang, 'reg_selfie_photo'));
        } catch (error) {
            fileLogger.log(`❌ [BOT-CONV] Error downloading bike photo: ${error}`, 'ERROR');
            await BotClient.sendText(
                phoneNumber,
                lang === 'sw'
                    ? 'Samahani, imeshindikana kupakua picha. Tafadhali jaribu tena.'
                    : 'Sorry, failed to download the image. Please try again.'
            );
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
            const confirmationMessage = t(lang, 'reg_thank_you') +
                `\n\n🔐 ${lang === 'sw' ? 'Mkoba wako wa blockchain' : 'Your blockchain wallet'}:\n` +
                `${WalletService.formatAddress(address)}\n\n` +
                `${lang === 'sw' ? 'Angalia mkoba' : 'View wallet'}: ${WalletService.getExplorerUrl(address)}`;

            await BotClient.sendText(phoneNumber, confirmationMessage);
            fileLogger.log(`✅ [BOT-CONV] KYC submitted for ${phoneNumber}, wallet: ${address}`);
        } catch (error) {
            fileLogger.log(`❌ [BOT-CONV] Error downloading selfie photo: ${error}`, 'ERROR');
            await BotClient.sendText(
                phoneNumber,
                lang === 'sw'
                    ? 'Samahani, imeshindikana kupakua picha. Tafadhali jaribu tena.'
                    : 'Sorry, failed to download the image. Please try again.'
            );
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
                { id: 'FILE_CLAIM', text: t(lang, 'main_menu_claim') }
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
            await BotClient.sendText(phoneNumber, t(lang, 'claim_start_date'));
        } else {
            await this.sendMainMenu(user, phoneNumber);
        }
    }

    // ============================================
    // BUY INSURANCE FLOW
    // ============================================

    private async sendBuyInsuranceList(user: IUser, phoneNumber: string): Promise<void> {
        const lang = getUserLanguage(user);
        await BotClient.sendButtons(
            phoneNumber,
            t(lang, 'buy_choose_cover'),
            [
                { id: 'COV_TP', text: t(lang, 'buy_button_tp') },
                { id: 'COV_COMP', text: t(lang, 'buy_button_comp') },
                { id: 'COV_PA', text: t(lang, 'buy_button_pa') }
            ],
            lang === 'sw' ? 'Bima ya boda' : 'Boda cover',
            t(lang, 'button_tap_prompt')
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
            await this.sendBuyInsuranceList(user, phoneNumber);
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
        const policy = await Policy.findOne({ userId: user._id, policyStatus: 'active' });

        // Ensure user has wallet
        const WalletService = (await import('../services/WalletService.js')).default;
        await WalletService.ensureUserHasWallet(user);

        const profileUrl = `https://hima.com/profile/${user._id}`;
        const walletExplorerUrl = user.walletAddress ? WalletService.getExplorerUrl(user.walletAddress) : '';

        const profileMessage = t(lang, 'profile_details', {
            name: user.kycData?.fullName || user.firstName || 'N/A',
            idNumber: user.kycData?.idNumber || 'N/A',
            plate: user.kycData?.plateNumber || 'N/A',
            policyNumber: policy?.policyNumber || t(lang, 'profile_no_policy'),
            profileUrl
        }) + `\n\n🔐 ${lang === 'sw' ? 'Mkoba wa Blockchain' : 'Blockchain Wallet'}:\n` +
            `${user.walletAddress ? WalletService.formatAddress(user.walletAddress) : 'N/A'}\n\n` +
            `${lang === 'sw' ? 'Angalia mkoba' : 'View on Explorer'}:\n${walletExplorerUrl}`;

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

        await BotClient.sendText(phoneNumber, t(lang, 'claim_location'));
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

        await BotClient.sendText(phoneNumber, t(lang, 'claim_description'));
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

        await BotClient.sendText(phoneNumber, t(lang, 'claim_damage_photo'));
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

        await BotClient.sendText(phoneNumber, t(lang, 'claim_police_abstract'));
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
