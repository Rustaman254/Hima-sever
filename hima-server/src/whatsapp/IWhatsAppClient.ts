/**
 * WhatsApp Client Interface
 * This interface is used by the Meta WhatsApp client
 */

export interface WhatsAppMessageResponse {
    sid?: string;
    messageId?: string;
    status: string;
    body?: string;
    buttons?: string[];
    cta?: {
        label: string;
        url: string;
    };
}

export interface IWhatsAppClient {
    /**
     * Send a text message to a WhatsApp user
     * @param to Recipient phone number (format varies by provider)
     * @param message Message text
     */
    sendTextMessage(to: string, message: string): Promise<WhatsAppMessageResponse>;

    /**
     * Send a message with media (image, document, etc.)
     * @param to Recipient phone number
     * @param message Message text
     * @param mediaUrl URL of the media file
     */
    sendMediaMessage(to: string, message: string, mediaUrl: string): Promise<WhatsAppMessageResponse>;

    /**
     * Send interactive buttons (Quick Replies)
     * @param to Recipient phone number
     * @param body Message body text
     * @param buttons Array of button titles
     */
    sendButtonMessage(to: string, body: string, buttons: string[]): Promise<WhatsAppMessageResponse>;

    /**
     * Send an interactive list message
     * @param to Recipient phone number
     * @param body Message body text
     * @param buttonText Text for the list trigger button
     * @param sections List sections with rows
     */
    sendListMessage(to: string, body: string, buttonText: string, sections: WhatsAppListSection[]): Promise<WhatsAppMessageResponse>;

    /**
     * Send a Call-to-Action (CTA) link button
     */
    sendCTAMessage(
        to: string,
        body: string,
        buttonText: string,
        url: string
    ): Promise<WhatsAppMessageResponse>;

    /**
     * Send a location message
     */
    sendLocationMessage(
        to: string,
        latitude: number,
        longitude: number,
        name?: string,
        address?: string
    ): Promise<WhatsAppMessageResponse>;

    /**
     * Send a contact message
     */
    sendContactMessage(
        to: string,
        name: string,
        phoneNumber: string,
        organization?: string
    ): Promise<WhatsAppMessageResponse>;

    /**
     * Send a product message
     */
    sendProductMessage(
        to: string,
        catalogId: string,
        productRetailerId: string,
        body?: string,
        footer?: string
    ): Promise<WhatsAppMessageResponse>;

    /**
     * Send a Flow message
     */
    sendFlowMessage(
        to: string,
        flowId: string,
        flowToken: string,
        buttonText: string,
        body: string,
        flowAction?: string,
        flowActionData?: any
    ): Promise<WhatsAppMessageResponse>;

    /**
     * Send a template message (Meta specific)
     */
    sendTemplateMessage(
        to: string,
        templateName: string,
        languageCode: string,
        components?: any[]
    ): Promise<WhatsAppMessageResponse>;

    /**
     * Parse incoming webhook message
     * @param body Webhook request body
     */
    parseWebhookMessage(body: any): ParsedWhatsAppMessage | null;

    /**
     * Format phone number for the specific provider
     * @param phoneNumber Phone number with country code
     */
    formatPhoneNumber(phoneNumber: string): string;

    /**
     * Extract plain phone number from provider-specific format
     * @param formattedNumber Provider-formatted number
     */
    extractPhoneNumber(formattedNumber: string): string;
}

export interface ParsedWhatsAppMessage {
    from: string;
    to?: string;
    body: string;
    messageId: string;
    timestamp: string;
    type: string;
    interactiveReply?: {
        id: string;
        title: string;
        type: "button_reply" | "list_reply";
    };
    mediaUrl?: string;
    mediaContentType?: string;
}

export interface WhatsAppListSection {
    title: string;
    rows: {
        id: string;
        title: string;
        description?: string;
    }[];
}
