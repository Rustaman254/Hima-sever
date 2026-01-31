import express from "express";
import type { Request, Response, Router } from "express";
import { User } from "../models/User.js";
import { InsuranceQuote } from "../models/InsuranceQuote.js";
import { Policy } from "../models/Policy.js";
import { Transaction } from "../models/Transaction.js";
import { Claim } from "../models/Claim.js";
import config from "../Configs/configs.js";
import { authenticateJWT } from "../libs/authMiddleware.js";
import type { AuthRequest } from "../libs/authMiddleware.js";
import { decryptData } from "../libs/encryption.js";
import jwt from "jsonwebtoken";
import { logActivity } from "../libs/activityLogger.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { InsuranceProduct } from "../models/InsuranceProduct.js";

const router: Router = express.Router();

// Helper for quote calculation
const calculateQuote = async (userId: string, make: string, model: string, year: number, value: number, type: string) => {
    // Simple logic: Base premium 5% of value + taxes
    const basePremium = value * 0.05;
    const taxes = basePremium * 0.16;
    const totalPrice = basePremium + taxes;

    // Create a mock quote object (or save to DB if needed)
    // For now we just return the calculated values as if it was a document
    // In a real app we'd save it to InsuranceQuote model
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // We should actually save it to DB to be persistent if used later
    const quote = new InsuranceQuote({
        userId,
        motorcycleMake: make,
        motorcycleModel: model,
        motorcycleYear: year,
        motorcycleValue: value,
        coverageType: type,
        basePremium,
        taxes,
        totalPrice,
        validUntil,
        isAccepted: false
    });
    await quote.save();

    return quote;
};

/**
 * @route   POST /api/insurance/quotes
 * @desc    Get insurance quote
 * @access  Public
 */
router.post("/quotes", async (req: Request, res: Response) => {
    try {
        const {
            phoneNumber,
            motorcycleMake,
            motorcycleModel,
            motorcycleYear,
            motorcycleValue,
            coverageType,
        } = req.body;

        if (
            !phoneNumber ||
            !motorcycleMake ||
            !motorcycleModel ||
            !motorcycleYear ||
            !motorcycleValue ||
            !coverageType
        ) {
            return res
                .status(400)
                .json({ error: "Missing required fields" });
        }

        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ error: "User not found. Please register first." });
        }

        if (user.kycStatus !== 'verified') {
            return res.status(403).json({ error: "Your account is not verified yet. Please wait for approval." });
        }

        const userId = user._id;

        const quote = await calculateQuote(
            userId.toString(),
            motorcycleMake,
            motorcycleModel,
            motorcycleYear,
            motorcycleValue,
            coverageType
        );

        res.json({
            success: true,
            quote: {
                id: quote._id,
                motorcycleMake: quote.motorcycleMake,
                motorcycleModel: quote.motorcycleModel,
                motorcycleYear: quote.motorcycleYear,
                coverageType: quote.coverageType,
                monthlyPremium: quote.totalPrice,
                basePremium: quote.basePremium,
                taxes: quote.taxes,
                currency: "USD",
                validUntil: quote.validUntil,
            },
        });
    } catch (error) {
        console.error("Error getting quote:", error);
        res.status(500).json({ error: "Failed to generate quote" });
    }
});

/**
 * @route   POST /api/insurance/policies
 * @desc    Create insurance policy
 * @access  Public
 */
