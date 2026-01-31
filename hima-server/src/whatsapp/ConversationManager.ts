import WhatsAppClient from "./WhatsAppClient.js";
import { User, type IUser } from "../models/User.js";
import { InsuranceProduct } from "../models/InsuranceProduct.js";
import { Policy } from "../models/Policy.js";
import { createWallet } from "../libs/walletManager.js";
import MpesaService from "../services/MpesaService.js";
import { v4 as uuidv4 } from 'uuid';
import { fileLogger } from "../libs/fileLogger.js";
import MistralService from "../services/MistralService.js";
import config from "../Configs/configs.js";

export class ConversationManager {
    private static instance: ConversationManager;

    private constructor() { }

    public static getInstance(): ConversationManager {
        if (!ConversationManager.instance) {
            ConversationManager.instance = new ConversationManager();
        }
        return ConversationManager.instance;
    }

    /**
     * Handle incoming webhook messages
     */
    public async handleMessage(message: any) {
        try {
            // Extract basic info
            fileLogger.log(`🎯 [CONVERSATION] handleMessage called with: ${JSON.stringify(message, null, 2)}`);

            const from = message.from; // Phone number
            fileLogger.log(`📱 [CONVERSATION] Processing message from: ${from}`);
            const type = message.type;
            const name = message.profile?.name || "User";

            fileLogger.log(`📩 [WHATSAPP] Received ${type} message from ${name} (${from})`);

            let user = await User.findOne({ phoneNumber: from });

            if (!user) {
                fileLogger.log(`👤 [WHATSAPP] New user detected: ${from}`);
                user = new User({
                    phoneNumber: from,
                    conversationState: "initial",
                    registrationComplete: false,
                });
                await user.save();
                fileLogger.log(`✅ [WHATSAPP] New user created: ${user._id}`);
            }

            // Standardize Text Body
            let body = "";
            if (type === "text" && message.text?.body) {
                body = message.text.body.trim();
            } else if (type === "interactive" && message.interactive.type === "button_reply") {
                body = message.interactive.button_reply.id;
            }

            // Handle Reset/Greeting/Cancel
            if (type === "text") {
                const greetingRegex = /^(hi|hello|hey|hola|habari|start|menu|help)$/i;
                const cancelRegex = /^(cancel|stop|quit|exit|reset)$/i;

                if (greetingRegex.test(body) || cancelRegex.test(body) || body.toUpperCase() === "RESET") {
                    if (cancelRegex.test(body)) {
                        const cancelMsg = await MistralService.getConversationalPrompt('BUY', 'PURCHASE_CANCELLED', 'en');
                        await WhatsAppClient.sendTextMessage(from, cancelMsg);
                    }

                    if (user.registrationComplete) {
                        user.conversationState = "registered";
                        await user.save();
                        await this.sendMainMenu(from);
                        return;
                    } else {
                        user.conversationState = "initial";
                        await user.save();
                    }
                }
            }

            // State machine
            console.log(`[CONVERSATION] User: ${user.phoneNumber}, State: ${user.conversationState}`);
            switch (user.conversationState) {
                case "initial":
                    console.log("[CONVERSATION] Handling state: initial");
                    const introPrompt = await MistralService.getConversationalPrompt('REGISTER', 'FULL_NAME', 'en');
                    await WhatsAppClient.sendTextMessage(from, introPrompt);

                    user.conversationState = "awaiting_first_name";
                    await user.save();
                    break;

                case "awaiting_first_name":
                    console.log("[CONVERSATION] Handling state: awaiting_first_name");
                    if (type === "text") {
                        user.firstName = body;
                        user.conversationState = "awaiting_id_number";
                        await user.save();

                        const prompt = await MistralService.getConversationalPrompt('REGISTER', 'ID_NUMBER', 'en', body);
                        await WhatsAppClient.sendTextMessage(from, prompt);
                    } else {
                        const retryPrompt = await MistralService.getConversationalPrompt('REGISTER', 'FULL_NAME', 'en');
                        await WhatsAppClient.sendTextMessage(from, retryPrompt);
                    }
                    break;

                case "awaiting_id_number":
                    if (type === "text") {
                        user.conversationState = "awaiting_email";
                        await user.save();

                        const prompt = await MistralService.getConversationalPrompt('REGISTER', 'ID_NUMBER', 'en', body);
                        await WhatsAppClient.sendTextMessage(from, prompt);
                    }
                    break;

                case "awaiting_email":
                    console.log("[CONVERSATION] Handling state: awaiting_email");
                    if (type === "text" && body.includes("@")) {
                        user.email = body;

                        // Create wallet
                        console.log("[CONVERSATION] Creating wallet for user");
                        const wallet = createWallet();
                        user.walletAddress = wallet.address;
                        user.walletPrivateKey = wallet.privateKey;

                        user.registrationComplete = true;
                        user.conversationState = "registered";
                        await user.save();

                        // AI-generated success message
                        const successMsg = await MistralService.getHimaResponse(
                            "User just completed registration successfully. Congratulate them and let them know they can now buy insurance.",
                            'en'
                        );
                        await WhatsAppClient.sendTextMessage(from, successMsg);
                        await this.sendMainMenu(from);
                    } else {
                        const retryPrompt = await MistralService.getConversationalPrompt('REGISTER', 'ID_NUMBER', 'en', body);
                        await WhatsAppClient.sendTextMessage(from, retryPrompt);
                    }
                    break;

                case "registered":
                    console.log("[CONVERSATION] Handling state: registered");
                    if (message.interactive && message.interactive.type === "button_reply") {
                        const btnId = message.interactive.button_reply.id;
                        await this.handleMenuSelection(user, from, btnId);
                    } else if (type === "text") {
                        // AI Fallback / Intent Detection
                        const intent = await MistralService.detectIntent(body);

                        if (intent === 'BUY_INSURANCE') {
                            await this.startBuyFlow(user, from);
                        } else if (intent === 'FILE_CLAIM') {
                            await this.startClaimFlow(user, from);
                        } else if (intent === 'VIEW_PROFILE') {
                            await this.handleViewProfile(user, from);
                        } else if (intent === 'CONTACT_SUPPORT') {
                            const supportMsg = await MistralService.getHimaResponse("User wants to contact support", 'en');
                            await WhatsAppClient.sendTextMessage(from, supportMsg);
                        } else {
                            const response = await MistralService.getHimaResponse(body, 'en');
                            await WhatsAppClient.sendTextMessage(from, response);
                        }
                    } else {
                        await this.sendMainMenu(from);
                    }
                    break;

                // ============================================
                // BUYING FLOW (Step-by-step)
                // ============================================
                case "awaiting_product_selection":
                    console.log("[CONVERSATION] Handling state: awaiting_product_selection");
                    if (message.interactive && message.interactive.type === "button_reply") {
                        const btnId = message.interactive.button_reply.id;
                        if (btnId.startsWith("product_")) {
                            const productId = btnId.replace("product_", "");
                            user.selectedProductId = productId;
                            user.conversationState = "awaiting_coverage_duration";
                            await user.save();

                            // AI prompt for duration selection
                            const durationPrompt = await MistralService.getConversationalPrompt('BUY', 'COVERAGE_DURATION', 'en');
                            await WhatsAppClient.sendTextMessage(from, durationPrompt);

                            // Send duration buttons
                            const durationButtons = [
                                { id: "duration_daily", title: "Daily (~50 KES)" },
                                { id: "duration_weekly", title: "Weekly (~300 KES)" },
                                { id: "duration_monthly", title: "Monthly (~1000 KES)" }
                            ];
                            await WhatsAppClient.sendButtonMessage(from, "Choose your coverage period:", durationButtons);
                        }
                    } else if (type === 'text') {
                        // Handle conversational questions about products
                        const response = await MistralService.getHimaResponse(body, 'en');
                        await WhatsAppClient.sendTextMessage(from, response);
                    }
                    break;

                case "awaiting_coverage_duration":
                    console.log("[CONVERSATION] Handling state: awaiting_coverage_duration");
                    if (message.interactive && message.interactive.type === "button_reply") {
                        const btnId = message.interactive.button_reply.id;
                        let duration = "daily";
                        if (btnId === "duration_daily") duration = "daily";
                        else if (btnId === "duration_weekly") duration = "weekly";
                        else if (btnId === "duration_monthly") duration = "monthly";

                        // Store duration (you may want to add this field to User model)
                        user.conversationState = "awaiting_plate_number";
                        await user.save();

                        // AI prompt for plate number
                        const platePrompt = await MistralService.getConversationalPrompt('BUY', 'BUY_PLATE_NUMBER', 'en', duration);
                        await WhatsAppClient.sendTextMessage(from, platePrompt);
                    } else if (type === 'text') {
                        const response = await MistralService.getHimaResponse(body, 'en');
                        await WhatsAppClient.sendTextMessage(from, response);
                    }
                    break;

                case "awaiting_plate_number":
                    console.log("[CONVERSATION] Handling state: awaiting_plate_number");
                    if (type === "text") {
                        user.plateNumber = body;
                        user.conversationState = "awaiting_confirmation";
                        await user.save();
                        await this.sendPurchaseConfirmation(user, from, body);
                    }
                    break;

                case "awaiting_confirmation":
                    console.log("[CONVERSATION] Handling state: awaiting_confirmation");
                    if (message.interactive && message.interactive.type === "button_reply") {
                        const btnId = message.interactive.button_reply.id;
                        if (btnId === "confirm_purchase") {
                            await this.executePurchase(user, from);
                        } else if (btnId === "cancel_purchase") {
                            user.conversationState = "registered";
                            await user.save();
                            const cancelMsg = await MistralService.getConversationalPrompt('BUY', 'PURCHASE_CANCELLED', 'en');
                            await WhatsAppClient.sendTextMessage(from, cancelMsg);
                            await this.sendMainMenu(from);
                        }
                    }
                    break;

                case "awaiting_payment":
                    console.log("[CONVERSATION] Handling state: awaiting_payment");
                    const pendingMsg = await MistralService.getConversationalPrompt('BUY', 'PAYMENT_PENDING', 'en');
                    await WhatsAppClient.sendTextMessage(from, pendingMsg);
                    break;

                // ============================================
                // CLAIMS FLOW (Step-by-step)
                // ============================================
                case "claim_date":
                    if (type === "text") {
                        user.conversationState = "claim_location";
                        await user.save();
                        const prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_LOCATION', 'en', body);
                        await WhatsAppClient.sendTextMessage(from, prompt);
                    }
                    break;

                case "claim_location":
                    if (type === "text") {
                        user.conversationState = "claim_description";
                        await user.save();
                        const prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_DESCRIPTION', 'en', body);
                        await WhatsAppClient.sendTextMessage(from, prompt);
                    }
                    break;

                case "claim_description":
                    if (type === "text") {
                        user.conversationState = "registered";
                        await user.save();
                        // AI-generated submission confirmation
                        const confirmMsg = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_SUBMITTED', 'en', body);
                        await WhatsAppClient.sendTextMessage(from, confirmMsg);
                        await this.sendMainMenu(from);
                    }
                    break;

                default:
                    console.log(`[CONVERSATION] Handling unknown state: ${user.conversationState}`);
                    const errorMsg = await MistralService.getConversationalPrompt('BUY', 'ERROR_FALLBACK', 'en');
                    await WhatsAppClient.sendTextMessage(from, errorMsg);
                    user.conversationState = user.registrationComplete ? "registered" : "initial";
                    await user.save();
                    break;
            }

        } catch (error) {
            fileLogger.log(`❌ [WHATSAPP] Error handling message: ${error}`, "ERROR");
        }
    }

