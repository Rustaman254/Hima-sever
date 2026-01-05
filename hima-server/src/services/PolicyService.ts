import { Policy } from "../models/Policy.ts";
import type { IPolicy } from "../models/Policy.ts";
import { User } from "../models/User.ts";
import { Payment } from "../models/Payment.ts";
import MantleService from "./MantleService.ts";
import MpesaService from "./MpesaService.ts";

/**
 * Policy Service
 * Manages policy lifecycle from quote to activation
 */
class PolicyService {
    /**
     * Generate human-readable policy ID
     */
    generatePolicyId(coverageType: "trip" | "daily" | "weekly" | "monthly"): string {
        const typePrefix =
            coverageType === "trip"
                ? "TRIP"
                : coverageType === "daily"
                    ? "DAILY"
                    : coverageType === "weekly"
                        ? "WEEKLY"
                        : "MONTHLY";
        const date = (new Date().toISOString().split("T")[0] || "").replace(/-/g, "");
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");

        return `HIMA-${typePrefix}-${date}-${random}`;
    }

    /**
     * Calculate premium and sum assured based on coverage type and tier
     */
    calculatePricing(
        coverageType: "trip" | "daily" | "weekly" | "monthly",
        tier: "basic" | "standard" | "plus"
    ): { premiumKES: number; sumAssuredKES: number } {
        // Base premiums in KES
        const basePremiums = {
            trip: { basic: 50, standard: 100, plus: 200 },
            daily: { basic: 100, standard: 200, plus: 400 },
            weekly: { basic: 500, standard: 1000, plus: 2000 },
            monthly: { basic: 1500, standard: 3000, plus: 6000 },
        };

        // Coverage multipliers
        const multipliers = {
            basic: 10, // 10x premium
            standard: 20, // 20x premium
            plus: 50, // 50x premium
        };

        const premiumKES = basePremiums[coverageType][tier];
        const sumAssuredKES = premiumKES * multipliers[tier];

        return { premiumKES, sumAssuredKES };
    }

    /**
     * Calculate policy duration
     */
    calculateDuration(
        coverageType: "trip" | "daily" | "weekly" | "monthly"
    ): { startTime: Date; endTime: Date } {
        const startTime = new Date();
        const endTime = new Date();

        if (coverageType === "trip") {
            // Trip coverage: 12 hours
            endTime.setHours(endTime.getHours() + 12);
        } else if (coverageType === "daily") {
            // Daily coverage: 24 hours
            endTime.setHours(endTime.getHours() + 24);
        } else if (coverageType === "weekly") {
            // Weekly coverage: 7 days
            endTime.setDate(endTime.getDate() + 7);
        } else {
            // Monthly coverage: 30 days
            endTime.setDate(endTime.getDate() + 30);
        }

        return { startTime, endTime };
    }

    /**
     * Create policy (after payment confirmation)
     */
    async createPolicy(
        userId: string,
        phoneNumber: string,
        coverageType: "trip" | "daily" | "weekly" | "monthly",
        tier: "basic" | "standard" | "plus",
        paymentId: string
    ): Promise<IPolicy> {
        try {
            // Generate policy ID
            const policyNumber = this.generatePolicyId(coverageType);

            // Calculate pricing
            const { premiumKES, sumAssuredKES } = this.calculatePricing(
                coverageType,
                tier
            );

            // Calculate duration
            const { startTime, endTime } = this.calculateDuration(coverageType);

            // Create policy in database
            const policy = new Policy({
                userId,
                policyNumber,
                coverageType,
                tier,
                premiumAmountKES: premiumKES,
                sumAssuredKES,
                startTime,
                endTime,
                paymentStatus: "completed",
                policyStatus: "pending", // Will be active after blockchain confirmation
                blockchainNetwork: "mantle-testnet",
            });

            await policy.save();

            // Create policy on blockchain
            try {
                const { policyIndex, txHash } = await MantleService.createPolicy(
                    policyNumber,
                    phoneNumber,
                    coverageType,
                    tier,
                    startTime,
                    endTime,
                    sumAssuredKES,
                    premiumKES
                );

                // Update policy with blockchain info
                policy.onChainPolicyId = policyIndex.toString();
                policy.activationTxHash = txHash;
                policy.policyStatus = "active";
                await policy.save();

                // Record premium in RiskPool
                await MantleService.recordPremium(policyIndex, premiumKES);

                console.log(`✅ Policy created: ${policyNumber}`);
            } catch (blockchainError: any) {
                console.error("❌ Blockchain error:", blockchainError.message);
                // Policy created in DB but not on-chain
                // Admin can retry blockchain activation later
            }

            return policy;
        } catch (error: any) {
            console.error("❌ Error creating policy:", error.message);
            throw new Error("Failed to create policy");
        }
    }

