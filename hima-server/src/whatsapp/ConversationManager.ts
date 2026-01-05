import { User } from "../models/User.js";
import { InsuranceQuote } from "../models/InsuranceQuote.js";
import { Policy } from "../models/Policy.js";
import { Claim } from "../models/Claim.js";
import { InsuranceProduct } from "../models/InsuranceProduct.js";
import { CONVERSATION_STATES, COVERAGE_TYPES, MESSAGES } from "./constants.js";
import QuoteCalculator from "./QuoteCalculator.js";
import PaymentProcessor from "./PaymentProcessor.js";
import walletManager from "../libs/walletManager.js";
import { logActivity } from "../libs/activityLogger.js";

export class ConversationManager {
    private quoteCalculator = QuoteCalculator;

    async handleUserMessage(
        phoneNumber: string,
        message: string,
        mediaUrl?: string
    ): Promise<any> {
        const result = await this.processLogic(phoneNumber, message, mediaUrl);
        const results = Array.isArray(result) ? result : [result];

        // If user is registered and we don't already have buttons/CTA, add the main menu to the LAST result
        const user = await User.findOne({ phoneNumber });
        const lastResult = results[results.length - 1];
        if (user && user.registrationComplete && !lastResult.buttons && !lastResult.cta && !lastResult.list) {
            lastResult.buttons = MESSAGES.MAIN_MENU_OPTIONS;
        }

        return results;
    }

