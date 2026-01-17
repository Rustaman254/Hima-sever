import WhatsAppClient from "./WhatsAppClient.js";
import { User, type IUser } from "../models/User.js";
import { InsuranceProduct } from "../models/InsuranceProduct.js";
import { Policy } from "../models/Policy.js";
import { createWallet } from "../libs/walletManager.js";
import MpesaService from "../services/MpesaService.js";
import { v4 as uuidv4 } from 'uuid';
import { fileLogger } from "../libs/fileLogger.js";

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

            // Handle "hi" / "hello" to restart or show menu
            // Handle greetings
            if (
                type === "text" &&
                typeof message.text?.body === "string"
            ) {
                const body = message.text.body.trim().toLowerCase();
                const greetingRegex = /^(hi|hello|hey|hola|habari|morning|good\s?morning|evening|good\s?evening|afternoon|good\s?afternoon)$/i;

                if (greetingRegex.test(body)) {
                    fileLogger.log(`[CONVERSATION] User said '${body}', checking status...`);

                    if (user.registrationComplete) {
                        // Ensure we aren't overwriting an active flow unless it's a hard reset? 
                        // For now, greetings always show the menu if registered.
                        user.conversationState = "registered";
                        await user.save();
                        await WhatsAppClient.sendTextMessage(from, `Welcome back, ${user.firstName}! 👋`);
                    } else {
                        // If not registered, we might want to continue the registration flow or restart it?
                        // If they say "hi" in the middle of registration, maybe we shouldn't reset?
                        // The original logic reset to "initial". I'll keep it simple: greetings reset to initial or registered menu.
                        if (user.conversationState !== "initial") {
                            // Optional: Ask if they want to restart? 
                            // For now, let's reset to initial to be safe if they are stuck.
                            user.conversationState = "initial";
                            await user.save();
                        }
                    }

                    if (user.registrationComplete) {
                        await this.sendMainMenu(from);
                        return;
                    } else {
                        // Re-trigger the initial state logic
                        // await this.handleMessage({ ...message, type: "system_trigger" });
                        // return;
                    }
                }
            }


            // State machine
            console.log(`[CONVERSATION] User: ${user.phoneNumber}, State: ${user.conversationState}`);
            switch (user.conversationState) {
                case "initial":
                    console.log("[CONVERSATION] Handling state: initial");
                    await WhatsAppClient.sendTextMessage(from, `Hello ${name}! 👋\nWelcome to Hima Insurance.\nLet's get you registered.\nWhat is your first name?`);
                    user.conversationState = "awaiting_first_name";
                    await user.save();
                    break;

                case "awaiting_first_name":
                    console.log("[CONVERSATION] Handling state: awaiting_first_name");
                    if (type === "text") {
                        user.firstName = message.text.body;
                        user.conversationState = "awaiting_last_name";
                        await user.save();
                        await WhatsAppClient.sendTextMessage(from, "Great. What is your last name?");
                    } else {
                        await WhatsAppClient.sendTextMessage(from, "Please tell me your first name.");
                    }
                    break;

                case "awaiting_last_name":
                    console.log("[CONVERSATION] Handling state: awaiting_last_name");
                    if (type === "text") {
                        user.lastName = message.text.body;
                        user.conversationState = "awaiting_email";
                        await user.save();
                        await WhatsAppClient.sendTextMessage(from, "Got it. What is your email address?");
                    } else {
                        await WhatsAppClient.sendTextMessage(from, "Please tell me your last name.");
                    }
                    break;

                case "awaiting_email":
                    console.log("[CONVERSATION] Handling state: awaiting_email");
                    if (type === "text" && message.text.body.includes("@")) {
                        user.email = message.text.body;

                        // Create wallet
                        console.log("[CONVERSATION] Creating wallet for user");
                        const wallet = createWallet();
                        user.walletAddress = wallet.address;
                        user.walletPrivateKey = wallet.privateKey; // This should be encrypted

                        user.registrationComplete = true;
                        user.conversationState = "registered";
                        await user.save();

                        await WhatsAppClient.sendTextMessage(from, "🎉 Registration complete! Your wallet has been created.\n\nWhat would you like to do next?");
                        await this.sendMainMenu(from);
                    } else {
                        await WhatsAppClient.sendTextMessage(from, "Please provide a valid email address.");
                    }
                    break;

                case "registered":
                    console.log("[CONVERSATION] Handling state: registered");
                    if (message.interactive && message.interactive.type === "button_reply") {
                        const btnId = message.interactive.button_reply.id;
                        if (btnId === 'buy_insurance') {
                            await WhatsAppClient.sendTextMessage(from, "Let's get you covered. Please choose a product from the list below.");
                            user.conversationState = "purchase_flow_start";
                            await user.save();
                            await this.handleMessage(message);
                        } else if (btnId === 'my_policies') {
                            await WhatsAppClient.sendTextMessage(from, "This feature is coming soon.");
                        } else {
                            await this.sendMainMenu(from);
                        }
                    } else {
                        await this.sendMainMenu(from);
                    }
                    break;

                case "purchase_flow_start":
                    console.log("[CONVERSATION] Handling state: purchase_flow_start");
                    const products = await InsuranceProduct.find({ isActive: true });
                    const productButtons = products.map(p => ({ id: `product_${p._id}`, title: p.name }));
                    await WhatsAppClient.sendButtonMessage(from, "Please select a product:", productButtons);
                    user.conversationState = "awaiting_product_selection";
                    await user.save();
                    break;

                case "awaiting_product_selection":
                    console.log("[CONVERSATION] Handling state: awaiting_product_selection");
                    if (message.interactive && message.interactive.type === "button_reply") {
                        const btnId = message.interactive.button_reply.id;
                        if (btnId.startsWith("product_")) {
                            const productId = btnId.replace("product_", "");
                            user.selectedProductId = productId;
                            user.conversationState = "awaiting_plate_number";
                            await user.save();
                            await WhatsAppClient.sendTextMessage(from, "Great choice! What is your motorcycle's plate number?");
                        } else {
                            await WhatsAppClient.sendTextMessage(from, "Please select a product from the list.");
                        }
                    } else {
                        await WhatsAppClient.sendTextMessage(from, "Please select a product from the list.");
                    }
                    break;

                case "awaiting_plate_number":
                    console.log("[CONVERSATION] Handling state: awaiting_plate_number");
                    if (type === "text") {
                        user.plateNumber = message.text.body;
                        user.conversationState = "awaiting_confirmation";
                        await user.save();

                        const selectedProduct = await InsuranceProduct.findById(user.selectedProductId);

                        const confirmationText = `Please confirm your selection:\n\n*Product:* ${selectedProduct?.name}\n*Plate Number:* ${user.plateNumber}\n*Premium:* KES ${selectedProduct?.premiumAmountKES}\n\nDo you want to proceed with the purchase?`;
                        const confirmationButtons = [
                            { id: "confirm_purchase", title: "Yes, proceed" },
                            { id: "cancel_purchase", title: "No, cancel" },
                        ];
                        await WhatsAppClient.sendButtonMessage(from, confirmationText, confirmationButtons);
                    } else {
                        await WhatsAppClient.sendTextMessage(from, "Please provide your motorcycle's plate number.");
                    }
                    break;

                case "awaiting_confirmation":
                    console.log("[CONVERSATION] Handling state: awaiting_confirmation");
                    if (message.interactive && message.interactive.type === "button_reply") {
                        const btnId = message.interactive.button_reply.id;
                        if (btnId === "confirm_purchase") {
                            const selectedProduct = await InsuranceProduct.findById(user.selectedProductId);
                            if (!selectedProduct) {
                                await WhatsAppClient.sendTextMessage(from, "Sorry, something went wrong. Please try again.");
                                user.conversationState = "registered";
                                await user.save();
                                return;
                            }

                            const policyNumber = `HIMA-${uuidv4().toUpperCase()}`;
                            const newPolicy = new Policy({
                                userId: user._id,
                                productId: user.selectedProductId,
                                policyNumber,
                                motorcycleMake: user.motorcycleMake,
                                motorcycleModel: user.motorcycleModel,
                                motorcycleYear: user.motorcycleYear,
                                registrationNumber: user.plateNumber,
                                coverageType: selectedProduct.coverageType,
                                tier: selectedProduct.tier,
                                premiumAmount: selectedProduct.premiumAmountKES,
                                sumAssuredKES: selectedProduct.sumAssuredKES,
                                policyStartDate: new Date(),
                                policyEndDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Assuming weekly policy for now
                                maturityDate: new Date(new Date().setDate(new Date().getDate() + 7)),
                                paymentStatus: "pending",
                                policyStatus: "pending",
                                offChainMetadata: {},
                            });


                            console.log("[CONVERSATION] Initiating STK push");
                            const mpesaResponse = await MpesaService.initiateSTKPush(
                                user.phoneNumber,
                                selectedProduct.premiumAmountKES,
                                policyNumber,
                                `Payment for policy ${policyNumber}`
                            );


                            if (!newPolicy.offChainMetadata) {
                                newPolicy.offChainMetadata = {};
                            }
                            newPolicy.offChainMetadata.checkoutRequestID = mpesaResponse.CheckoutRequestID;
                            await newPolicy.save();

                            user.conversationState = "awaiting_payment";
                            await user.save();

                            await WhatsAppClient.sendTextMessage(from, "Please check your phone to complete the payment.");

                        } else if (btnId === "cancel_purchase") {
                            user.conversationState = "registered";
                            await user.save();
                            await WhatsAppClient.sendTextMessage(from, "Purchase cancelled. What would you like to do next?");
                            await this.sendMainMenu(from);
                        }
                    }
                    break;

                case "awaiting_payment":
                    console.log("[CONVERSATION] Handling state: awaiting_payment");
                    // The user will be in this state until the payment is confirmed via the callback
                    await WhatsAppClient.sendTextMessage(from, "We are still waiting for your payment to be confirmed. Please complete the payment on your phone.");
                    break;


                default:
                    console.log(`[CONVERSATION] Handling unknown state: ${user.conversationState}`);
                    await WhatsAppClient.sendTextMessage(from, "I'm not sure how to handle this. Let me restart the conversation for you.");
                    user.conversationState = "initial";
                    await user.save();
                    await this.handleMessage(message); // Re-run the logic
                    break;
            }

        } catch (error) {
            fileLogger.log(`❌ [WHATSAPP] Error handling message: ${error}`, "ERROR");
        }
    }

    private async sendMainMenu(to: string) {
        const buttons = [
            { id: "buy_insurance", title: "Buy Insurance" },
            { id: "my_policies", title: "My Policies" },
            { id: "help", title: "Help" },
        ];
        await WhatsAppClient.sendButtonMessage(to, "How can I help you?", buttons);
    }
}

export default ConversationManager.getInstance();