    /**
     * Initiate policy purchase (trigger M-Pesa payment)
     */
    async initiatePurchase(
        userId: string,
        phoneNumber: string,
        coverageType: "trip" | "daily" | "weekly" | "monthly",
        tier: "basic" | "standard" | "plus"
    ): Promise<{ checkoutRequestID: string; premiumKES: number }> {
        try {
            // Calculate pricing
            const { premiumKES } = this.calculatePricing(coverageType, tier);

            // Generate temporary policy reference
            const reference = `HIMA-${coverageType.toUpperCase()}-${Date.now()}`;

            // Initiate STK Push
            const response = await MpesaService.initiateSTKPush(
                phoneNumber,
                premiumKES,
                reference,
                `Hima ${coverageType} insurance`
            );

            // Create pending payment record
            const payment = new Payment({
                userId,
                mpesaTransactionId: response.CheckoutRequestID,
                phoneNumber,
                amountKES: premiumKES,
                status: "pending",
                paymentType: "premium",
                rawCallbackPayload: response,
            });

            await payment.save();

            return {
                checkoutRequestID: response.CheckoutRequestID,
                premiumKES,
            };
        } catch (error: any) {
            console.error("❌ Error initiating purchase:", error.message);
            throw new Error("Failed to initiate payment");
        }
    }

    /**
     * Get user's active policies
     */
    async getUserActivePolicies(userId: string): Promise<IPolicy[]> {
        try {
            return await Policy.find({
                userId,
                policyStatus: "active",
                endTime: { $gt: new Date() },
            }).sort({ createdAt: -1 });
        } catch (error: any) {
            console.error("❌ Error getting user policies:", error.message);
            throw new Error("Failed to get user policies");
        }
    }

    /**
     * Get policy by ID
     */
    async getPolicyById(policyId: string): Promise<IPolicy | null> {
        try {
            return await Policy.findById(policyId);
        } catch (error: any) {
            console.error("❌ Error getting policy:", error.message);
            return null;
        }
    }

    /**
     * Get policy by policy number
     */
    async getPolicyByNumber(policyNumber: string): Promise<IPolicy | null> {
        try {
            return await Policy.findOne({ policyNumber });
        } catch (error: any) {
            console.error("❌ Error getting policy:", error.message);
            return null;
        }
    }

    /**
     * Check and update expired policies
     */
    async updateExpiredPolicies(): Promise<void> {
        try {
            const expiredPolicies = await Policy.find({
                policyStatus: "active",
                endTime: { $lt: new Date() },
            });

            for (const policy of expiredPolicies) {
                policy.policyStatus = "expired";
                await policy.save();

                // Update on-chain status if available
                if (policy.onChainPolicyId) {
                    try {
                        await MantleService.updatePolicyStatus(
                            parseInt(policy.onChainPolicyId),
                            "expired"
                        );
                    } catch (error) {
                        console.error(
                            `Failed to update on-chain status for policy ${policy.policyNumber}`
                        );
                    }
                }
            }

            if (expiredPolicies.length > 0) {
                console.log(`✅ Updated ${expiredPolicies.length} expired policies`);
            }
        } catch (error: any) {
            console.error("❌ Error updating expired policies:", error.message);
        }
    }
}

export default new PolicyService();
