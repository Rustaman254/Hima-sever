import axios from "axios";
import config from "../Configs/configs.js";

/**
 * M-Pesa Daraja API Integration Service
 * Handles STK Push payments and B2C payouts
 */
class MpesaService {
    private consumerKey: string;
    private consumerSecret: string;
    private shortcode: string;
    private passkey: string;
    private baseUrl: string;
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY || "";
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || "";
        this.shortcode = process.env.MPESA_SHORTCODE || "";
        this.passkey = process.env.MPESA_PASSKEY || "";

        // Use sandbox for testing, production for live
        this.baseUrl =
            process.env.MPESA_ENVIRONMENT === "production"
                ? "https://api.safaricom.co.ke"
                : "https://sandbox.safaricom.co.ke";
    }

    /**
     * Get OAuth access token
     */
    private async getAccessToken(): Promise<string> {
        // Return cached token if still valid
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const auth = Buffer.from(
                `${this.consumerKey}:${this.consumerSecret}`
            ).toString("base64");

            const response = await axios.get(
                `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
                {
                    headers: {
                        Authorization: `Basic ${auth}`,
                    },
                }
            );

            this.accessToken = response.data.access_token;
            // Token expires in 3599 seconds, cache for 3500 seconds
            this.tokenExpiry = Date.now() + 3500 * 1000;

            return this.accessToken as string;
        } catch (error: any) {
            console.error("❌ M-Pesa auth error:", error.response?.data || error.message);
            throw new Error("Failed to get M-Pesa access token");
        }
    }

    /**
     * Generate password for STK Push
     */
    private generatePassword(): { password: string; timestamp: string } {
        const timestamp = new Date()
            .toISOString()
            .replace(/[^0-9]/g, "")
            .slice(0, 14);
        const password = Buffer.from(
            `${this.shortcode}${this.passkey}${timestamp}`
        ).toString("base64");

        return { password, timestamp };
    }

    /**
     * Initiate STK Push (customer payment request)
     * @param phoneNumber Customer phone number (format: 254XXXXXXXXX)
     * @param amount Amount in KES
     * @param accountReference Policy ID or reference
     * @param transactionDesc Description
     */
    async initiateSTKPush(
        phoneNumber: string,
        amount: number,
        accountReference: string,
        transactionDesc: string
    ): Promise<any> {
        try {
            const accessToken = await this.getAccessToken();
            const { password, timestamp } = this.generatePassword();

            // Ensure phone number is in correct format (254XXXXXXXXX)
            const formattedPhone = phoneNumber.startsWith("254")
                ? phoneNumber
                : `254${phoneNumber.replace(/^0+/, "")}`;

            const callbackUrl = `${process.env.SERVER_URL || "http://localhost:8100"}/api/mpesa/callback`;

            const payload = {
                BusinessShortCode: this.shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: Math.round(amount), // M-Pesa requires integer
                PartyA: formattedPhone,
                PartyB: this.shortcode,
                PhoneNumber: formattedPhone,
                CallBackURL: callbackUrl,
                AccountReference: accountReference,
                TransactionDesc: transactionDesc,
            };

            const response = await axios.post(
                `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("✅ STK Push initiated:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("❌ STK Push error:", error.response?.data || error.message);
            throw new Error("Failed to initiate M-Pesa payment");
        }
    }

    /**
     * Query STK Push transaction status
     * @param checkoutRequestID Checkout request ID from STK Push
     */
    async querySTKPushStatus(checkoutRequestID: string): Promise<any> {
        try {
            const accessToken = await this.getAccessToken();
            const { password, timestamp } = this.generatePassword();

            const payload = {
                BusinessShortCode: this.shortcode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestID,
            };

            const response = await axios.post(
                `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            console.error("❌ STK Push query error:", error.response?.data || error.message);
            throw new Error("Failed to query M-Pesa transaction");
        }
    }

    /**
     * Initiate B2C payout (claim payout to rider)
     * @param phoneNumber Recipient phone number (format: 254XXXXXXXXX)
     * @param amount Amount in KES
     * @param remarks Payout remarks
     */
    async initiateB2CPayout(
        phoneNumber: string,
        amount: number,
        remarks: string
    ): Promise<any> {
        try {
            const accessToken = await this.getAccessToken();

            // Ensure phone number is in correct format
            const formattedPhone = phoneNumber.startsWith("254")
                ? phoneNumber
                : `254${phoneNumber.replace(/^0+/, "")}`;

            const resultUrl = `${process.env.SERVER_URL || "http://localhost:8100"}/api/mpesa/b2c-result`;
            const queueTimeoutUrl = `${process.env.SERVER_URL || "http://localhost:8100"}/api/mpesa/b2c-timeout`;

            const payload = {
                InitiatorName: process.env.MPESA_INITIATOR_NAME || "testapi",
                SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || "",
                CommandID: "BusinessPayment",
                Amount: Math.round(amount),
                PartyA: this.shortcode,
                PartyB: formattedPhone,
                Remarks: remarks,
                QueueTimeOutURL: queueTimeoutUrl,
                ResultURL: resultUrl,
                Occasion: "Claim Payout",
            };

            const response = await axios.post(
                `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("✅ B2C payout initiated:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("❌ B2C payout error:", error.response?.data || error.message);
            throw new Error("Failed to initiate M-Pesa payout");
        }
    }

    /**
     * Validate M-Pesa callback signature
     */
    validateCallback(callbackData: any): boolean {
        // TODO: Implement signature validation for production
        // For now, basic validation
        return callbackData && callbackData.Body;
    }
}

export default new MpesaService();
