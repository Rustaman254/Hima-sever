import { ethers } from "ethers";
import axios from "axios";

export interface PaymentConfig {
    rpcUrl: string;
    contractAddress: string;
    privateKey: string;
    stableCoinAddress: string;
    chainId: number;
}

export class PaymentProcessor {
    private provider: ethers.JsonRpcProvider;
    private signer: ethers.Wallet;
    private contractAddress: string;
    private stableCoinAddress: string;

    constructor(config: PaymentConfig) {
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.signer = new ethers.Wallet(config.privateKey, this.provider);
        this.contractAddress = config.contractAddress;
        this.stableCoinAddress = config.stableCoinAddress;
    }

    /**
     * Create a payment intent for user (abstraction of blockchain details)
     * Returns payment details without showing crypto terminology
     */
    async createPaymentIntent(
        userAddress: string,
        amountUSD: number,
        policyId: string
    ): Promise<{
        paymentId: string;
        amount: string;
        currency: string;
        paymentLink: string;
        description: string;
    }> {
        try {
            // Generate a unique payment ID
            const paymentId = `HIMA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // In production, this would integrate with a payment gateway like Stripe/Razorpay
            // that handles the blockchain transactions internally
            return {
                paymentId,
                amount: amountUSD.toFixed(2),
                currency: "USD",
                paymentLink: `${process.env.PAYMENT_GATEWAY_URL}/pay/${paymentId}`,
                description: `Hima Connect Motorcycle Insurance - Policy ${policyId}`,
            };
        } catch (error) {
            console.error("Error creating payment intent:", error);
            throw new Error("Failed to create payment intent");
        }
    }

    /**
     * Process payment through payment gateway
     * Returns transaction confirmation without blockchain details
     */
    async processPayment(
        paymentId: string,
        userAddress: string,
        amountUSD: number
    ): Promise<{
        success: boolean;
        transactionId: string;
        status: string;
        message: string;
    }> {
        try {
            // Convert USD to stablecoin amount (assuming 1 USD = 1 stablecoin)
            const amount = ethers.parseUnits(
                amountUSD.toString(),
                6
            ); // USDC has 6 decimals

            // Create transaction to transfer stablecoins
            const tx = await this.transferStableCoin(userAddress, amount);

            // Wait for confirmation
            const receipt = await tx.wait();

            return {
                success: true,
                transactionId: receipt?.hash || "",
                status: "completed",
                message: "Your payment has been processed successfully",
            };
        } catch (error) {
            console.error("Error processing payment:", error);
            return {
                success: false,
                transactionId: "",
                status: "failed",
                message: "Payment processing failed. Please try again.",
            };
        }
    }

    /**
     * Generate payment link (abstraction - actual implementation would use payment gateway)
     */
    async generatePaymentLink(
        amountUSD: number,
        policyNumber: string
    ): Promise<string> {
        try {
            // In production, this would call a payment gateway API
            // The gateway would handle blockchain transactions internally
            const paymentLink = `${process.env.PAYMENT_GATEWAY_URL}/checkout?amount=${amountUSD}&policy=${policyNumber}&currency=USD`;
            return paymentLink;
        } catch (error) {
            console.error("Error generating payment link:", error);
            throw error;
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(
        transactionId: string
    ): Promise<{
        status: "pending" | "completed" | "failed";
        amount?: number;
        timestamp?: number | undefined;
    }> {
        try {
            // Check transaction status on blockchain
            const tx = await this.provider.getTransaction(transactionId);

            if (!tx) {
                return { status: "pending" };
            }

            const receipt = await this.provider.getTransactionReceipt(
                transactionId
            );

            if (receipt && receipt.status === 1) {
                const block = await this.provider.getBlock(receipt.blockNumber);
                return {
                    status: "completed" as const,
                    amount: Number(ethers.formatUnits(tx.value, 6)),
                    timestamp: block?.timestamp,
                };
            }

            return { status: "failed" };
        } catch (error) {
            console.error("Error verifying payment:", error);
            return { status: "pending" };
        }
    }

    /**
     * Internal method to transfer stablecoin
     */
    private async transferStableCoin(
        toAddress: string,
        amount: bigint
    ): Promise<ethers.TransactionResponse> {
        // USDC ABI (minimal)
        const usdcAbi = [
            {
                constant: false,
                inputs: [
                    { name: "_to", type: "address" },
                    { name: "_value", type: "uint256" },
                ],
                name: "transfer",
                outputs: [{ name: "", type: "bool" }],
                type: "function",
            },
        ];

        const usdcContract = new ethers.Contract(
            this.stableCoinAddress,
            usdcAbi,
            this.signer
        );

        const transfer = usdcContract.transfer as ethers.ContractMethod;
        return (await transfer(toAddress, amount)) as ethers.TransactionResponse;
    }

    /**
     * Get current stablecoin to USD exchange rate
     * (Would be 1:1 for USDC/USDT)
     */
    async getExchangeRate(stableCoinSymbol: string = "USDC"): Promise<number> {
        try {
            // For stablecoins, the rate is always 1:1
            // This method exists for completeness
            return 1.0;
        } catch (error) {
            console.error("Error getting exchange rate:", error);
            throw error;
        }
    }
}

export default PaymentProcessor;
