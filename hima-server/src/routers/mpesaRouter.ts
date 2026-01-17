import express from "express";
import type { Request, Response, Router } from "express";
import { Policy } from "../models/Policy.js";
import { User } from "../models/User.js";
import { InsuranceProduct } from "../models/InsuranceProduct.js";
import WhatsAppClient from "../whatsapp/WhatsAppClient.js";
import { ethers } from "ethers";
import HimaInsurance from "../../artifacts/contracts/HimaInsurance.sol/HimaInsurance.json" with { type: "json" };
import config from "../Configs/configs.js";

const router: Router = express.Router();

// M-Pesa callback URL
router.post("/callback", async (req: Request, res: Response) => {
    console.log("M-Pesa Callback Received:", JSON.stringify(req.body, null, 2));

    const callbackData = req.body.Body.stkCallback;
    const resultCode = callbackData.ResultCode;
    const checkoutRequestID = callbackData.CheckoutRequestID;

    console.log(`[MPESA] Callback for CheckoutRequestID: ${checkoutRequestID}, ResultCode: ${resultCode}`);

    const policy = await Policy.findOne({ "offChainMetadata.checkoutRequestID": checkoutRequestID });

    if (!policy) {
        console.error(`[MPESA] Policy not found for checkoutRequestID: ${checkoutRequestID}`);
        return res.status(404).send("Policy not found");
    }
    console.log(`[MPESA] Policy found: ${policy.policyNumber}`);

    if (resultCode === 0) {
        // Payment was successful
        console.log(`[MPESA] Payment successful for policy: ${policy.policyNumber}`);
        policy.paymentStatus = "completed";
        await policy.save();

        const user = await User.findById(policy.userId);
        if (!user) {
            console.error(`[MPESA] User not found for policy: ${policy._id}`);
            return res.status(404).send("User not found");
        }
        console.log(`[MPESA] User found: ${user.phoneNumber}`);

        try {
            console.log(`[MPESA] Creating policy on-chain for policy: ${policy.policyNumber}`);
            // Interact with the smart contract
            const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
            const wallet = new ethers.Wallet(config.blockchain.privateKey, provider);
            const contract = new ethers.Contract(config.blockchain.contractAddress, HimaInsurance.abi, wallet);

            const product = await InsuranceProduct.findById(policy.productId);
            if (!product) {
                console.error(`[MPESA] Product not found for policy: ${policy._id}`);
                return res.status(404).send("Product not found");
            }
            console.log(`[MPESA] Product found: ${product.name}`);

            let coverageType;
            switch (product.tier) {
                case "basic":
                    coverageType = 0; // CoverageType.BASIC
                    break;
                case "standard":
                    coverageType = 1; // CoverageType.COMPREHENSIVE
                    break;
                case "plus":
                    coverageType = 2; // CoverageType.PREMIUM
                    break;
                default:
                    coverageType = 0;
            }

            let durationDays;
            switch (product.coverageType) {
                case "daily":
                    durationDays = 1;
                    break;
                case "weekly":
                    durationDays = 7;
                    break;
                case "trip":
                    durationDays = 1; // Assuming a trip is 1 day
                    break;
                default:
                    durationDays = 1;
            }

            const tx = await (contract as any).createPolicy(
                policy.policyNumber,
                user.walletAddress,
                ethers.parseUnits(policy.premiumAmount.toString(), 6), // Assuming USDC with 6 decimals
                coverageType,
                policy.registrationNumber,
                durationDays
            );

            console.log(`[MPESA] On-chain transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`[MPESA] On-chain transaction confirmed: ${receipt.transactionHash}`);
            const onChainPolicyId = receipt.events[0].args[0].toString();

            policy.policyStatus = "active";
            policy.onChainPolicyId = onChainPolicyId;
            policy.onChainTxHash = tx.hash;
            await policy.save();
            console.log(`[MPESA] Policy ${policy.policyNumber} activated`);

            // Send confirmation message to user
            await WhatsAppClient.sendTextMessage(
                user.phoneNumber,
                `🎉 Your policy ${policy.policyNumber} is now active! 🎉`
            );

        } catch (error) {
            console.error(`[MPESA] Error creating policy on-chain for policy ${policy.policyNumber}:`, error);
            // Handle error appropriately
        }

    } else {
        // Payment failed
        console.log(`[MPESA] Payment failed for policy: ${policy.policyNumber}`);
        policy.paymentStatus = "failed";
        await policy.save();

        const user = await User.findById(policy.userId);
        if (user) {
            await WhatsAppClient.sendTextMessage(
                user.phoneNumber,
                `Your payment for policy ${policy.policyNumber} failed. Please try again.`
            );
        }
    }

    res.status(200).send("Callback received");
});

export default router;
