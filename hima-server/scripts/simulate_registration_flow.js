
// Run this script with: node scripts/simulate_registration_flow.js

const BASE_URL = 'http://localhost:8100';
// Use a random number each time to ensure fresh start
const PHONE_NUMBER = '+2547' + Math.floor(10000000 + Math.random() * 90000000); // Random Kenyan mobile number
const REGISTRATION_NUMBER = 'REG_' + Math.floor(Math.random() * 100000);

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// We need to access MongoDB directly to simulate "Sending Message" because 
// the server logic is coupled to ConversationManager which is internal.
// BUT, the server doesn't expose an endpoint to just "send message" for the bot to process 
// unless we use the webhook endpoint.
// Let's assume we are acting as the Twilio Webhook for simulation.

async function sendUserMessage(body) {
    const params = new URLSearchParams();
    params.append('From', `whatsapp:${PHONE_NUMBER}`);
    params.append('Body', body);

    // Note: The app.ts uses /twilio-webhook
    const res = await fetch(`${BASE_URL}/twilio-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    return res.text(); // Twilio expects TwiML, but we just want to trigger the logic
}

async function runDemo() {
    console.log('🚀 Starting Hima Registration Flow Simulation...\n');
    console.log(`👤 User Number: ${PHONE_NUMBER}`);

    // 1. Initial Greeting
    console.log('\n1️⃣  Sending "Hi"...');
    await sendUserMessage('Hi');
    console.log('   (Bot should ask for Name)');
    await delay(1000);

    // 2. Send Name
    console.log('\n2️⃣  Sending Name "John Doe"...');
    await sendUserMessage('Anwar Magera');
    console.log('   (Bot should ask for National ID)');
    await delay(1000);

    // 3. Send National ID
    console.log('\n3️⃣  Sending ID "ID-999999"...');
    await sendUserMessage('ID-999999');
    console.log('   (Bot should ask for ID Photo)');
    await delay(1000);

    // 4. Send Photo (Simulated as text)
    console.log('\n4️⃣  Sending "PHOTO_UPLOAD"...');
    await sendUserMessage('PHOTO_UPLOAD');
    console.log('   (Bot should say "Waiting for Approval")');
    await delay(1000);

    // 5. Try to proceed (Should fail/wait)
    console.log('\n5️⃣  Trying to proceed "Honda"...');
    await sendUserMessage('Honda');
    console.log('   (Bot should still say "Waiting for Approval")');
    await delay(1000);

    // 6. Admin Approve
    console.log('\n6️⃣  👨‍⚖️ ADMIN: Approving User...');

    // Dynamic import for child_process in ES module
    const { exec } = await import('child_process');

    await new Promise((resolve, reject) => {
        exec(`node scripts/admin_approve_user.js ${PHONE_NUMBER}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                reject(error);
                return;
            }
            console.log(stdout);
            resolve();
        });
    });

    // 7. Try to proceed again (Should work)
    console.log('\n7️⃣  User checks status "Hi"...');
    await sendUserMessage('Hi');
    console.log('   (Bot should now ask for Motorcycle Make)');
    // Note: In logic, if verified, sending anything transitions to ASKING_MOTORCYCLE_MAKE and returns prompt.

    console.log('\n🎉 Simulation Completed! Check server logs to verify bot responses.');
}

runDemo();
