import type { IWhatsAppClient } from "./IWhatsAppClient.ts";
import WhatsAppBusinessClient from "./WhatsAppBusinessClient.ts";
import SystemSettings from "../models/SystemSettings.ts";
import config from "../Configs/configs.ts";

/**
 * Factory class for creating WhatsApp client instances
 * based on system settings
 */
export class WhatsAppClientFactory {
    private static instance: IWhatsAppClient | null = null;
    private static currentProvider: string | null = null;

    /**
     * Get the active WhatsApp client based on system settings
     */
    static async getClient(): Promise<IWhatsAppClient> {
        try {
            // Check if we need to refresh the client
            if (!this.instance) {
                console.log(`📡 Initializing Meta WhatsApp provider`);

                // Fetch system settings
                const settings = await SystemSettings.getSettings();

                // Use credentials from config (.env) as primary, fallback to settings (database)
                const metaAccessToken = config.whatsappAccessToken || settings?.whatsappConfig?.metaAccessToken;
                const metaPhoneNumberId = config.whatsappPhoneNumberId || settings?.whatsappConfig?.metaPhoneNumberId;

                this.instance = new WhatsAppBusinessClient(
                    metaAccessToken || "",
                    metaPhoneNumberId || ""
                );
                this.currentProvider = "meta";
            }

            return this.instance;
        } catch (error) {
            console.error("❌ Error getting WhatsApp client:", error);
            return this.getFallbackClient();
        }
    }

    /**
     * Fallback client using environment variables
     */
    private static getFallbackClient(): IWhatsAppClient {
        console.warn("⚠️  Using fallback Meta WhatsApp client from environment variables");

        return new WhatsAppBusinessClient(
            config.whatsappAccessToken || "",
            config.whatsappPhoneNumberId || ""
        );
    }

    /**
     * Force refresh the client (useful after settings update)
     */
    static async refreshClient(): Promise<IWhatsAppClient> {
        this.instance = null;
        this.currentProvider = null;
        return this.getClient();
    }

    /**
     * Get current provider name
     */
    static getCurrentProvider(): string | null {
        return this.currentProvider;
    }

    /**
     * Internal helper to create a client instance
     */
    private static createClient(provider: string, whatsappConfig: any): IWhatsAppClient {
        if (provider === "meta") {
            return new WhatsAppBusinessClient(
                whatsappConfig.metaAccessToken || "",
                whatsappConfig.metaPhoneNumberId || ""
            );
        }
        throw new Error(`Unsupported WhatsApp provider: ${provider}`);
    }

    /**
     * Test connection with a specific provider configuration
     */
    static async testConnection(provider: string, whatsappConfig: any): Promise<boolean> {
        try {
            const testClient = this.createClient(provider, whatsappConfig);

            // For now, just verify the client was created successfully
            // In production, you might want to send a test message
            console.log(`✅ Test client created successfully for provider: ${provider}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to create test client for provider ${provider}:`, error);
            return false;
        }
    }
}

export default WhatsAppClientFactory;