    private async sendMainMenu(to: string) {
        // AI-generated greeting
        const greeting = await MistralService.getConversationalPrompt('BUY', 'MENU_GREETING', 'en');

        const buttons = [
            { id: "buy_insurance", title: "Buy Insurance" },
            { id: "file_claim", title: "File Claim" },
            { id: "my_profile", title: "My Profile" },
        ];
        await WhatsAppClient.sendButtonMessage(to, greeting, buttons);
    }

    private async handleMenuSelection(user: IUser, from: string, btnId: string) {
        if (btnId === 'buy_insurance') {
            await this.startBuyFlow(user, from);
        } else if (btnId === 'file_claim') {
            await this.startClaimFlow(user, from);
        } else if (btnId === 'my_profile') {
            await this.handleViewProfile(user, from);
        }
    }

    private async startBuyFlow(user: IUser, from: string) {
        // AI-generated intro to buying
        const prompt = await MistralService.getConversationalPrompt('BUY', 'SELECT_COVER', 'en');
        await WhatsAppClient.sendTextMessage(from, prompt);

        const products = await InsuranceProduct.find({ isActive: true });
        const productButtons = products.map(p => ({ id: `product_${p._id}`, title: p.name }));

        await WhatsAppClient.sendButtonMessage(from, "Choose your insurance type:", productButtons);
        user.conversationState = "awaiting_product_selection";
        await user.save();
    }

