import { ethers } from "ethers";
import config from "../Configs/configs.js";

// Import contract ABIs (will be generated after compilation)
import PolicyRegistryABI from "../../artifacts/contracts/PolicyRegistry.sol/PolicyRegistry.json" with { type: "json" };
import RiskPoolABI from "../../artifacts/contracts/RiskPool.sol/RiskPool.json" with { type: "json" };
import ClaimRegistryABI from "../../artifacts/contracts/ClaimRegistry.sol/ClaimRegistry.json" with { type: "json" };

/**
 * Mantle Network Service
 * Handles all blockchain interactions with smart contracts
 */
class MantleService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private policyRegistry: ethers.Contract;
    private riskPool: ethers.Contract;
    private claimRegistry: ethers.Contract;

    constructor() {
        // Initialize provider
        this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

        // Initialize service wallet (backend signs all transactions)
        const privateKey = process.env.PRIVATE_KEY || "";
        if (!privateKey) {
            throw new Error("PRIVATE_KEY not set in environment");
        }
        this.wallet = new ethers.Wallet(privateKey, this.provider);

        // Initialize contracts
        const policyRegistryAddress = process.env.POLICY_REGISTRY_ADDRESS || "";
        const riskPoolAddress = process.env.RISK_POOL_ADDRESS || "";
        const claimRegistryAddress = process.env.CLAIM_REGISTRY_ADDRESS || "";

        this.policyRegistry = new ethers.Contract(
            policyRegistryAddress,
            PolicyRegistryABI.abi,
            this.wallet
        );

        this.riskPool = new ethers.Contract(
            riskPoolAddress,
            RiskPoolABI.abi,
            this.wallet
        );

        this.claimRegistry = new ethers.Contract(
            claimRegistryAddress,
            ClaimRegistryABI.abi,
            this.wallet
        );

        console.log("✅ MantleService initialized");
        console.log(`   Service wallet: ${this.wallet.address}`);
    }

    /**
     * Generate rider hash from phone number (privacy-preserving)
     */
    generateRiderHash(phoneNumber: string): string {
        return ethers.keccak256(ethers.toUtf8Bytes(phoneNumber));
    }

    /**
     * Create policy on-chain
     */
    async createPolicy(
        policyId: string,
        phoneNumber: string,
        coverageType: "trip" | "daily" | "weekly" | "monthly",
        tier: "basic" | "standard" | "plus",
        startTime: Date,
        endTime: Date,
        sumAssuredKES: number,
        premiumKES: number
    ): Promise<{ policyIndex: number; txHash: string }> {
        try {
            const riderHash = this.generateRiderHash(phoneNumber);

            // Convert coverage type to enum
            const coverageTypeEnum =
                coverageType === "trip" ? 0 :
                    coverageType === "daily" ? 1 :
                        coverageType === "weekly" ? 2 : 3;

            // Convert tier to enum
            const tierEnum = tier === "basic" ? 0 : tier === "standard" ? 1 : 2;

            // Convert dates to timestamps
            const startTimestamp = Math.floor(startTime.getTime() / 1000);
            const endTimestamp = Math.floor(endTime.getTime() / 1000);

            console.log(`📝 Creating policy on-chain: ${policyId}`);

            const tx = await (this.policyRegistry as any).createPolicy(
                policyId,
                riderHash,
                coverageTypeEnum,
                tierEnum,
                startTimestamp,
                endTimestamp,
                ethers.toBigInt(sumAssuredKES),
                ethers.toBigInt(premiumKES)
            );

            const receipt = await tx.wait();
            console.log(`✅ Policy created on-chain: ${receipt.hash}`);

            // Extract policy index from event
            const event = receipt.logs.find(
                (log: any) => log.fragment?.name === "PolicyCreated"
            );
            const policyIndex = event ? Number(event.args[0]) : 0;

            return {
                policyIndex,
                txHash: receipt.hash,
            };
        } catch (error: any) {
            console.error("❌ Error creating policy on-chain:", error.message);
            throw new Error("Failed to create policy on blockchain");
        }
    }

    /**
     * Update policy status on-chain
     */
    async updatePolicyStatus(
        policyIndex: number,
        status: "active" | "expired" | "claimed" | "cancelled"
    ): Promise<string> {
        try {
            const statusEnum =
                status === "active"
                    ? 0
                    : status === "expired"
                        ? 1
                        : status === "claimed"
                            ? 2
                            : 3;

            const tx = await (this.policyRegistry as any).setPolicyStatus(
                policyIndex,
                statusEnum
            );
            const receipt = await tx.wait();

            console.log(`✅ Policy status updated: ${receipt.hash}`);
            return receipt.hash;
        } catch (error: any) {
            console.error("❌ Error updating policy status:", error.message);
            throw new Error("Failed to update policy status");
        }
    }

    /**
     * Get policy from blockchain
     */
    async getPolicy(policyIndex: number): Promise<any> {
        try {
            const policy = await (this.policyRegistry as any).getPolicy(policyIndex);
            return policy;
        } catch (error: any) {
            console.error("❌ Error getting policy:", error.message);
            throw new Error("Failed to get policy from blockchain");
        }
    }

    /**
     * Check if policy is active on-chain
     */
    async isPolicyActive(policyIndex: number): Promise<boolean> {
        try {
            return await (this.policyRegistry as any).isPolicyActive(policyIndex);
        } catch (error: any) {
            console.error("❌ Error checking policy status:", error.message);
            return false;
        }
    }

    /**
     * Record premium payment in RiskPool
     */
    async recordPremium(policyId: number, amountKES: number): Promise<string> {
        try {
            const tx = await (this.riskPool as any).recordPremium(policyId, amountKES);
            const receipt = await tx.wait();

            console.log(`✅ Premium recorded: ${receipt.hash}`);
            return receipt.hash;
        } catch (error: any) {
            console.error("❌ Error recording premium:", error.message);
            throw new Error("Failed to record premium");
        }
    }

    /**
     * Submit claim on-chain
     */
    async submitClaim(
        policyId: number,
        phoneNumber: string,
        claimAmountKES: number,
        claimDataHash: string
    ): Promise<{ claimId: number; txHash: string }> {
        try {
            const riderHash = this.generateRiderHash(phoneNumber);

            // Convert claim data hash to bytes32
            const dataHash = ethers.keccak256(ethers.toUtf8Bytes(claimDataHash));

            const tx = await (this.claimRegistry as any).submitClaim(
                policyId,
                riderHash,
                claimAmountKES,
                dataHash
            );

            const receipt = await tx.wait();
            console.log(`✅ Claim submitted on-chain: ${receipt.hash}`);

            // Extract claim ID from event
            const event = receipt.logs.find(
                (log: any) => log.fragment?.name === "ClaimSubmitted"
            );
            const claimId = event ? Number(event.args[0]) : 0;

            return {
                claimId,
                txHash: receipt.hash,
            };
        } catch (error: any) {
            console.error("❌ Error submitting claim:", error.message);
            throw new Error("Failed to submit claim on blockchain");
        }
    }

    /**
     * Approve claim on-chain
     */
    async approveClaim(claimId: number): Promise<string> {
        try {
            const tx = await (this.claimRegistry as any).approveClaim(claimId);
            const receipt = await tx.wait();

            console.log(`✅ Claim approved on-chain: ${receipt.hash}`);
            return receipt.hash;
        } catch (error: any) {
            console.error("❌ Error approving claim:", error.message);
            throw new Error("Failed to approve claim");
        }
    }

    /**
     * Reject claim on-chain
     */
    async rejectClaim(claimId: number, reason: string): Promise<string> {
        try {
            const tx = await (this.claimRegistry as any).rejectClaim(claimId, reason);
            const receipt = await tx.wait();

            console.log(`✅ Claim rejected on-chain: ${receipt.hash}`);
            return receipt.hash;
        } catch (error: any) {
            console.error("❌ Error rejecting claim:", error.message);
            throw new Error("Failed to reject claim");
        }
    }

    /**
     * Mark claim as paid on-chain
     */
    async markClaimPaid(claimId: number): Promise<string> {
        try {
            const tx = await (this.claimRegistry as any).markClaimPaid(claimId);
            const receipt = await tx.wait();

            console.log(`✅ Claim marked as paid: ${receipt.hash}`);
            return receipt.hash;
        } catch (error: any) {
            console.error("❌ Error marking claim as paid:", error.message);
            throw new Error("Failed to mark claim as paid");
        }
    }

    /**
     * Record claim payout in RiskPool
     */
    async recordClaimPayout(
        policyId: number,
        claimId: number,
        amountKES: number
    ): Promise<string> {
        try {
            const tx = await (this.riskPool as any).recordClaimPayout(
                policyId,
                claimId,
                amountKES
            );
            const receipt = await tx.wait();

            console.log(`✅ Claim payout recorded: ${receipt.hash}`);
            return receipt.hash;
        } catch (error: any) {
            console.error("❌ Error recording claim payout:", error.message);
            throw new Error("Failed to record claim payout");
        }
    }

    /**
     * Get pool statistics
     */
    async getPoolStats(): Promise<any> {
        try {
            return await (this.riskPool as any).getPoolStats();
        } catch (error: any) {
            console.error("❌ Error getting pool stats:", error.message);
            throw new Error("Failed to get pool stats");
        }
    }

    /**
     * Get contract statistics
     */
    async getContractStats(): Promise<any> {
        try {
            const policyStats = await (this.policyRegistry as any).getStats();
            const claimStats = await (this.claimRegistry as any).getStats();
            const poolStats = await (this.riskPool as any).getPoolStats();

            return {
                policies: {
                    total: Number(policyStats[0]),
                    active: Number(policyStats[1]),
                    expired: Number(policyStats[2]),
                    claimed: Number(policyStats[3]),
                },
                claims: {
                    total: Number(claimStats[0]),
                    pending: Number(claimStats[1]),
                    approved: Number(claimStats[2]),
                    rejected: Number(claimStats[3]),
                    paid: Number(claimStats[4]),
                },
                pool: {
                    totalCapital: ethers.formatUnits(poolStats[0].toString(), 6),
                    totalPoolTokens: ethers.formatUnits(poolStats[1].toString(), 18),
                    premiumsRecorded: Number(poolStats[2]),
                    claimsRecorded: Number(poolStats[3]),
                    netPremiums: Number(poolStats[4]),
                },
            };
        } catch (error: any) {
            console.error("❌ Error getting contract stats:", error.message);
            throw new Error("Failed to get contract stats");
        }
    }
}

export default new MantleService();
