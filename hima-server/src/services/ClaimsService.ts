import { Claim, type IClaim } from "../models/Claim.js";
import { Policy } from "../models/Policy.js";
import { Payment } from "../models/Payment.js";
import MantleService from "./MantleService.js";
import MpesaService from "./MpesaService.js";

/**
 * Claims Service
 * Manages claim submission, review, approval, and payout
 */
class ClaimsService {
    /**
     * Submit a new claim
     */
    async submitClaim(
        userId: string,
        policyId: string,
        incidentTime: Date,
        incidentLocation: string,
        incidentDescription: string,
        mediaUrls: string[] = []
    ): Promise<IClaim> {
        try {
            // Verify policy exists and is active
            const policy = await Policy.findById(policyId);
            if (!policy) {
                throw new Error("Policy not found");
            }

            if (policy.policyStatus !== "active") {
                throw new Error("Policy is not active");
            }

            if (policy.endTime && new Date() > policy.endTime) {
                throw new Error("Policy has expired");
            }

            // Create claim in database
            const claim = new Claim({
                policyId,
                userId,
                incidentTime,
                incidentLocation,
                incidentDescription,
                mediaUrls,
                status: "received",
            });

            await claim.save();

            // Submit claim on blockchain
            if (policy.onChainPolicyId) {
                try {
                    const claimDataHash = `claim-${claim._id}-${Date.now()}`;
                    const { claimId, txHash } = await MantleService.submitClaim(
                        parseInt(policy.onChainPolicyId!),
                        policy.userId, // Phone number from user
                        policy.sumAssuredKES || 0,
                        claimDataHash
                    );

                    claim.onChainClaimId = claimId.toString();
                    await claim.save();

                    console.log(`✅ Claim submitted on-chain: ${txHash}`);
                } catch (blockchainError: any) {
                    console.error("❌ Blockchain error:", blockchainError.message);
                    // Claim created in DB but not on-chain
                }
            }

            return claim;
        } catch (error: any) {
            console.error("❌ Error submitting claim:", error.message);
            throw new Error(error.message || "Failed to submit claim");
        }
    }

    /**
     * Approve claim and initiate payout
     */
    async approveClaim(
        claimId: string,
        reviewedBy: string,
        payoutAmountKES?: number
    ): Promise<IClaim> {
        try {
            const claim = await Claim.findById(claimId);
            if (!claim) {
                throw new Error("Claim not found");
            }

            if (claim.status !== "received" && claim.status !== "review") {
                throw new Error("Claim cannot be approved");
            }

            // Get policy to determine payout amount
            const policy = await Policy.findById(claim.policyId);
            if (!policy) {
                throw new Error("Policy not found");
            }

            const finalPayoutAmount = payoutAmountKES || policy.sumAssuredKES || 0;

            // Update claim status
            claim.status = "approved";
            claim.payoutAmountKES = finalPayoutAmount;
            claim.reviewedBy = reviewedBy;
            claim.reviewedAt = new Date();
            await claim.save();

            // Approve claim on blockchain
            if (claim.onChainClaimId) {
                try {
                    await MantleService.approveClaim(
                        parseInt(claim.onChainClaimId!)
                    );
                } catch (blockchainError: any) {
                    console.error("❌ Blockchain error:", blockchainError.message);
                }
            }

            // Initiate M-Pesa B2C payout
            try {
                // Get user phone number
                const user = await Policy.findById(claim.policyId).populate("userId");
                const phoneNumber = (user as any)?.phoneNumber || "";

                if (phoneNumber) {
                    const payoutResponse = await MpesaService.initiateB2CPayout(
                        phoneNumber,
                        finalPayoutAmount,
                        `Claim payout for policy ${policy.policyNumber || "Unknown"}`
                    );

                    // Create payment record
                    const payment = new Payment({
                        userId: claim.userId,
                        policyId: claim.policyId,
                        claimId: claim._id.toString(),
                        mpesaTransactionId: payoutResponse.ConversationID,
                        phoneNumber,
                        amountKES: finalPayoutAmount,
                        status: "pending",
                        paymentType: "claim_payout",
                        rawCallbackPayload: payoutResponse,
                    });

                    await payment.save();

                    console.log(`✅ Payout initiated for claim ${claimId}`);
                }
            } catch (payoutError: any) {
                console.error("❌ Payout error:", payoutError.message);
                // Claim approved but payout failed - admin can retry
            }

            return claim;
        } catch (error: any) {
            console.error("❌ Error approving claim:", error.message);
            throw new Error(error.message || "Failed to approve claim");
        }
    }

