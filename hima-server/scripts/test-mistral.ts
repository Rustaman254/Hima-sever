import MistralService from '../src/services/MistralService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testMistral() {
    console.log('🚀 Testing Mistral Service...');

    const testInputs = [
        "How much is boda boda insurance?",
        "I want to report an accident",
        "Show my wallet address",
        "Habari, mambo vipi?",
        "What is Hima?",
        "Tell me about micro-insurance",
        "I want to speak to MasterChief",
        "Can I talk to a human?"
    ];

    console.log('\n--- INTENT & RESPONSE TEST ---');
    for (const input of testInputs) {
        console.log(`\n📝 Input: "${input}"`);

        const intent = await MistralService.detectIntent(input);
        console.log(`🔍 Detected Intent: ${intent}`);

        const response = await MistralService.getHimaResponse(input, 'en');
        console.log(`🤖 AI Response: ${response}`);
    }

    console.log('\n--- CONVERSATIONAL FLOW TEST ---');

    // Simulate a Registration Flow
    console.log('\n[Simulating Registration]');
    let context = "";

    // Step 1: Start
    let prompt = await MistralService.getConversationalPrompt('REGISTER', 'FULL_NAME', 'en');
    console.log(`🤖 Bot: ${prompt}`);

    // Step 2: User replies Name
    context = "John Doe";
    console.log(`👤 User: ${context}`);
    prompt = await MistralService.getConversationalPrompt('REGISTER', 'ID_NUMBER', 'en', context);
    console.log(`🤖 Bot: ${prompt}`);

    // Step 3: User replies ID
    context = "12345678";
    console.log(`👤 User: ${context}`);
    prompt = await MistralService.getConversationalPrompt('REGISTER', 'DOB', 'en', context);
    console.log(`🤖 Bot: ${prompt}`);

    // Simulate Claim Flow
    console.log('\n[Simulating Claim]');
    context = "I had an accident";
    console.log(`👤 User: ${context}`);
    prompt = await MistralService.getConversationalPrompt('CLAIM', 'CLAIM_DATE', 'en', context);
    console.log(`🤖 Bot: ${prompt}`);
}

testMistral().catch(console.error);
