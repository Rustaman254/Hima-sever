import twilio from "twilio";

export interface TwilioWhatsAppMessage {
    from: string;
    to: string;
    body: string;
    numMedia?: string;
    mediaUrl0?: string;
    mediaContentType0?: string;
}

/**
 * @class TwilioWhatsAppClient
 * @description Twilio WhatsApp API client for sending and receiving messages
 */
export class TwilioWhatsAppClient {
    private client: twilio.Twilio;
    private fromNumber: string;

    constructor(accountSid: string, authToken: string, fromNumber: string) {
        this.fromNumber = fromNumber; // Format: whatsapp:+14155238886

        // Validate Twilio SID format (must start with AC)
        if (typeof accountSid === 'string' && accountSid.startsWith('AC')) {
            this.client = twilio(accountSid, authToken);
            console.log("✅ Twilio WhatsApp Client initialized");
        } else {
            console.warn("⚠️  Invalid or missing TWILIO_ACCOUNT_SID. Twilio client will operate in Simulation Mode only.");
            this.client = null as any;
        }
    }

    /**
     * Send a text message via Twilio WhatsApp
     * @param to Recipient WhatsApp number (format: whatsapp:+1234567890)
     * @param message Message text
     */
    async sendTextMessage(to: string, message: string): Promise<any> {
        try {
            // Ensure 'to' has whatsapp: prefix
            const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

            // SIMULATION HOOK: If number matches simulation pattern, don't send to Twilio
            if (formattedTo.includes("REG_")) {
                console.log(`[SIMULATION] 📤 Bot would send to ${formattedTo}:`);
                console.log(`[SIMULATION] 📝 Message: ${message}`);
                return { sid: "simulated_sid_" + Date.now(), status: "sent" };
            }

            if (!this.client) {
                console.log(`[SIMULATION] 📤 No Twilio Client. Message to ${formattedTo}: ${message}`);
                return { sid: "simulated_no_client_" + Date.now(), status: "sent" };
            }

            const twilioMessage = await this.client.messages.create({
                from: this.fromNumber,
                to: formattedTo,
                body: message,
            });

            console.log(`✅ Message sent to ${formattedTo}, SID: ${twilioMessage.sid}`);
            return twilioMessage;
        } catch (error: any) {
            console.error("❌ Error sending message:", error.message);
            throw error;
        }
    }

    /**
     * Send a message with media (image, document, etc.)
     * @param to Recipient WhatsApp number
     * @param message Message text
     * @param mediaUrl URL of the media file
     */
    async sendMediaMessage(to: string, message: string, mediaUrl: string): Promise<any> {
        try {
            const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

            if (!this.client) {
                console.log(`[SIMULATION] 📤 No Twilio Client. Media to ${formattedTo}: ${message} (${mediaUrl})`);
                return { sid: "simulated_no_client_media_" + Date.now(), status: "sent" };
            }

            const twilioMessage = await this.client.messages.create({
                from: this.fromNumber,
                to: formattedTo,
                body: message,
                mediaUrl: [mediaUrl],
            });

            console.log(`✅ Media message sent to ${formattedTo}, SID: ${twilioMessage.sid}`);
            return twilioMessage;
        } catch (error: any) {
            console.error("❌ Error sending media message:", error.message);
            throw error;
        }
    }

    /**
     * Send interactive buttons (Quick Replies)
     * @param to Recipient WhatsApp number
     * @param body Message body text
     * @param buttons Array of button titles (max 3)
     */
    async sendButtonMessage(to: string, body: string, buttons: string[]): Promise<any> {
        try {
            const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

            if (!this.client) {
                console.log(`[SIMULATION] 🔘 Buttons to ${formattedTo}: [${buttons.join(' | ')}] - Body: ${body}`);
                return { sid: "simulated_buttons_" + Date.now(), status: "sent" };
            }

            // Twilio Content Template or specific formatting might be needed depending on account
            // This is a generic implementation for Twilio Interactive Messages
            const buttonList = buttons.map((b, i) => `${i + 1}️⃣ ${b}`).join("\n");
            const fullBody = `${body}\n\n${buttonList}`;

            const twilioMessage = await this.client.messages.create({
                from: this.fromNumber,
                to: formattedTo,
                body: fullBody,
            });

            console.log(`✅ Button message sent to ${formattedTo}`);
            return twilioMessage;
        } catch (error: any) {
            console.error("❌ Error sending button message:", error.message);
            throw error;
        }
    }

    /**
     * Send a Call-to-Action (CTA) link button
     * @param to Recipient WhatsApp number
     * @param body Message body
     * @param buttonLabel Text for the button
     * @param url URL to open
     */
    async sendCtaMessage(to: string, body: string, buttonLabel: string, url: string): Promise<any> {
        try {
            const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

            if (!this.client) {
                console.log(`[SIMULATION] 🔗 CTA to ${formattedTo}: [${buttonLabel} -> ${url}] - Body: ${body}`);
                return { sid: "simulated_cta_" + Date.now(), status: "sent" };
            }

            const twilioMessage = await this.client.messages.create({
                from: this.fromNumber,
                to: formattedTo,
                body: `${body}\n\n${buttonLabel}: ${url}`,
            });

            return twilioMessage;
        } catch (error: any) {
            console.error("❌ Error sending CTA message:", error.message);
            throw error;
        }
    }

    /**
     * Parse incoming Twilio webhook message
     * @param body Webhook request body
     */
    parseWebhookMessage(body: any): TwilioWhatsAppMessage {
        return {
            from: body.From || "",
            to: body.To || "",
            body: body.Body || "",
            numMedia: body.NumMedia || "0",
            mediaUrl0: body.MediaUrl0,
            mediaContentType0: body.MediaContentType0,
        };
    }

    /**
     * Validate Twilio webhook signature
     * @param signature X-Twilio-Signature header
     * @param url Full webhook URL
     * @param params Request body parameters
     */
    validateWebhookSignature(signature: string, url: string, params: any): boolean {
        try {
            return twilio.validateRequest(
                process.env.TWILIO_AUTH_TOKEN || "",
                signature,
                url,
                params
            );
        } catch (error) {
            console.error("❌ Error validating webhook signature:", error);
            return false;
        }
    }

    /**
     * Format phone number for WhatsApp (add whatsapp: prefix)
     * @param phoneNumber Phone number with country code
     */
    formatWhatsAppNumber(phoneNumber: string): string {
        // Remove any existing whatsapp: prefix
        const cleanNumber = phoneNumber.replace("whatsapp:", "");

        // Ensure it starts with +
        const withPlus = cleanNumber.startsWith("+") ? cleanNumber : `+${cleanNumber}`;

        return `whatsapp:${withPlus}`;
    }

    /**
     * Extract phone number from WhatsApp format (remove whatsapp: prefix)
     * @param whatsappNumber WhatsApp formatted number
     */
    extractPhoneNumber(whatsappNumber: string): string {
        return whatsappNumber.replace("whatsapp:", "").replace("+", "");
    }
}

export default TwilioWhatsAppClient;