router.post("/policies", async (req: Request, res: Response) => {
    try {
        const {
            phoneNumber,
            quoteId,
            firstName,
            lastName,
            email,
            registrationNumber,
        } = req.body;

        if (!phoneNumber || !quoteId) {
            return res
                .status(400)
                .json({ error: "Missing required fields" });
        }

        let user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ error: "User not found. Please register via WhatsApp first." });
        }

        if (user.kycStatus !== 'verified') {
            return res.status(403).json({ error: "Your account is not verified yet. Please wait for approval." });
        }

        const quote = await InsuranceQuote.findById(quoteId);
        if (!quote) {
            return res.status(404).json({ error: "Quote not found" });
        }

        const policyNumber = `HIMA${Date.now()}`;
        const policy = new Policy({
            userId: user._id.toString(),
            quoteId: quote._id.toString(),
            policyNumber,
            motorcycleMake: quote.motorcycleMake,
            motorcycleModel: quote.motorcycleModel,
            motorcycleYear: quote.motorcycleYear,
            registrationNumber,
            coverageType: quote.coverageType,
            premiumAmount: quote.totalPrice,
            policyStartDate: new Date(),
            policyEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            maturityDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months (approx 180 days)
            isClaimable: false,
            paymentStatus: "completed", // Assuming it's paid or moving to paid state
            policyStatus: "active",
        });

        await policy.save();
        quote.isAccepted = true;
        await quote.save();

        res.json({
            success: true,
            policy: {
                policyNumber: policy.policyNumber,
                status: policy.policyStatus,
                premium: policy.premiumAmount,
                startDate: policy.policyStartDate,
                endDate: policy.policyEndDate,
                coverage: policy.coverageType,
            },
        });
    } catch (error) {
        console.error("Error creating policy:", error);
        res.status(500).json({ error: "Failed to create policy" });
    }
});

/**
 * @route   GET /api/insurance/policies/:policyNumber
 * @desc    Get policy details
 * @access  Public
 */
router.get("/policies/:policyNumber", async (req: Request, res: Response) => {
    try {
        const { policyNumber } = req.params;

        const policy = await Policy.findOne({ policyNumber: policyNumber || "" } as any);
        if (!policy) {
            return res.status(404).json({ error: "Policy not found" });
        }

        res.json({
            success: true,
            policy: {
                policyNumber: policy.policyNumber,
                coverage: policy.coverageType,
                status: policy.policyStatus,
                premium: policy.premiumAmount,
                motorcycle: `${policy.motorcycleMake} ${policy.motorcycleModel}`,
                startDate: policy.policyStartDate,
                endDate: policy.policyEndDate,
                registrationNumber: policy.registrationNumber,
                paymentStatus: policy.paymentStatus,
            },
        });
    } catch (error) {
        console.error("Error getting policy:", error);
        res.status(500).json({ error: "Failed to retrieve policy" });
    }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment and activate policy
 * @access  Public
 */
router.post("/payments/verify", async (req: Request, res: Response) => {
    try {
        const { policyNumber, transactionId } = req.body;

        if (!policyNumber || !transactionId) {
            return res
                .status(400)
                .json({ error: "Missing required fields" });
        }

        const policy = await Policy.findOne({ policyNumber });
        if (!policy) {
            return res.status(404).json({ error: "Policy not found" });
        }

        // In production, verify transaction on blockchain here
        policy.transactionHash = transactionId;
        policy.paymentStatus = "completed";
        policy.policyStatus = "active";
        await policy.save();

        res.json({
            success: true,
            message: "Payment verified and policy activated",
            policy: {
                policyNumber: policy.policyNumber,
                status: policy.policyStatus,
            },
        });
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: "Failed to verify payment" });
    }
});

/**
 * @route   GET /api/insurance/users/:phoneNumber
 * @desc    Get user insurance information
 * @access  Public
 */
router.get("/users/:phoneNumber", async (req: Request, res: Response) => {
    try {
        const { phoneNumber } = req.params;

        const user = await User.findOne({ phoneNumber: phoneNumber as string });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const policies = await Policy.find({ userId: user._id.toString() });
        const claims = await Claim.find({ userId: user._id.toString() });

        res.json({
            success: true,
            user: {
                name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.phoneNumber,
                email: user.email,
                phoneNumber: user.phoneNumber,
                policyStatus: user.policyStatus,
                walletAddress: user.walletAddress,
                kycStatus: user.kycStatus,
                createdAt: user.createdAt,
                policies: policies.map((p) => ({
                    id: p._id,
                    policyNumber: p.policyNumber,
                    coverage: p.coverageType,
                    premium: p.premiumAmountKES,
                    status: p.policyStatus,
                    startDate: p.startTime,
                    endDate: p.endTime,
                })),
                claims: claims.map((c) => ({
                    id: c._id,
                    status: c.status,
                    incidentTime: c.incidentTime,
                    description: c.incidentDescription,
                    createdAt: c.createdAt
                })),
            },
        });
    } catch (error) {
        console.error("Error getting user:", error);
        res.status(500).json({ error: "Failed to retrieve user" });
    }
});