    private async startClaimFlow(user: IUser, from: string) {
        user.conversationState = "claim_date";
        await user.save();
        const prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_DATE', 'en');
        await WhatsAppClient.sendTextMessage(from, prompt);
    }

    private async handleViewProfile(user: IUser, from: string) {
        const policy = await Policy.findOne({ userId: user._id.toString(), policyStatus: 'active' });

        // AI-generated profile intro
        const intro = await MistralService.getHimaResponse("Show user their profile information", 'en');
        await WhatsAppClient.sendTextMessage(from, intro);

        const profileMsg = `👤 **Profile**\nName: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nWallet: ${user.walletAddress}\n\n📄 **Active Policy**: ${policy ? policy.policyNumber : "None"}`;
        await WhatsAppClient.sendTextMessage(from, profileMsg);
    }

    private async sendPurchaseConfirmation(user: IUser, from: string, plateNumber: string) {
        const selectedProduct = await InsuranceProduct.findById(user.selectedProductId);

        // AI-generated confirmation prompt with details
        const confirmPrompt = await MistralService.getConversationalPrompt(
            'BUY',
            'CONFIRM_PURCHASE',
            'en',
            `Product: ${selectedProduct?.name}, Price: ${selectedProduct?.premiumAmountKES} KES, Plate: ${plateNumber}`
        );

        const buttons = [
            { id: "confirm_purchase", title: "✅ Confirm" },
            { id: "cancel_purchase", title: "❌ Cancel" },
        ];
        await WhatsAppClient.sendButtonMessage(from, confirmPrompt, buttons);
    }

    private async executePurchase(user: IUser, from: string) {
        // AI-generated payment initiation message
        const paymentMsg = await MistralService.getConversationalPrompt('BUY', 'PAYMENT_INITIATED', 'en');
        await WhatsAppClient.sendTextMessage(from, paymentMsg);

        const product = await InsuranceProduct.findById(user.selectedProductId);
        const policyNumber = `HIMA-${uuidv4().toUpperCase()}`;

        const mpesaResponse = await MpesaService.initiateSTKPush(
            user.phoneNumber,
            product ? product.premiumAmountKES : 100,
            policyNumber,
            `Payment for policy ${policyNumber}`
        );

        user.conversationState = "registered";
        await user.save();
        await this.sendMainMenu(from);
    }
}

export default ConversationManager.getInstance();
