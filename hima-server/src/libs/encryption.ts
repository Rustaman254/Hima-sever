import crypto from "crypto";
import config from "../Configs/configs.js";

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = Buffer.from(config.encryptionKey.padEnd(32, "0").slice(0, 32));
const IV_LENGTH = 16;

/**
 * Encrypt sensitive data using AES-256-CBC
 */
export function encryptData(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return IV + encrypted data
    return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedText: string): string {
    const parts = encryptedText.split(":");
    if (parts.length < 2) {
        throw new Error("Invalid encrypted text format");
    }
    const iv = Buffer.from(parts[0] as string, "hex");
    const encrypted = parts[1] as string;

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

/**
 * Hash data for verification (one-way)
 */
export function hashData(text: string): string {
    return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
}

/**
 * Verify if encrypted data matches plain text
 */
export function verifyEncryptedData(plainText: string, encryptedText: string): boolean {
    try {
        const decrypted = decryptData(encryptedText);
        return decrypted === plainText;
    } catch (error) {
        return false;
    }
}