/**
 * @route   GET /api/insurance/admin/logs
 * @desc    Get audit logs (transactions/system events)
 */
router.get("/admin/logs", async (req: Request, res: Response) => {
    try {
        const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(50);
        res.json({
            success: true,
            logs: logs || []
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

/**
 * @route   GET /api/insurance/admin/stats
 * @desc    Get aggregate statistics for admin dashboard
 */
router.get("/admin/stats", async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const pendingKyc = await User.countDocuments({ kycStatus: 'pending' });
        const totalPolicies = await Policy.countDocuments();
        const activePolicies = await Policy.countDocuments({ policyStatus: 'active' });
        const pendingPolicies = await Policy.countDocuments({ policyStatus: 'pending' });
        const pendingClaims = await Claim.countDocuments({ status: { $in: ['received', 'review'] } });

        // Calculate real TVL and Revenue from database
        const allPolicies = await Policy.find({ paymentStatus: 'completed' });
        const totalTvl = allPolicies.reduce((acc, p) => acc + (p.premiumAmountKES || 0), 0);
        const revenue = totalTvl * 0.1; // Assuming 10% fee

        res.json({
            success: true,
            stats: {
                totalUsers,
                pendingKyc,
                totalPolicies,
                activePolicies,
                pendingPolicies,
                pendingClaims,
                totalTvl,
                revenue
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

router.get("/admin/reviews", async (req: Request, res: Response) => {
    try {
        const pendingKyc = await User.find({ kycStatus: 'pending' }).sort({ createdAt: -1 });
        const pendingPolicies = await Policy.find({ policyStatus: 'pending' }).sort({ createdAt: -1 });
        const pendingClaims = await Claim.find({ status: { $in: ['received', 'review'] } }).sort({ createdAt: -1 });

        // Join user data for policies and claims
        const policiesWithUsers = await Promise.all(pendingPolicies.map(async (p) => {
            const user = await User.findOne({ _id: p.userId });
            return { ...p.toObject(), user };
        }));

        const claimsWithUsers = await Promise.all(pendingClaims.map(async (c) => {
            const user = await User.findOne({ _id: c.userId });
            const policy = await Policy.findOne({ _id: c.policyId });
            return { ...c.toObject(), user, policy };
        }));

        res.json({
            success: true,
            reviews: {
                kyc: pendingKyc,
                policies: policiesWithUsers,
                claims: claimsWithUsers
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

/**
 * @route   POST /api/insurance/admin/login
 * @desc    Verify admin credentials
 * @access  Public
 */
router.post("/admin/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Verify in Database as requested
        const user = await User.findOne({ email, role: 'admin' });

        if (!user) {
            return res.status(401).json({ success: false, error: "Admin account not found in database" });
        }

        // Verify password (comparing plain text as requested for this phase)
        if (password === user.password || (email === config.admin.email && password === config.admin.password)) {
            // Sign JWT for admin
            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role },
                config.jwtSecret,
                { expiresIn: "1d" }
            );

            res.json({
                success: true,
                message: "Admin authenticated",
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ success: false, error: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ error: "Authentication failed" });
    }
});

/**
 * @route   GET /api/insurance/admin/registrations
 * @desc    Get all pending and verified registrations (Admin)
 * @access  Private (Admin Role Simulated)
 */
router.get("/admin/registrations", async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch registrations" });
    }
});

/**
 * @route   PATCH /api/insurance/admin/users/:phoneNumber/kyc
 * @desc    Approve or reject user KYC (Admin)
 */
router.patch("/admin/users/:phoneNumber/kyc", async (req: Request, res: Response) => {
    try {
        const { phoneNumber } = req.params;
        const { status } = req.body; // 'verified' or 'rejected'

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "Invalid status. Use 'verified' or 'rejected'" });
        }

        const user = await User.findOne({ phoneNumber: phoneNumber as string });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.kycStatus = status;
        if (status === 'verified') {
            user.kycVerifiedAt = new Date();
            // Important: Set registrationComplete so they get the global interceptor next time
            user.registrationComplete = true;
        }
        await user.save();

        // WhatsApp Notification
        try {
            const BotClient = (await import("../whatsapp-bot/BotClient.js")).default;

            if (status === 'verified') {
                await logActivity("KYC_APPROVED", `Admin approved KYC for ${phoneNumber}`, user._id.toString());
                const message = `🎉 KYC Approved! Hello ${user.firstName || "there"}, your account is now verified. You can now purchase insurance.`;
                await BotClient.sendOptions(
                    user.phoneNumber,
                    message,
                    [
                        { id: "buy_insurance", text: "Buy Insurance" },
                        { id: "file_claim", text: "File a Claim" }
                    ],
                    "Verification Successful"
                );
            } else {
                await logActivity("KYC_REJECTED", `Admin rejected KYC for ${phoneNumber}`, user._id.toString());
                const message = `❌ KYC Update. Hello ${user.firstName || "there"}, unfortunately your verification was rejected. Please contact support.`;
                await BotClient.sendText(user.phoneNumber, message);
            }
        } catch (waError) {
            console.error("Failed to send KYC notification via Bot:", waError);
        }

        res.json({
            success: true,
            message: `User KYC ${status} successfully and notification sent`,
            user: {
                phoneNumber: user.phoneNumber,
                kycStatus: user.kycStatus
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to update KYC status" });
    }
});

/**
 * @route   GET /api/insurance/wallet/private-key
 * @desc    Get user's encrypted private key (decrypted)
 * @access  Private (User)
 */
router.get("/wallet/private-key", authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await User.findById(userId);
        if (!user || !user.walletPrivateKey) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        // Decrypt the private key
        const privateKey = decryptData(user.walletPrivateKey);

        res.json({
            success: true,
            privateKey: privateKey,
            address: user.walletAddress
        });
    } catch (error) {
        console.error("Error revealing private key:", error);
        res.status(500).json({ error: "Failed to reveal private key" });
    }
});

/**
 * @route   GET /api/insurance/products
 * @desc    Get all active insurance products
 * @access  Public
 */
router.get("/products", async (req: Request, res: Response) => {
    try {
        const products = await InsuranceProduct.find({ isActive: true });
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

/**
 * @route   POST /api/insurance/admin/policies/:id/claimable
 * @desc    Toggle policy claimability
 * @access  Private (Admin)
 */
router.post("/admin/policies/:id/claimable", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isClaimable } = req.body;

        const policy = await Policy.findById(id);
        if (!policy) {
            return res.status(404).json({ error: "Policy not found" });
        }

        policy.isClaimable = isClaimable;
        await policy.save();

        await logActivity("SYSTEM", `Admin toggled claimability to ${isClaimable} for policy ${policy.policyNumber}`, policy.userId);

        res.json({ success: true, isClaimable: policy.isClaimable });
    } catch (error) {
        res.status(500).json({ error: "Failed to update policy claimability" });
    }
});

/**
 * @route   GET /api/insurance/admin/policies
 * @desc    Get all policies for admin monitoring
 * @access  Private (Admin)
 */
router.get("/admin/policies", async (req: Request, res: Response) => {
    try {
        const policies = await Policy.find().sort({ createdAt: -1 });

        // Populate user data manually for simplicity or use .populate if schema allows
        const policiesWithUsers = await Promise.all(policies.map(async (policy) => {
            const user = await User.findById(policy.userId).select('firstName lastName phoneNumber');
            return {
                ...policy.toObject(),
                user
            };
        }));

        res.json({ success: true, policies: policiesWithUsers });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch policies" });
    }
});

export default router;
