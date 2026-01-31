import axios from 'axios';
import config from '../Configs/configs.js';
import { fileLogger } from '../libs/fileLogger.js';

export interface MistralMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

class MistralService {
    private apiKey: string;
    private apiUrl: string;
    private model: string;

    constructor() {
        this.apiKey = config.mistral.apiKey;
        this.apiUrl = config.mistral.apiUrl;
        this.model = config.mistral.model;
    }

    /**
     * Generate a response using Mistral AI
     */
    public async generateResponse(messages: MistralMessage[]): Promise<string> {
        if (!this.apiKey) {
            fileLogger.log('⚠️ [MISTRAL] API Key is missing.', 'WARN');
            return "I'm sorry, I'm having trouble connecting to my AI brain right now. Please try again later or type HELP for standard options.";
        }

        try {
            const response = await axios.post(
                `${this.apiUrl}/chat/completions`,
                {
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data.choices[0].message.content.trim();
        } catch (error: any) {
            fileLogger.log(`❌ [MISTRAL] Error generating response: ${error.response?.data?.error?.message || error.message}`, 'ERROR');
            return "I'm sorry, I encountered an error while processing your request. Please try again later.";
        }
    }

    /**
     * Detect user intent based on input
     */
    public async detectIntent(userInput: string): Promise<string> {
        const systemPrompt = `
You are an intent detection assistant for HIMA, a boda boda (motorcycle) insurance provider in Kenya.
Analyze the user's input and categorize it into exactly one of the following labels:
- BUY_INSURANCE: User wants to buy/purchase insurance, asking about prices, available covers, or how to get insured.
- FILE_CLAIM: User wants to report an accident, file a claim, or asking about the claim process.
- CHANGE_LANGUAGE: User wants to switch between English and Swahili.
- CONTACT_SUPPORT: User specifically asks for human help, admin, agent, or wants to speak to "MasterChief" (the founder).
- CANCEL: User wants to stop the current process, cancel, go back, or reset.
- UNKNOWN: Use this if the intent is not clear, is a general question, or is conversational (greetings, thanks, etc.).

Your response must be ONLY the label.`;

        const messages: MistralMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput }
        ];

        const result = await this.generateResponse(messages);
        // Clean up the response to get only the uppercase label
        const matches = result.match(/\b(BUY_INSURANCE|FILE_CLAIM|CHANGE_LANGUAGE|CONTACT_SUPPORT|CANCEL|UNKNOWN)\b/i);
        return matches ? matches[0].toUpperCase() : 'UNKNOWN';
    }

