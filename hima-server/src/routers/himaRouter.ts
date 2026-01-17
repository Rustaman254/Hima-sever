/**
 * HIMA API Router
 * Endpoints for WhatsApp bot operations
 */

import express, { type Request, type Response, type Router } from 'express';
import { User } from '../models/User.js';
import { Policy } from '../models/Policy.js';
import { Claim } from '../models/Claim.js';
import { InsuranceProduct } from '../models/InsuranceProduct.js';
import { fileLogger } from '../libs/fileLogger.js';

const router: Router = express.Router();

/**
 * GET /api/hima/user-status
 * Check user account and KYC status
 */
router.get('/user-status', async (req: Request, res: Response) => {
    try {
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const user = await User.findOne({ phoneNumber: phone as string });

        if (!user) {
            return res.json({ status: 'NO_ACCOUNT' });
        }

        // Check KYC status
        if (!user.kycStatus || user.kycStatus === 'pending') {
            if (!user.kycData || Object.keys(user.kycData).length === 0) {
                return res.json({ status: 'NO_ACCOUNT' });
            }
            return res.json({ status: 'KYC_PENDING' });
        }

        if (user.kycStatus === 'rejected') {
            return res.json({ status: 'KYC_REJECTED' });
        }

        if (user.kycStatus === 'verified') {
            return res.json({ status: 'KYC_APPROVED' });
        }

        return res.json({ status: 'UNKNOWN' });
    } catch (error) {
        fileLogger.log(`❌ [HIMA-API] Error checking user status: ${error}`, 'ERROR');
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/hima/register
 * Submit KYC registration
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { phone, lang, kycData } = req.body;

        if (!phone || !kycData) {
            return res.status(400).json({ error: 'Phone and KYC data are required' });
        }

        let user = await User.findOne({ phoneNumber: phone });

        if (!user) {
            user = new User({ phoneNumber: phone });
        }

        user.botLanguage = lang || 'en';
        user.preferredLanguage = lang || 'en';
        user.kycData = kycData;
        user.kycStatus = 'pending';

        // Create blockchain wallet
        const WalletService = (await import('../services/WalletService.js')).default;
        const { address } = await WalletService.ensureUserHasWallet(user);

        await user.save();

        fileLogger.log(`✅ [HIMA-API] KYC registered for ${phone}, wallet: ${address}`);
        res.json({
            success: true,
            message: 'KYC submitted for review',
            walletAddress: address,
            explorerUrl: WalletService.getExplorerUrl(address)
        });
    } catch (error) {
        fileLogger.log(`❌ [HIMA-API] Error registering user: ${error}`, 'ERROR');
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/hima/profile
 * Get user profile details
 */
router.get('/profile', async (req: Request, res: Response) => {
    try {
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const user = await User.findOne({ phoneNumber: phone as string });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get active policy
        const policy = await Policy.findOne({ userId: user._id.toString(), policyStatus: 'active' });

        // Ensure user has wallet
        const WalletService = (await import('../services/WalletService.js')).default;
        await WalletService.ensureUserHasWallet(user);

        const profileData = {
            name: user.kycData?.fullName || user.firstName || 'N/A',
            idNumber: user.kycData?.idNumber || 'N/A',
            plate: user.kycData?.plateNumber || 'N/A',
            currentPolicyNumber: policy?.policyNumber || null,
            profileUrl: `https://hima.com/profile/${user._id}`,
            wallet: {
                address: user.walletAddress || null,
                explorerUrl: user.walletAddress ? WalletService.getExplorerUrl(user.walletAddress) : null,
                createdAt: user.walletCreatedAt || null
            }
        };

        res.json(profileData);
    } catch (error) {
        fileLogger.log(`❌ [HIMA-API] Error fetching profile: ${error}`, 'ERROR');
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/hima/claims
 * Submit insurance claim
 */
router.post('/claims', async (req: Request, res: Response) => {
    try {
        const { phone, accidentDate, location, description, photos } = req.body;

        if (!phone || !accidentDate || !location || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = await User.findOne({ phoneNumber: phone });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const claimNumber = `CLM-${Date.now().toString(36).toUpperCase()}`;

        const newClaim = new Claim({
            userId: user._id,
            claimNumber,
            accidentDate: new Date(accidentDate),
            location,
            description,
            damagePhotoBase64: photos?.damage || '',
            policeAbstractBase64: photos?.policeAbstract || '',
            status: 'submitted',
            submittedAt: new Date()
        });

        await newClaim.save();

        fileLogger.log(`✅ [HIMA-API] Claim submitted: ${claimNumber}`);
        res.json({ success: true, claimNumber });
    } catch (error) {
        fileLogger.log(`❌ [HIMA-API] Error submitting claim: ${error}`, 'ERROR');
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/hima/products
 * List available insurance products
 */
router.get('/products', async (req: Request, res: Response) => {
    try {
        const products = await InsuranceProduct.find({ isActive: true });
        res.json(products);
    } catch (error) {
        fileLogger.log(`❌ [HIMA-API] Error fetching products: ${error}`, 'ERROR');
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
