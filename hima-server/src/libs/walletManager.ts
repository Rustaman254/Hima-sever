import { ethers } from "ethers";
import config from "../Configs/configs.ts";
import { encryptData, decryptData } from "./encryption.ts";

export interface WalletInfo {
    address: string;
    encryptedPrivateKey: string;
}

/**
 * Generate a new Ethereum wallet for a user
 */
export function generateWallet(): WalletInfo {
    const wallet = ethers.Wallet.createRandom();

    return {
        address: wallet.address,
        encryptedPrivateKey: encryptData(wallet.privateKey),
    };
}

/**
 * Get wallet instance from encrypted private key
 */
export function getWalletFromEncrypted(encryptedPrivateKey: string): ethers.Wallet {
    const privateKey = decryptData(encryptedPrivateKey);
    const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    return new ethers.Wallet(privateKey, provider);
}

/**
 * Get wallet for a user by their phone number
 */
export async function getWalletForUser(phoneNumber: string): Promise<ethers.Wallet | null> {
    try {
        const { User } = await import("../models/User.ts");
        const user = await User.findOne({ phoneNumber });

        if (!user || !user.walletPrivateKey) {
            return null;
        }

        return getWalletFromEncrypted(user.walletPrivateKey);
    } catch (error) {
        console.error("Error getting wallet for user:", error);
        return null;
    }
}

/**
 * Get wallet balance in native token (MNT)
 */
export async function getWalletBalance(address: string): Promise<string> {
    try {
        const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
    } catch (error) {
        console.error("Error getting wallet balance:", error);
        return "0";
    }
}

/**
 * Get USDC balance for wallet
 */
export async function getUSDCBalance(address: string): Promise<string> {
    try {
        if (!config.blockchain.stableCoinAddress) {
            return "0";
        }

        const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

        // ERC20 ABI for balanceOf
        const erc20Abi = [
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)"
        ];

        const usdcContract = new ethers.Contract(
            config.blockchain.stableCoinAddress,
            erc20Abi,
            provider
        );

        const balance = await usdcContract.balanceOf(address);
        const decimals = await usdcContract.decimals();

        return ethers.formatUnits(balance, decimals);
    } catch (error) {
        console.error("Error getting USDC balance:", error);
        return "0";
    }
}

export default {
    generateWallet,
    getWalletFromEncrypted,
    getWalletForUser,
    getWalletBalance,
    getUSDCBalance,
};
