import axios from "axios";

export interface WhatsAppMessage {
    from: string;
    id: string;
    timestamp: string;
    text?: {
        body: string;
    };
    image?: {
        id: string;
        mime_type: string;
        sha256: string;
    };
    type: "text" | "image" | "document" | "audio" | "video";
}

export class WhatsAppBusinessClient {
    private accessToken: string;
    private phoneNumberId: string;
    private apiVersion: string = "v21.0";
    private baseUrl: string;

    constructor(accessToken: string, phoneNumberId: string) {
        this.accessToken = accessToken;
        this.phoneNumberId = phoneNumberId;
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;
    }

    /**
     * Send a text message to a WhatsApp user
     */
    async sendTextMessage(to: string, message: string): Promise<any> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "text",
                    text: {
                        preview_url: false,
                        body: message,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(`✅ Message sent to ${to}`);
            return response.data;
        } catch (error: any) {
            console.error("❌ Error sending message:", error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send a template message (for initial outreach)
     */
    async sendTemplateMessage(to: string, templateName: string, languageCode: string = "en"): Promise<any> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: to,
                    type: "template",
                    template: {
                        name: templateName,
                        language: {
                            code: languageCode,
                        },
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(`✅ Template message sent to ${to}`);
            return response.data;
        } catch (error: any) {
            console.error("❌ Error sending template:", error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Mark a message as read
     */
    async markMessageAsRead(messageId: string): Promise<any> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: "whatsapp",
                    status: "read",
                    message_id: messageId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            console.error("❌ Error marking message as read:", error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Download media from WhatsApp (for KYC documents/photos)
     */
    async downloadMedia(mediaId: string): Promise<Buffer> {
        try {
            // First, get the media URL
            const mediaUrlResponse = await axios.get(
                `https://graph.facebook.com/${this.apiVersion}/${mediaId}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }
            );

            const mediaUrl = mediaUrlResponse.data.url;

            // Then download the actual media
            const mediaResponse = await axios.get(mediaUrl, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
                responseType: "arraybuffer",
            });

            return Buffer.from(mediaResponse.data);
        } catch (error: any) {
            console.error("❌ Error downloading media:", error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send a reaction to a message
     */
    async sendReaction(to: string, messageId: string, emoji: string): Promise<any> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "reaction",
                    reaction: {
                        message_id: messageId,
                        emoji: emoji,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            console.error("❌ Error sending reaction:", error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Parse incoming webhook message
     */
    parseWebhookMessage(webhookBody: any): WhatsAppMessage | null {
        try {
            const entry = webhookBody.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const messages = value?.messages;

            if (!messages || messages.length === 0) {
                return null;
            }

            const message = messages[0];
            return {
                from: message.from,
                id: message.id,
                timestamp: message.timestamp,
                text: message.text,
                image: message.image,
                type: message.type,
            };
        } catch (error) {
            console.error("❌ Error parsing webhook message:", error);
            return null;
        }
    }

    /**
     * Verify webhook signature for security
     */
    verifyWebhookSignature(signature: string, body: string, appSecret: string): boolean {
        const crypto = require("crypto");
        const expectedSignature = crypto
            .createHmac("sha256", appSecret)
            .update(body)
            .digest("hex");

        return signature === `sha256=${expectedSignature}`;
    }
}

export default WhatsAppBusinessClient;
