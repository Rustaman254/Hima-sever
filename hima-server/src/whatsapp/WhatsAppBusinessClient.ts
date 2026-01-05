import axios from "axios";
import crypto from "crypto";
import type { IWhatsAppClient, ParsedWhatsAppMessage, WhatsAppMessageResponse } from "./IWhatsAppClient.js";

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

export class WhatsAppBusinessClient implements IWhatsAppClient {
    private accessToken: string;
    private phoneNumberId: string;
    private apiVersion: string = "v22.0";
    private baseUrl: string;

    constructor(accessToken: string, phoneNumberId: string) {
        this.accessToken = accessToken;
        this.phoneNumberId = phoneNumberId;
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;
    }

    /**
     * Send a text message to a WhatsApp user
     */
    async sendTextMessage(to: string, message: string): Promise<WhatsAppMessageResponse> {
        try {
            console.log(`📤 [META] Attempting to send message to ${to}`);
            console.log(`📝 [META] Message preview: ${message.substring(0, 100)}...`);
            console.log(`🔗 [META] API Endpoint: ${this.baseUrl}/messages`);

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

            console.log(`✅ [META] Message sent successfully to ${to}`);
            console.log(`📨 [META] Message ID: ${response.data.messages?.[0]?.id}`);
            return {
                messageId: response.data.messages?.[0]?.id,
                status: "sent",
                body: message,
            };
        } catch (error: any) {
            console.error(`❌ [META] Failed to send message to ${to}`);
            console.error(`❌ [META] Error status: ${error.response?.status}`);
            console.error(`❌ [META] Error details:`, JSON.stringify(error.response?.data, null, 2));
            console.error(`❌ [META] Error message: ${error.message}`);

            // Log specific error types with actionable guidance
            const errorCode = error.response?.data?.error?.code;
            const errorMessage = error.response?.data?.error?.message;

            if (error.response?.status === 401) {
                console.error(`🔐 [META] Authentication failed - check WHATSAPP_ACCESS_TOKEN`);
                console.error(`    → Generate a new token at: https://developers.facebook.com/apps`);
            } else if (error.response?.status === 404) {
                console.error(`📞 [META] Phone number not found - check WHATSAPP_PHONE_NUMBER_ID`);
                console.error(`    → Verify Phone Number ID in Meta Developer Portal`);
            } else if (errorCode === 131030) {
                console.error(`🚫 [META] SANDBOX RESTRICTION: Recipient not in allowed list`);
                console.error(`    → Phone number ${to} must be added to your Meta sandbox allowed list`);
                console.error(`    → Steps to fix:`);
                console.error(`       1. Go to https://developers.facebook.com/apps`);
                console.error(`       2. Select your app → WhatsApp → API Setup`);
                console.error(`       3. Click "Manage phone number list" in the "To" section`);
                console.error(`       4. Add ${to} and verify it via WhatsApp`);
                console.error(`    → Note: This restriction is removed in production mode`);
            } else if (errorCode === 131047) {
                console.error(`⚠️  [META] Message template required - cannot send freeform message`);
                console.error(`    → Your account requires approved message templates`);
            } else if (errorCode === 100) {
                console.error(`📱 [META] Invalid parameter - check phone number format`);
                console.error(`    → Ensure ${to} includes country code (e.g., 254712345678)`);
            }

            throw error;
        }
    }

