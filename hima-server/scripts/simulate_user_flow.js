
// Run this script with: node scripts/simulate_user_flow.js

const BASE_URL = process.env.SERVER_URL || 'http://localhost:8100';
const PHONE_NUMBER = '1234567890'; // Dummy number for demo

async function runDemo() {
    console.log('🚀 Starting Hima Insurance Demo Simulation...\n');

    // 1. Health Check
    try {
        const healthRes = await fetch(`${BASE_URL}/health`);
        const healthData = await healthRes.json();
        console.log('✅ Server Health:', healthData.status === 'ok' ? 'OK' : 'FAIL');
    } catch (e) {
        console.error('❌ Server is not reachable. Is it running? (pnpm run dev)');
        process.exit(1);
    }

    // 2. Get Quote
    console.log('\n2️⃣  Getting Insurance Quote...');
    const quotePayload = {
        phoneNumber: PHONE_NUMBER,
        motorcycleMake: 'Honda',
        motorcycleModel: 'CB125R',
        motorcycleYear: 2022,
        motorcycleValue: 50000,
        coverageType: 'comprehensive'
    };

    const quoteRes = await fetch(`${BASE_URL}/api/insurance/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotePayload)
    });

    if (!quoteRes.ok) {
        console.error('❌ Failed to get quote:', await quoteRes.text());
        return;
    }

    const quoteData = await quoteRes.json();
    const quoteId = quoteData.quote.id;
    console.log(`✅ Quote Received:`);
    console.log(`   - Quote ID: ${quoteId}`);
    console.log(`   - Premium: $${quoteData.quote.monthlyPremium}`);
    console.log(`   - Valid Until: ${quoteData.quote.validUntil}`);

    // 3. Create Policy (Accept Quote)
    console.log('\n3️⃣  Creating Policy (Accepting Quote)...');
    const policyPayload = {
        phoneNumber: PHONE_NUMBER,
        quoteId: quoteId,
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@example.com',
        registrationNumber: 'KDA 123X'
    };

    const policyRes = await fetch(`${BASE_URL}/api/insurance/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policyPayload)
    });

    if (!policyRes.ok) {
        console.error('❌ Failed to create policy:', await policyRes.text());
        return;
    }

    const policyData = await policyRes.json();
    const policyNumber = policyData.policy.policyNumber;
    console.log(`✅ Policy Created:`);
    console.log(`   - Policy Number: ${policyNumber}`);
    console.log(`   - Status: ${policyData.policy.status}`);

    // 4. Verify Payment (Simulated)
    console.log('\n4️⃣  Verifying Payment...');
    const paymentPayload = {
        policyNumber: policyNumber,
        transactionId: '0xSIMULATED_TRANSACTION_HASH_' + Date.now()
    };

    const paymentRes = await fetch(`${BASE_URL}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload)
    });

    if (!paymentRes.ok) {
        console.error('❌ Failed to verify payment:', await paymentRes.text());
        return;
    }

    const paymentData = await paymentRes.json();
    console.log(`✅ Payment Verified!`);
    console.log(`   - New Status: ${paymentData.policy.status}`);
    console.log(`   - Message: ${paymentData.message}`);

    // 5. Final Check
    console.log('\n5️⃣  Fetching User Details...');
    const userRes = await fetch(`${BASE_URL}/api/insurance/users/${PHONE_NUMBER}`);
    const userData = await userRes.json();

    console.log(`✅ Final User State:`);
    console.log(`   - Name: ${userData.user.name}`);
    console.log(`   - Active Policies: ${userData.user.policies.length}`);
    console.log(`   - Latest Policy Status: ${userData.user.policies[0].status}`);

    console.log('\n🎉 Demo Completed Successfully!');
}

runDemo();