    private async processLogic(
        phoneNumber: string,
        message: string,
        mediaUrl?: string
    ): Promise<any | any[]> {
        // Get or create user
        let user = await User.findOne({ phoneNumber });

        if (!user) {
            // Generate EVM Wallet
            const wallet = walletManager.generateWallet();

            user = new User({
                phoneNumber,
                conversationState: CONVERSATION_STATES.INITIAL,
                walletAddress: wallet.address,
                walletPrivateKey: wallet.encryptedPrivateKey,
            });
            await user.save();
            await logActivity("REGISTRATION", `New user starting registration from ${phoneNumber}`, user._id.toString());
        }

        if (!user) throw new Error("User creation failed"); // Should not happen

        const cleanMessage = message.trim().toLowerCase();
        const isGreeting = ["hi", "hello", "hey", "start", "jambo"].includes(cleanMessage);

        // AGGRESSIVE GREETING CATCH
        if (isGreeting) {
            await logActivity("SYSTEM", `User ${phoneNumber} sent greeting: ${cleanMessage}`, user._id.toString());

            if (user.registrationComplete) {
                return {
                    body: MESSAGES.GREETING_REGISTERED(user.firstName || "Rider"),
                    buttons: MESSAGES.MAIN_MENU_OPTIONS
                };
            } else {
                return {
                    body: `Jambo! ${MESSAGES.WELCOME}`,
                    buttons: ["Register Now"]
                };
            }
        }

        // Catch 'Register Now' or start registration
        if (cleanMessage.includes("register now")) {
            user.conversationState = CONVERSATION_STATES.GREETING; // State for asking first name
            await user.save();
            return { body: MESSAGES.ASKING_FIRST_NAME };
        }

        // GLOBAL CTA INTERCEPTOR (If user clicks a button)
        const msg = cleanMessage.toLowerCase();

        if (msg.includes("buy insurance")) {
            if (!user.registrationComplete) {
                user.conversationState = CONVERSATION_STATES.GREETING; // Starting registration
                await user.save();
                return [
                    { body: "🚀 Let's get you protected! First, we need to complete your quick registration." },
                    { body: MESSAGES.ASKING_FIRST_NAME }
                ];
            }
            user.conversationState = CONVERSATION_STATES.ASKING_MOTORCYCLE_MAKE;
            await user.save();
            return { body: MESSAGES.ASKING_MOTORCYCLE_MAKE };
        }

        if (msg.includes("file a claim") || msg.includes("file claim")) {
            if (!user.registrationComplete) {
                return {
                    body: "⚠️ You need to be registered and have an active policy to file a claim.",
                    buttons: ["Register Now", "Main Menu"]
                };
            }
            await logActivity("SYSTEM", `User ${phoneNumber} initiating claim flow`, user._id.toString());
            user.conversationState = CONVERSATION_STATES.ASKING_CLAIM_DESCRIPTION;
            await user.save();
            return { body: MESSAGES.ASKING_CLAIM_DESCRIPTION };
        }

        if (msg.includes("my profile")) {
            return {
                body: `Here is your profile link, ${user.firstName || "Rider"}:`,
                cta: { label: "Open Profile", url: `http://localhost:3000/dashboard/user/profile?phone=${phoneNumber}` }
            };
        }

        // GLOBAL COPY CODE HANDLER (For interactive buttons)
        if (cleanMessage === "copy code") {
            const u = await User.findOne({ phoneNumber });
            if (u && u.lastLoginCode) {
                return [
                    { body: u.lastLoginCode },
                    { body: "✅ Code copied! You can now paste it in the login screen." }
                ];
            }
        }

        // Route based on conversation state
        switch (user.conversationState) {
            case CONVERSATION_STATES.INITIAL:
                user.conversationState = CONVERSATION_STATES.GREETING;
                await user.save();
                return {
                    body: MESSAGES.WELCOME,
                    buttons: ["Register Now"]
                };

            case CONVERSATION_STATES.GREETING:
                if (message.trim().length === 0) {
                    return { body: MESSAGES.ERROR };
                }
                user.firstName = message.trim();
                user.conversationState = CONVERSATION_STATES.ASKING_NATIONAL_ID;
                await user.save();
                return { body: MESSAGES.ASKING_NATIONAL_ID };

            case CONVERSATION_STATES.ASKING_NATIONAL_ID:
                if (message.trim().length === 0) {
                    return { body: MESSAGES.ERROR };
                }
                user.nationalId = message.trim();
                user.conversationState = CONVERSATION_STATES.ASKING_ID_PHOTO;
                await user.save();
                await logActivity("KYC_SUBMITTED", `User ${phoneNumber} provided National ID`, user._id.toString());
                return { body: MESSAGES.ASKING_ID_PHOTO };

            case CONVERSATION_STATES.ASKING_ID_PHOTO:
                if (mediaUrl) {
                    user.idPhotoUrl = mediaUrl;
                    user.kycStatus = "pending";
                    user.conversationState = CONVERSATION_STATES.WAITING_FOR_APPROVAL;
                    await user.save();
                    const body = MESSAGES.WAITING_FOR_APPROVAL(user.firstName || "Customer", user.nationalId || "Pending", phoneNumber, user.walletAddress || "N/A");
                    return {
                        body,
                        cta: { label: "View My Profile", url: `http://localhost:3000/dashboard/user/profile?phone=${phoneNumber}` }
                    };
                }

                if (message.trim().length > 0) {
                    user.idPhotoUrl = "simulated_url_" + Date.now();
                    user.kycStatus = "pending";
                    user.conversationState = CONVERSATION_STATES.WAITING_FOR_APPROVAL;
                    await user.save();
                    const body = MESSAGES.WAITING_FOR_APPROVAL(user.firstName || "Customer", user.nationalId || "Pending", phoneNumber, user.walletAddress || "N/A");
                    return {
                        body,
                        cta: { label: "View My Profile", url: `http://localhost:3000/dashboard/user/profile?phone=${phoneNumber}` }
                    };
                }

                return { body: "Please upload a photo of your National ID." };

            case CONVERSATION_STATES.WAITING_FOR_APPROVAL:
                if (user.kycStatus === "verified") {
                    return {
                        body: `${MESSAGES.KYC_APPROVED(user.firstName || "Rider")}\n\nWould you like to get covered now?`,
                        buttons: ["Buy Insurance", "Main Menu"]
                    };
                } else if (user.kycStatus === "rejected") {
                    return { body: MESSAGES.ACCOUNT_REJECTED };
                } else {
                    return {
                        body: MESSAGES.WAITING_FOR_APPROVAL(user.firstName || "Customer", user.nationalId || "Pending", phoneNumber, user.walletAddress || "N/A"),
                        buttons: ["My Profile", "Main Menu"]
                    };
                }

            case CONVERSATION_STATES.ASKING_MOTORCYCLE_MAKE:
                if (message.trim().length === 0) {
                    return { body: MESSAGES.ERROR };
                }
                user.motorcycleMake = message.trim();
                user.conversationState = CONVERSATION_STATES.ASKING_MOTORCYCLE_MODEL;
                await user.save();
                return { body: MESSAGES.ASKING_MOTORCYCLE_MODEL };

            case CONVERSATION_STATES.ASKING_MOTORCYCLE_MODEL:
                if (message.trim().length === 0) {
                    return { body: MESSAGES.ERROR };
                }
                user.motorcycleModel = message.trim();
                user.conversationState = CONVERSATION_STATES.ASKING_MOTORCYCLE_YEAR;
                await user.save();
                return { body: MESSAGES.ASKING_MOTORCYCLE_YEAR };

            case CONVERSATION_STATES.ASKING_MOTORCYCLE_YEAR:
                const year = parseInt(message.trim());
                if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
                    return { body: `Please enter a valid year between 1900 and ${new Date().getFullYear()}` };
                }
                user.motorcycleYear = year;
                user.conversationState = CONVERSATION_STATES.ASKING_REGISTRATION;
                await user.save();
                return { body: MESSAGES.ASKING_REGISTRATION };

            case CONVERSATION_STATES.ASKING_REGISTRATION:
                if (message.trim().length === 0) {
                    return { body: MESSAGES.ERROR };
                }
                user.registrationNumber = message.trim();
                user.conversationState = CONVERSATION_STATES.ASKING_MOTORCYCLE_VALUE;
                await user.save();
                return { body: MESSAGES.ASKING_MOTORCYCLE_VALUE };

            case CONVERSATION_STATES.ASKING_MOTORCYCLE_VALUE:
                const value = parseFloat(message.trim());
                if (isNaN(value) || value <= 0) {
                    return { body: "Please enter a valid motorcycle value in numbers (e.g., 50000)" };
                }
                user.motorcycleValue = value;
                user.conversationState = CONVERSATION_STATES.ASKING_INSURANCE_PRODUCT;
                await user.save();

                const products = await InsuranceProduct.find({ isActive: true });
                return {
                    body: "Please select an insurance plan from the list below:",
                    list: {
                        buttonText: "View Plans",
                        sections: [
                            {
                                title: "Available Plans",
                                rows: products.map((p, i) => ({
                                    id: (i + 1).toString(),
                                    title: p.name.substring(0, 24),
                                    description: `KES ${p.premiumAmountKES} - ${p.description}`.substring(0, 72)
                                }))
                            }
                        ]
                    }
                };

            case CONVERSATION_STATES.ASKING_INSURANCE_PRODUCT:
                const productIndex = parseInt(message.trim()) - 1;
                const availableProducts = await InsuranceProduct.find({ isActive: true });

                if (isNaN(productIndex) || productIndex < 0 || productIndex >= availableProducts.length) {
                    return { body: MESSAGES.INVALID_INPUT };
                }

                const selectedProd = availableProducts[productIndex];
                if (!selectedProd) return { body: MESSAGES.INVALID_INPUT };

                user.selectedProductId = selectedProd._id.toString();
                user.coverageType = selectedProd.tier as any;
                user.conversationState = CONVERSATION_STATES.SHOWING_QUOTE;
                await user.save();

                await logActivity("QUOTE_GENERATED", `Quote generated for user ${phoneNumber} using ${selectedProd.name}`, user._id.toString());
                return await this.generateAndShowQuote(user, selectedProd.tier);

            case CONVERSATION_STATES.SHOWING_QUOTE:
                user.conversationState = CONVERSATION_STATES.ASKING_QUOTE_ACCEPTANCE;
                await user.save();
                const quote = await InsuranceQuote.findOne({ userId: user._id.toString() }).sort({ createdAt: -1 });
                if (quote && new Date() < quote.validUntil && !quote.isAccepted) {
                    return {
                        body: `${this.formatQuoteDetails(quote)}`,
                        buttons: ["YES", "NO"]
                    };
                }
                return { body: MESSAGES.ERROR };

            case CONVERSATION_STATES.ASKING_QUOTE_ACCEPTANCE:
                const response = message.trim().toUpperCase();
                if (response === "YES" || response === "1") {
                    const activeQuote = await InsuranceQuote.findOne({ userId: user._id.toString() }).sort({ createdAt: -1 });
                    if (!activeQuote) return { body: MESSAGES.ERROR };

                    activeQuote.isAccepted = true;
                    await activeQuote.save();

                    user.conversationState = CONVERSATION_STATES.PROCESSING_PAYMENT;
                    user.quotedPrice = activeQuote.totalPrice;
                    await user.save();

                    await logActivity("PAYMENT_RECEIVED", `User ${phoneNumber} initiating payment for KES ${activeQuote.totalPrice.toFixed(2)}`, user._id.toString(), { quoteId: activeQuote._id });
                    return await this.initiatePayment(user, activeQuote);
                } else if (response === "NO" || response === "2") {
                    user.conversationState = CONVERSATION_STATES.ASKING_COVERAGE_TYPE;
                    await user.save();
                    return {
                        body: `Let's find a better option for you.\n\n${MESSAGES.ASKING_COVERAGE}`,
                        buttons: ["1", "2", "3"]
                    };
                } else {
                    return { body: MESSAGES.INVALID_INPUT, buttons: ["YES", "NO"] };
                }

            case CONVERSATION_STATES.PROCESSING_PAYMENT:
                user.conversationState = CONVERSATION_STATES.PAYMENT_COMPLETE;
                await user.save();
                return await this.handlePaymentCompletion(user);

            case CONVERSATION_STATES.CLAIM_SUBMITTED:
                return {
                    body: MESSAGES.MAIN_MENU(user.firstName || "Rider"),
                    buttons: MESSAGES.MAIN_MENU_OPTIONS
                };

            case CONVERSATION_STATES.ASKING_CLAIM_DESCRIPTION:
                const activePolicy = await Policy.findOne({ userId: user._id.toString() }).sort({ createdAt: -1 });
                const newClaim = new Claim({
                    userId: user._id.toString(),
                    policyId: activePolicy ? activePolicy._id.toString() : "GENERIC",
                    incidentDescription: message,
                    incidentTime: new Date(),
                    incidentLocation: "Unknown",
                    status: "received"
                });
                await newClaim.save();
                user.conversationState = CONVERSATION_STATES.ASKING_CLAIM_PHOTO;
                await user.save();
                await logActivity("CLAIM_FILED", `User ${phoneNumber} filed a claim: ${message}`, user._id.toString(), { claimId: newClaim._id });
                return { body: MESSAGES.ASKING_CLAIM_PHOTO };

            case CONVERSATION_STATES.ASKING_CLAIM_PHOTO:
                const lastClaim = await Claim.findOne({ userId: user._id.toString() }).sort({ createdAt: -1 });
                if (lastClaim) {
                    if (mediaUrl) {
                        lastClaim.mediaUrls.push(mediaUrl);
                        await lastClaim.save();
                    } else if (message.trim().length > 0) {
                        lastClaim.mediaUrls.push("simulated_claim_photo_" + Date.now());
                        await lastClaim.save();
                    }
                }
                user.conversationState = CONVERSATION_STATES.CLAIM_SUBMITTED;
                await user.save();
                return {
                    body: MESSAGES.CLAIM_SUBMITTED,
                    buttons: MESSAGES.MAIN_MENU_OPTIONS
                };

            default:
                user.conversationState = CONVERSATION_STATES.GREETING;
                await user.save();
                return { body: MESSAGES.WELCOME };
        }
    }

    private async generateAndShowQuote(user: any, coverageType: string): Promise<{ body: string, buttons?: string[] }> {
        try {
            if (!user.motorcycleMake || !user.motorcycleModel || !user.motorcycleYear || !user.motorcycleValue) {
                return { body: MESSAGES.ERROR };
            }

            const quote = await this.quoteCalculator.calculateQuote(
                user._id.toString(),
                user.motorcycleMake,
                user.motorcycleModel,
                user.motorcycleYear,
                user.motorcycleValue,
                coverageType
            );

            const formattedPrice = this.quoteCalculator.formatPrice(quote.totalPrice);
            const coverageName = coverageType.charAt(0).toUpperCase() + coverageType.slice(1);

            return {
                body: `${MESSAGES.QUOTE_READY(user.firstName || "Customer", user.motorcycleMake, user.motorcycleModel, coverageName, formattedPrice)}`,
                buttons: ["YES", "NO"]
            };
        } catch (error) {
            console.error("Error generating quote:", error);
            return { body: MESSAGES.ERROR };
        }
    }

    private formatQuoteDetails(quote: any): string {
        return `
Quote Details:
- Motorcycle: ${quote.motorcycleMake} ${quote.motorcycleModel} (${quote.motorcycleYear})
- Coverage Type: ${quote.coverageType.toUpperCase()}
- Monthly Premium: KES ${quote.totalPrice.toFixed(2)}
- Valid Until: ${quote.validUntil.toLocaleDateString()}

Ready to proceed?`;
    }

    private async initiatePayment(user: any, quote: any): Promise<{ body: string, cta?: { label: string, url: string } }> {
        try {
            const paymentLink = await new PaymentProcessor({
                rpcUrl: process.env.RPC_URL || "",
                contractAddress: process.env.CONTRACT_ADDRESS || "",
                privateKey: process.env.PRIVATE_KEY || "",
                stableCoinAddress: process.env.STABLECOIN_ADDRESS || "",
                chainId: parseInt(process.env.CHAIN_ID || "1"),
            }).generatePaymentLink(quote.totalPrice, `HIMA_${Date.now()}`);

            return {
                body: `${MESSAGES.PAYMENT_INSTRUCTIONS(quote.totalPrice.toFixed(2))}\n\nYour payment is secure and encrypted.`,
                cta: { label: "Pay Now", url: paymentLink }
            };
        } catch (error) {
            console.error("Error initiating payment:", error);
            return { body: "Sorry, there was an issue with payment processing. Please try again later." };
        }
    }

    private async handlePaymentCompletion(user: any): Promise<{ body: string, cta?: { label: string, url: string } }> {
        try {
            const policyNumber = `HIMA${Date.now()}`;
            const quote = await InsuranceQuote.findOne({ userId: user._id, isAccepted: true }).sort({ createdAt: -1 });

            if (!quote) return { body: MESSAGES.ERROR };

            const policy = new Policy({
                userId: user._id.toString(),
                quoteId: quote._id.toString(),
                policyNumber,
                motorcycleMake: quote.motorcycleMake,
                motorcycleModel: quote.motorcycleModel,
                motorcycleYear: quote.motorcycleYear,
                registrationNumber: user.registrationNumber,
                coverageType: quote.coverageType,
                premiumAmount: quote.totalPrice,
                premiumInUSD: quote.priceInUSD,
                policyStartDate: new Date(),
                policyEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                walletAddress: user.walletAddress || "",
                transactionHash: "",
                paymentStatus: "completed",
                policyStatus: "active",
            });

            await policy.save();

            user.policyStatus = "active";
            user.registrationComplete = true;
            user.conversationState = CONVERSATION_STATES.POLICY_ISSUED;
            await user.save();

            return {
                body: MESSAGES.PAYMENT_CONFIRMATION(policyNumber, quote.coverageType),
                buttons: ["File a Claim", "My Profile"],
                cta: { label: "View Policy", url: `http://localhost:3000/dashboard/user/profile?phone=${user.phoneNumber}` }
            } as any;
        } catch (error) {
            console.error("Error handling payment completion:", error);
            return { body: MESSAGES.ERROR };
        }
    }

    async handleMediaMessage(phoneNumber: string, mediaType: "image" | "video" | "document", mediaBuffer: Buffer, mimeType: string): Promise<{ body: string }> {
        console.log(`Received ${mediaType} from ${phoneNumber}`);
        const simulatedUrl = `https://api.hima.check/uploads/${Date.now()}_${mediaType}`;
        return this.processLogic(phoneNumber, "", simulatedUrl);
    }
}

export default new ConversationManager();
