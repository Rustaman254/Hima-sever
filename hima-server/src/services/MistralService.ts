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
        const matches = result.match(/\b(BUY_INSURANCE|FILE_CLAIM|CHANGE_LANGUAGE|CONTACT_SUPPORT|CANCEL|EXIT|UNKNOWN)\b/i);
        return matches ? matches[0].toUpperCase() : 'UNKNOWN';
    }

    /**
     * Get a HIMA context-aware response for general queries
     */
    public async getHimaResponse(userInput: string, context: string = '', language: 'en' | 'sw' = 'en'): Promise<string> {
        const { microInsuranceInfo } = await import('../data/microInsuranceInfo.js');

        const systemPrompt = `
You are the HIMA Insurance AI Agent. You help boda boda (motorcycle) riders in Kenya with micro-insurance.
Chat naturally like ChatGPT, but stay strictly within HIMA's scope. 

### VERIFIED USER DATA (FROM MONGODB):
${context || 'USER IS NOT REGISTERED YET.'}

### OPERATING RULES:
1. **Fact Priority**: If an answer is in the "VERIFIED USER DATA" above (name, ID, plate, policies), you MUST use it. 
2. **No Hallucinations**: Do NOT make up policy numbers, names, or registration digits. If missing from data, say: "I don't have that in our records."
3. **Directness**: If asked for name/ID/plate, give ONLY that value. Example: "John Doe" (NOT "Your name is John Doe").
4. **Conciseness**: Keep replies under 12 words unless listing items.
5. **No Greeters/Fillers**: Don't say "Hello" (unless they did) or "According to our records". Just give facts.
6. **Language**: ${language === 'sw' ? 'Respond in Swahili.' : 'Respond in English.'}

### HIMA INFO:
${microInsuranceInfo}
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
            case 'REG_START': fieldDescription = "Welcome the user to HIMA and explain that you need to register them. Ask if they are ready to start."; break;
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
            case 'BUY_BIKE_COLOR': fieldDescription = "Ask for the color of the motorbike."; break;
            case 'BUY_BIKE_YEAR': fieldDescription = "Ask for the year the motorbike was manufactured."; break;
            case 'BUY_BIKE_PHOTO': fieldDescription = "Ask for a fresh, clear photo of the motorbike as it is today. Explain this is for comprehensive coverage verification."; break;
            case 'BUY_PA_BENEFICIARY': fieldDescription = "Ask who should be the beneficiary of the Personal Accident cover (Full Name and relationship)."; break;
            case 'COVERAGE_DURATION': fieldDescription = "Ask the user to choose coverage duration: Daily, Weekly, or Monthly. Explain the benefits if helpful."; break;
            case 'BUY_CONFIRM': fieldDescription = "The user has provided all details. Summarize the plan and price, and ask them to say 'Confirm' or 'Pay' to proceed with M-Pesa."; break;
            case 'CONFIRM_PURCHASE': fieldDescription = "Summarize the purchase details (product, duration, plate, price) and ask for confirmation."; break;
            case 'PAYMENT_INITIATED': fieldDescription = "Inform the user that M-Pesa payment has been initiated and they should check their phone."; break;
            case 'PURCHASE_CANCELLED': fieldDescription = "Acknowledge that the purchase was cancelled."; break;

            // Claims Flow
            case 'CLAIM_START': fieldDescription = "Acknowledge that you can help with a claim. Ask for the date of the incident."; break;
            case 'CLAIM_DATE': fieldDescription = "Ask when the incident happened (YYYY-MM-DD). Be empathetic."; break;
            case 'CLAIM_TIME': fieldDescription = "Ask roughly what time the incident happened (e.g. 10:00 AM)."; break;
            case 'CLAIM_LOCATION': fieldDescription = "Ask where the incident happened (Street name, City, Landmarks)."; break;
            case 'CLAIM_DESCRIPTION': fieldDescription = "Ask for a brief description of how the accident occurred."; break;
            case 'CLAIM_BIKE_PHOTO': fieldDescription = "Ask for a photo of the motorbike as it stands now (full view)."; break;
            case 'CLAIM_DAMAGE_PHOTO': fieldDescription = "Ask for a close-up photo of the specific damage area."; break;
            case 'CLAIM_POLICE_ABSTRACT': fieldDescription = "Ask for a photo of the police abstract report."; break;
            case 'CLAIM_SUBMITTED': fieldDescription = "Confirm that the claim has been submitted. Reassure the user it will be reviewed and someone will call them shortly."; break;
            case 'CLAIM_REJECTED': fieldDescription = "Explain why the claim couldn't be filed (e.g. no active policy) and guide them on what to do."; break;

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
User's previous response: "${userContext || ''}"

GUIDELINES:
1. **Analyze Response**: If the user's response is an answer to the previous question (e.g. a name, a date), acknowledge it naturally (e.g. "Got it, [Name].").
2. **Answer Questions**: If the user's response is a question or concern (e.g. "Why?", "Is it safe?"), ANSWER it briefly first based on HIMA knowledge.
3. **Ask Next**: After acknowledging or answering, IMMEDIATELY ask the question for the current "TASK".
4. **Natural Transition**: Make the transition feel like a real human assistant, not a form.
5. **No Greeters/Fillers**: Keep it under 3 sentences.
`;

        const messages: MistralMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: "Generate the response." }
        ];

        return await this.generateResponse(messages);
    }
}

export default new MistralService();