    /**
     * Get a HIMA context-aware response for general queries
     */
    public async getHimaResponse(userInput: string, context: string = '', language: 'en' | 'sw' = 'en'): Promise<string> {
        const { microInsuranceInfo } = await import('../data/microInsuranceInfo.js');

        const systemPrompt = `
You are the HIMA Insurance Assistant (powered by Mistral 7B). 
You help boda boda riders in Kenya. You must chat naturally like ChatGPT but stay focused on HIMA Insurance.

### USER ACCOUNT DATA (FROM DATABASE):
${context || 'NO DATA FOUND. USER IS NEW.'}

### OPERATING PRINCIPLES:
1. **Fact Priority**: If the answer is in the "USER ACCOUNT DATA" above, use it. 
2. **Direct Results**: If asked for name, ID, or plate, give ONLY that value. 
   - User: "My name?" -> Assistant: "John Doe"
   - User: "Tell me my name" -> Assistant: "Anwar magara sadat"
3. **Conversational Style**: Be friendly but extremely concise (max 12 words).
4. **Anti-Hallucination**: NEVER make up policy numbers or names. If not in the data, say "I don't have that in your records."
5. **No Explanations**: Do NOT explain yourself unless they ask "Why?", "Explain", or "How?".
6. **No Fillers**: Do not say "According to my records" or "Based on the context". Just speak the truth.

### HIMA KNOWLEDGE:
${microInsuranceInfo}

Language: ${language === 'sw' ? 'Swahili' : 'English'}.
`;

        const messages: MistralMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput }
        ];

        return await this.generateResponse(messages);
    }

    /**
     * Generate a conversational prompt for any flow (Registration, Buying, Claims)
     */
    public async getConversationalPrompt(
        action: 'REGISTER' | 'BUY' | 'CLAIM',
        field: string,
        language: 'en' | 'sw' = 'en',
        userContext?: string // The previous answer from the user
    ): Promise<string> {
        let fieldDescription = "";

        // Define task description based on field
        switch (field) {
            // Registration
            case 'FULL_NAME': fieldDescription = "Ask for full name (as on ID)."; break;
            case 'ID_NUMBER': fieldDescription = "Ask for National ID Number."; break;
            case 'DOB': fieldDescription = "Ask for Date of Birth (YYYY-MM-DD)."; break;
            case 'PLATE_NUMBER': fieldDescription = "Ask for Motorcycle Plate Number."; break;
            case 'ID_PHOTO': fieldDescription = "Ask for ID photo."; break;
            case 'LOGBOOK_PHOTO': fieldDescription = "Ask for Logbook photo."; break;
            case 'BIKE_PHOTO': fieldDescription = "Ask for Motorcycle photo (front view)."; break;
            case 'SELFIE_PHOTO': fieldDescription = "Ask for a selfie."; break;

            // Buying Flow
            case 'SELECT_COVER': fieldDescription = "Present the insurance options (Third Party, Comprehensive, Personal Accident) in a friendly way."; break;
            case 'BUY_PLATE_NUMBER': fieldDescription = "Ask for the motorcycle's plate number/registration number."; break;
            case 'COVERAGE_DURATION': fieldDescription = "Ask the user to choose coverage duration: Daily, Weekly, or Monthly."; break;
            case 'CONFIRM_PURCHASE': fieldDescription = "Summarize the purchase details (product, duration, plate, price) and ask for confirmation."; break;
            case 'PAYMENT_INITIATED': fieldDescription = "Inform the user that M-Pesa payment has been initiated and they should check their phone."; break;
            case 'PURCHASE_CANCELLED': fieldDescription = "Acknowledge that the purchase was cancelled."; break;

            // Claims Flow
            case 'CLAIM_DATE': fieldDescription = "Ask when the incident happened (YYYY-MM-DD). Be empathetic."; break;
            case 'CLAIM_LOCATION': fieldDescription = "Ask where the incident happened."; break;
            case 'CLAIM_DESCRIPTION': fieldDescription = "Ask for a brief description of what happened."; break;
            case 'CLAIM_DAMAGE_PHOTO': fieldDescription = "Ask for a photo of the damage."; break;
            case 'CLAIM_POLICE_ABSTRACT': fieldDescription = "Ask for a photo of the police abstract."; break;
            case 'CLAIM_SUBMITTED': fieldDescription = "Confirm that the claim has been submitted and reassure the user it will be reviewed."; break;

            // General Messages
            case 'MENU_GREETING': fieldDescription = "Greet the user warmly and ask how you can help them today."; break;
            case 'PAYMENT_PENDING': fieldDescription = "Inform the user that we're still waiting for payment confirmation."; break;
            case 'ERROR_FALLBACK': fieldDescription = "Apologize for confusion and offer to help restart or guide them."; break;

            default: fieldDescription = `Ask for ${field}.`;
        }

        const systemPrompt = `
You are HIMA's ${action.toLowerCase()} assistant.
Current Language: ${language === 'sw' ? 'Swahili' : 'English'}.

YOUR EXACT TASK: ${fieldDescription}
User's previous input: "${userContext || ''}"

GUIDELINES:
1. If the user's previous input is relevant (e.g. they gave a name), acknowledge it briefly (e.g. "Thanks [Name].").
2. THEN IMMEDIATELY ASK THE QUESTION IN THE "TASK".
3. Your goal is to GUIDE the user through a form-like process. Ask ONLY one question at a time.
4. Do NOT give instructions or tell them what they will do later. Just ask the current question.
5. Keep it under 2 sentences.
`;

        const messages: MistralMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: "Generate the response." }
        ];

        return await this.generateResponse(messages);
    }
}

export default new MistralService();