    /**
     * Send a message with media (image, document, etc.)
     */
    async sendMediaMessage(to: string, message: string, mediaUrl: string): Promise<WhatsAppMessageResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "image",
                    image: {
                        link: mediaUrl,
                        caption: message,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(`✅ Media message sent to ${to}`);
            return {
                messageId: response.data.messages?.[0]?.id,
                status: "sent",
                body: message,
            };
        } catch (error: any) {
            console.error("❌ Error sending media message:", error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send interactive buttons (Quick Replies)
     */
    async sendButtonMessage(to: string, body: string, buttons: string[]): Promise<WhatsAppMessageResponse> {
        try {
            console.log(`📤 [META] Sending button message to ${to}`);
            console.log(`🔘 [META] Buttons: ${buttons.join(", ")}`);

            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "interactive",
                    interactive: {
                        type: "button",
                        body: {
                            text: body,
                        },
                        action: {
                            buttons: buttons.slice(0, 3).map((btn, idx) => ({
                                type: "reply",
                                reply: {
                                    id: `btn_${idx}`,
                                    title: btn.substring(0, 20),
                                },
                            })),
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

            console.log(`✅ [META] Button message sent to ${to}`);
            return {
                messageId: response.data.messages?.[0]?.id,
                status: "sent",
                body,
                buttons,
            };
        } catch (error: any) {
            const errorCode = error.response?.data?.error?.code;
            console.error(`❌ [META] Error sending button message:`, error.response?.data || error.message);

            // Check for sandbox restriction
            if (errorCode === 131030) {
                console.error(`🚫 [META] SANDBOX RESTRICTION: Recipient ${to} not in allowed list`);
                console.error(`    → Add ${to} to Meta sandbox allowed list to send interactive messages`);
                throw error; // Don't fallback for sandbox restrictions - user needs to fix this
            }

            console.warn(`⚠️  [META] Falling back to text message`);
            // Fallback to text message with numbered options
            const textWithOptions = `${body}\n\n${buttons.map((btn, i) => `${i + 1}. ${btn}`).join("\n")}`;
            return this.sendTextMessage(to, textWithOptions);
        }
    }

    /**
     * Send an interactive list message
     */
    async sendListMessage(to: string, body: string, buttonText: string, sections: any[]): Promise<WhatsAppMessageResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "interactive",
                    interactive: {
                        type: "list",
                        body: {
                            text: body,
                        },
                        action: {
                            button: buttonText.substring(0, 20),
                            sections: sections.map((section) => ({
                                title: section.title.substring(0, 24),
                                rows: section.rows.map((row: any) => ({
                                    id: row.id,
                                    title: row.title.substring(0, 24),
                                    description: row.description?.substring(0, 72),
                                })),
                            })),
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

            console.log(`✅ List message sent to ${to}`);
            return {
                messageId: response.data.messages?.[0]?.id,
                status: "sent",
                body,
            };
        } catch (error: any) {
            console.error("❌ Error sending list message:", error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send a template message (Meta specific)
     */
    async sendTemplateMessage(
        to: string,
        templateName: string,
        languageCode: string,
        components?: any[]
    ): Promise<WhatsAppMessageResponse> {
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
                        components: components || [],
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(`✅ Template message (${templateName}) sent to ${to}`);
            return {
                messageId: response.data.messages?.[0]?.id,
                status: "sent",
                body: `Template: ${templateName}`,
            };
        } catch (error: any) {
            console.error("❌ Error sending template message:", error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send a Call-to-Action (CTA) link button
     */
    async sendCTAMessage(
        to: string,
        body: string,
        buttonText: string,
        url: string
    ): Promise<WhatsAppMessageResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "interactive",
                    interactive: {
                        type: "cta_url",
                        body: {
                            text: body,
                        },
                        action: {
                            name: "cta_url",
                            parameters: {
                                display_text: buttonText.substring(0, 20),
                                url: url,
                            },
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

            console.log(`✅ CTA message sent to ${to}`);
            return {
                messageId: response.data.messages?.[0]?.id,
                status: "sent",
                body,
            };
        } catch (error: any) {
            console.error("❌ Error sending CTA message:", error.response?.data || error.message);
            // Fallback to text if interactive CTA fails (some accounts have restrictions)
            return this.sendTextMessage(to, `${body}\n\n${buttonText}: ${url}`);
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
    parseWebhookMessage(webhookBody: any): ParsedWhatsAppMessage | null {
        try {
            const entry = webhookBody.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const messages = value?.messages;

            if (!messages || messages.length === 0) {
                return null;
            }

            const message = messages[0];

            let body = message.text?.body || "";
            let interactiveReply: { id: string; title: string; type: "button_reply" | "list_reply" } | undefined;

            // Handle interactive replies
            if (message.type === "interactive") {
                const interactive = message.interactive;
                if (interactive.type === "button_reply") {
                    body = interactive.button_reply.title;
                    interactiveReply = {
                        id: interactive.button_reply.id,
                        title: interactive.button_reply.title,
                        type: "button_reply" as const,
                    };
                } else if (interactive.type === "list_reply") {
                    body = interactive.list_reply.title;
                    interactiveReply = {
                        id: interactive.list_reply.id,
                        title: interactive.list_reply.title,
                        type: "list_reply" as const,
                    };
                }
            }

            return {
                from: message.from,
                to: value?.metadata?.phone_number_id,
                body: body,
                messageId: message.id,
                timestamp: message.timestamp,
                type: message.type,
                ...(interactiveReply && { interactiveReply }),
                mediaUrl: message.image?.id,
                mediaContentType: message.image?.mime_type,
            };
        } catch (error) {
            console.error("❌ Error parsing webhook message:", error);
            return null;
        }
    }

    /**
     * Format phone number for WhatsApp (no prefix needed for Meta)
     */
    formatPhoneNumber(phoneNumber: string): string {
        // Meta API uses plain phone numbers with country code
        return phoneNumber.replace(/\D/g, "");
    }

    /**
     * Extract phone number (already in plain format for Meta)
     */
    extractPhoneNumber(formattedNumber: string): string {
        return formattedNumber.replace(/\D/g, "");
    }

    /**
     * Verify webhook signature for security
     * (Disabled as per user request - no app secret)
     */
    verifyWebhookSignature(signature: string, body: string, appSecret?: string): boolean {
        return true;
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

    async sendLocationMessage(
        to: string,
        latitude: number,
        longitude: number,
        name?: string,
        address?: string
    ): Promise<WhatsAppMessageResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "location",
                    location: {
                        latitude,
                        longitude,
                        name: name || "Shared Location",
                        address: address || "",
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return {
                messageId: response.data.messages?.[0]?.id,
                status: "sent",
            };
        } catch (error: any) {
            console.error(`❌ [META] Error sending location message:`, error.response?.data || error.message);
            throw error;
        }
    }

    async sendContactMessage(
        to: string,
        name: string,
        phoneNumber: string,
        organization?: string
    ): Promise<WhatsAppMessageResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "contacts",
                    contacts: [
                        {
                            name: {
                                first_name: name,
                                formatted_name: name,
                            },
                            phones: [
                                {
                                    phone: phoneNumber,
                                    type: "WORK",
                                },
                            ],
                            ...(organization && { org: { company: organization } }),
                        },
                    ],
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return {
                messageId: response.data.messages?.[0]?.id,
                status: "sent",
            };
        } catch (error: any) {
            console.error(`❌ [META] Error sending contact message:`, error.response?.data || error.message);
            throw error;
        }
    }

    async sendProductMessage(
        to: string,
        catalogId: string,
        productRetailerId: string,
        body?: string,
        footer?: string
    ): Promise<WhatsAppMessageResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "interactive",
                    interactive: {
                        type: "product",
                        body: { text: body || "Check out this product!" },
                        footer: { text: footer || "Hima Insurance" },
                        action: {
                            catalog_id: catalogId,
                            product_retailer_id: productRetailerId,
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

            return {
                messageId: response.data.messages?.[0]?.id,
                status: "sent",
            };
        } catch (error: any) {
            console.error(`❌ [META] Error sending product message:`, error.response?.data || error.message);
            throw error;
        }
    }

    async sendFlowMessage(
        to: string,
        flowId: string,
        flowToken: string,
        buttonText: string,
        body: string,
        flowAction: string = "navigate",
        flowActionData: any = { screen: "START" }
    ): Promise<WhatsAppMessageResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "interactive",
                    interactive: {
                        type: "flow",
                        body: { text: body },
                        action: {
                            name: "flow",
                            parameters: {
                                flow_message_version: "3",
                                flow_token: flowToken,
                                flow_id: flowId,
                                flow_cta: buttonText,
                                flow_action: flowAction,
                                flow_action_data: flowActionData,
                            },
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

            return {
                messageId: response.data.messages?.[0]?.id,
                status: "sent",
            };
        } catch (error: any) {
            console.error(`❌ [META] Error sending flow message:`, error.response?.data || error.message);
            throw error;
        }
    }
}

export default WhatsAppBusinessClient;
