import axios from "axios";
import config from "../Configs/configs.js";

interface WhatsAppMessage {
    messaging_product: "whatsapp";
    to: string;
    type: "text" | "template" | "interactive";
    text?: { body: string };
    template?: any;
    interactive?: any;
}

export class WhatsAppClient {
    private static instance: WhatsAppClient;
    private baseUrl: string;
    private headers: any;

    private constructor() {
        this.baseUrl = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}`;
        this.headers = {
            "Authorization": `Bearer ${config.whatsapp.accessToken}`,
            "Content-Type": "application/json",
        };
    }

    public static getInstance(): WhatsAppClient {
        if (!WhatsAppClient.instance) {
            WhatsAppClient.instance = new WhatsAppClient();
        }
        return WhatsAppClient.instance;
    }

    /**
     * Send a raw message object to WhatsApp API
     */
    public async sendMessage(message: WhatsAppMessage): Promise<any> {
        try {
            const url = `${this.baseUrl}/messages`;
            const response = await axios.post(url, message, { headers: this.headers });
            return response.data;
        } catch (error: any) {
            console.error("WhatsApp API Error:", error.response?.data || error.message);
            throw new Error(`Failed to send WhatsApp message: ${error.message}`);
        }
    }

    /**
     * Send a simple text message
     */
    public async sendTextMessage(to: string, body: string): Promise<any> {
        const message: WhatsAppMessage = {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body }
        };
        return this.sendMessage(message);
    }

    /**
     * Send a template message
     */
    public async sendTemplateMessage(to: string, templateName: string, languageCode: string = "en_US", components: any[] = []): Promise<any> {
        const message: WhatsAppMessage = {
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
                name: templateName,
                language: { code: languageCode },
                components
            }
        };
        return this.sendMessage(message);
    }

    /**
     * Send an interactive button message
     */
    /**
     * Send an interactive button message
     */
    public async sendButtonMessage(to: string, body: string, buttons: { id: string, title: string }[]): Promise<any> {
        const message: WhatsAppMessage = {
            messaging_product: "whatsapp",
            to,
            type: "interactive",
            interactive: {
                type: "button",
                body: { text: body },
                action: {
                    buttons: buttons.map(btn => ({
                        type: "reply",
                        reply: {
                            id: btn.id,
                            title: btn.title.substring(0, 20) // Limit title length
                        }
                    }))
                }
            }
        };
        return this.sendMessage(message);
    }
}

export default WhatsAppClient.getInstance();