    /**
     * Reject claim
     */
    async rejectClaim(
        claimId: string,
        reviewedBy: string,
        rejectionReason: string
    ): Promise<IClaim> {
        try {
            const claim = await Claim.findById(claimId);
            if (!claim) {
                throw new Error("Claim not found");
            }

            if (claim.status !== "received" && claim.status !== "review") {
                throw new Error("Claim cannot be rejected");
            }

            // Update claim status
            claim.status = "rejected";
            claim.rejectionReason = rejectionReason;
            claim.reviewedBy = reviewedBy;
            claim.reviewedAt = new Date();
            await claim.save();

            // Reject claim on blockchain
            if (claim.onChainClaimId) {
                try {
                    await MantleService.rejectClaim(
                        parseInt(claim.onChainClaimId!),
                        rejectionReason
                    );
                } catch (blockchainError: any) {
                    console.error("❌ Blockchain error:", blockchainError.message);
                }
            }

            console.log(`✅ Claim rejected: ${claimId}`);
            return claim;
        } catch (error: any) {
            console.error("❌ Error rejecting claim:", error.message);
            throw new Error(error.message || "Failed to reject claim");
        }
    }

    /**
     * Mark claim as paid (after M-Pesa payout confirmation)
     */
    async markClaimPaid(claimId: string, paymentId: string): Promise<IClaim> {
        try {
            const claim = await Claim.findById(claimId);
            if (!claim) {
                throw new Error("Claim not found");
            }

            if (claim.status !== "approved") {
                throw new Error("Claim must be approved before marking as paid");
            }

            claim.status = "paid";
            await claim.save();

            // Mark claim as paid on blockchain
            if (claim.onChainClaimId) {
                try {
                    await MantleService.markClaimPaid(
                        parseInt(claim.onChainClaimId!)
                    );

                    // Record claim payout in RiskPool
                    const policy = await Policy.findById(claim.policyId);
                    if (policy && policy.onChainPolicyId && claim.payoutAmountKES) {
                        await MantleService.recordClaimPayout(
                            parseInt(policy.onChainPolicyId!),
                            parseInt(claim.onChainClaimId!),
                            claim.payoutAmountKES
                        );
                    }
                } catch (blockchainError: any) {
                    console.error("❌ Blockchain error:", blockchainError.message);
                }
            }

            // Update policy status to claimed
            const policy = await Policy.findById(claim.policyId);
            if (policy) {
                policy.policyStatus = "claimed";
                await policy.save();

                if (policy.onChainPolicyId) {
                    try {
                        await MantleService.updatePolicyStatus(
                            parseInt(policy.onChainPolicyId!),
                            "claimed"
                        );
                    } catch (error) {
                        console.error("Failed to update policy status on-chain");
                    }
                }
            }

            console.log(`✅ Claim marked as paid: ${claimId}`);
            return claim;
        } catch (error: any) {
            console.error("❌ Error marking claim as paid:", error.message);
            throw new Error(error.message || "Failed to mark claim as paid");
        }
    }

    /**
     * Get claims by policy
     */
    async getClaimsByPolicy(policyId: string): Promise<IClaim[]> {
        try {
            return await Claim.find({ policyId }).sort({ createdAt: -1 });
        } catch (error: any) {
            console.error("❌ Error getting claims:", error.message);
            throw new Error("Failed to get claims");
        }
    }

    /**
     * Get claims by user
     */
    async getClaimsByUser(userId: string): Promise<IClaim[]> {
        try {
            return await Claim.find({ userId }).sort({ createdAt: -1 });
        } catch (error: any) {
            console.error("❌ Error getting claims:", error.message);
            throw new Error("Failed to get claims");
        }
    }

    /**
     * Get claim by ID
     */
    async getClaimById(claimId: string): Promise<IClaim | null> {
        try {
            return await Claim.findById(claimId);
        } catch (error: any) {
            console.error("❌ Error getting claim:", error.message);
            return null;
        }
    }

    /**
     * Get pending claims for review
     */
    async getPendingClaims(): Promise<IClaim[]> {
        try {
            return await Claim.find({
                status: { $in: ["received", "review"] },
            }).sort({ createdAt: 1 });
        } catch (error: any) {
            console.error("❌ Error getting pending claims:", error.message);
            throw new Error("Failed to get pending claims");
        }
    }
}

export default new ClaimsService();
