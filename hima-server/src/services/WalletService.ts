/**
 * Wallet Service
 * Handles blockchain wallet creation, encryption, and management for users
 */

import { ethers } from 'ethers';
import crypto from 'crypto';
import config from '../Configs/configs.js';
import { fileLogger } from '../libs/fileLogger.js';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export class WalletService {
    private static instance: WalletService;
    private encryptionKey: Buffer;
    private provider: ethers.JsonRpcProvider;

    private constructor() {
        // Get encryption key from environment
        const keyString = process.env.WALLET_ENCRYPTION_KEY || 'default-key-change-in-production';

        // Derive a proper encryption key using PBKDF2
        this.encryptionKey = crypto.pbkdf2Sync(
            keyString,
            'hima-wallet-salt',
            ITERATIONS,
            KEY_LENGTH,
            'sha512'
        );

        // Initialize Mantle provider
        this.provider = new ethers.JsonRpcProvider(
            config.blockchain.rpcUrl || 'https://rpc.sepolia.mantle.xyz'
        );

        fileLogger.log('✅ [WALLET] WalletService initialized');
    }

    public static getInstance(): WalletService {
        if (!WalletService.instance) {
            WalletService.instance = new WalletService();
        }
        return WalletService.instance;
    }

    /**
     * Create a new wallet for a user
     * @returns Wallet address and encrypted private key
     */
    public createUserWallet(): { address: string; encryptedPrivateKey: string } {
        try {
            // Generate random wallet
            const wallet = ethers.Wallet.createRandom();

            fileLogger.log(`🔐 [WALLET] Created new wallet: ${wallet.address}`);

            // Encrypt private key
            const encryptedPrivateKey = this.encryptPrivateKey(wallet.privateKey);

            return {
                address: wallet.address,
                encryptedPrivateKey
            };
        } catch (error) {
            fileLogger.log(`❌ [WALLET] Error creating wallet: ${error}`, 'ERROR');
            throw new Error('Failed to create wallet');
        }
    }

    /**
     * Encrypt a private key using AES-256-GCM
     * @param privateKey - The private key to encrypt
     * @returns Encrypted private key as hex string
     */
    private encryptPrivateKey(privateKey: string): string {
        try {
            // Generate random IV and salt
            const iv = crypto.randomBytes(IV_LENGTH);
            const salt = crypto.randomBytes(SALT_LENGTH);

            // Create cipher
            const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);

            // Encrypt
            let encrypted = cipher.update(privateKey, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            // Get auth tag
            const tag = cipher.getAuthTag();

            // Combine salt + iv + tag + encrypted data
            const result = Buffer.concat([
                salt,
                iv,
                tag,
                Buffer.from(encrypted, 'hex')
            ]);

            return result.toString('hex');
        } catch (error) {
            fileLogger.log(`❌ [WALLET] Encryption error: ${error}`, 'ERROR');
            throw new Error('Failed to encrypt private key');
        }
    }

    /**
     * Decrypt a private key
     * @param encryptedData - Encrypted private key as hex string
     * @returns Decrypted private key
     */
    public decryptPrivateKey(encryptedData: string): string {
        try {
            const buffer = Buffer.from(encryptedData, 'hex');

            // Extract components
            const salt = buffer.subarray(0, SALT_LENGTH);
            const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
            const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
            const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

            // Create decipher
            const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
            decipher.setAuthTag(tag);

            // Decrypt
            let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            fileLogger.log(`❌ [WALLET] Decryption error: ${error}`, 'ERROR');
            throw new Error('Failed to decrypt private key');
        }
    }

    /**
     * Get wallet balance on Mantle network
     * @param address - Wallet address
     * @returns Balance in MNT
     */
    public async getWalletBalance(address: string): Promise<string> {
        try {
            const balance = await this.provider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (error) {
            fileLogger.log(`❌ [WALLET] Error getting balance: ${error}`, 'ERROR');
            return '0';
        }
    }

    /**
     * Get Mantle Sepolia explorer URL for an address
     * @param address - Wallet address
     * @returns Explorer URL
     */
    public getExplorerUrl(address: string): string {
        const baseUrl = process.env.MANTLE_SEPOLIA_EXPLORER || 'https://sepolia.mantlescan.xyz';
        return `${baseUrl}/address/${address}`;
    }

    /**
     * Get wallet instance from encrypted private key
     * @param encryptedPrivateKey - Encrypted private key
     * @returns Wallet instance connected to provider
     */
    public getWalletInstance(encryptedPrivateKey: string): ethers.Wallet {
        try {
            const privateKey = this.decryptPrivateKey(encryptedPrivateKey);
            return new ethers.Wallet(privateKey, this.provider);
        } catch (error) {
            fileLogger.log(`❌ [WALLET] Error creating wallet instance: ${error}`, 'ERROR');
            throw new Error('Failed to create wallet instance');
        }
    }

    /**
     * Ensure user has a wallet, create if missing
     * @param user - User object
     * @returns Updated user with wallet info
     */
    public async ensureUserHasWallet(user: any): Promise<{ address: string; created: boolean }> {
        if (user.walletAddress && user.walletPrivateKey) {
            // User already has a wallet
            return {
                address: user.walletAddress,
                created: false
            };
        }

        // Create new wallet
        const { address, encryptedPrivateKey } = this.createUserWallet();

        // Update user
        user.walletAddress = address;
        user.walletPrivateKey = encryptedPrivateKey;
        user.walletCreatedAt = new Date();
        await user.save();

        fileLogger.log(`✅ [WALLET] Wallet created for user: ${user.phoneNumber} -> ${address}`);

        return {
            address,
            created: true
        };
    }

    /**
     * Format wallet address for display (shortened)
     * @param address - Full wallet address
     * @returns Shortened address (0x1234...5678)
     */
    public formatAddress(address: string): string {
        if (!address || address.length < 10) return address;
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
}

export default WalletService.getInstance();
