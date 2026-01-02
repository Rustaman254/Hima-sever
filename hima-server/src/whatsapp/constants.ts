export const CONVERSATION_STATES = {
    INITIAL: "initial",
    GREETING: "greeting",
    ASKING_NAME: "asking_name",
    ASKING_NATIONAL_ID: "asking_national_id",
    ASKING_ID_PHOTO: "asking_id_photo",
    WAITING_FOR_APPROVAL: "waiting_for_approval",
    ASKING_MOTORCYCLE_MAKE: "asking_motorcycle_make",
    ASKING_MOTORCYCLE_MODEL: "asking_motorcycle_model",
    ASKING_MOTORCYCLE_YEAR: "asking_motorcycle_year",
    ASKING_REGISTRATION: "asking_registration",
    ASKING_INSURANCE_PRODUCT: "asking_insurance_product",
    ASKING_MOTORCYCLE_VALUE: "asking_motorcycle_value",
    ASKING_COVERAGE_TYPE: "asking_coverage_type",
    SHOWING_QUOTE: "showing_quote",
    ASKING_QUOTE_ACCEPTANCE: "asking_quote_acceptance",
    PROCESSING_PAYMENT: "processing_payment",
    PAYMENT_COMPLETE: "payment_complete",
    POLICY_ISSUED: "policy_issued",
    ASKING_CLAIM_DESCRIPTION: "asking_claim_description",
    ASKING_CLAIM_PHOTO: "asking_claim_photo",
    CLAIM_SUBMITTED: "claim_submitted",
    END: "end",
};

export const COVERAGE_TYPES = {
    BASIC: "basic",
    COMPREHENSIVE: "comprehensive",
    PREMIUM: "premium",
};

export const COVERAGE_DETAILS = {
    basic: {
        name: "Basic Coverage",
        coverage: "Third-party liability",
        description: "Covers damages you cause to third parties",
    },
    comprehensive: {
        name: "Comprehensive Coverage",
        coverage: "Theft, fire, accidents, and third-party",
        description:
            "Covers theft, fire, accidents, and liability to third parties",
    },
    premium: {
        name: "Premium Coverage",
        coverage:
            "Full coverage with roadside assistance and personal accident",
        description: "Complete protection with 24/7 roadside assistance",
    },
};

export const MESSAGES = {
    WELCOME: `Welcome to Hima Connect! 👋

I'm your motorcycle insurance assistant. I'm here to help you get affordable insurance for your motorcycle in just a few minutes.

A secure Hima EVM wallet has been created for you. You can see your address in your profile after registration.`,

    REGISTRATION_INVITE: `To get started, please register your profile. It only takes a minute!`,

    ASKING_FIRST_NAME: `Let's get started! What's your first name?`,

    ASKING_LAST_NAME: `Nice to meet you! What's your last name?`,

    ASKING_NATIONAL_ID: `Thanks! We need to verify your identity. What is your National ID number?`,

    ASKING_ID_PHOTO: `Great! Please upload a clear photo of your National ID.`,

    WAITING_FOR_APPROVAL: (name: string, id: string, phone: string, walletAddr: string) => `✅ Profile Updated!

👤 Profile Information:
• Name: ${name}
• ID: ${id}
• Wallet: ${walletAddr}
• KYC Status: Under Review

We'll notify you here as soon as your account is verified!`,

    ACCOUNT_REJECTED: `We're sorry, but your account registration was rejected. Please contact support for more information.`,

    KYC_APPROVED: (name: string) => `🎉 Great news, ${name}! 
Your Hima account has been officially verified! 

You can now proceed to protect your motorcycle or manage your account.`,

    KYC_REJECTED: (name: string) => `Hello ${name}, we've reviewed your KYC documents and unfortunately we couldn't verify your identity at this time. 

Please re-upload a clearer photo of your National ID to proceed.`,

    ASKING_MOTORCYCLE_MAKE: `Thanks! Now, what's the make of your motorcycle? (e.g., Honda, Yamaha, Bajaj)`,

    ASKING_MOTORCYCLE_MODEL: `Great! What's the model? (e.g., CB125R, YZF-R3, CT100)`,

    ASKING_MOTORCYCLE_YEAR: `What year was it manufactured?`,

    ASKING_REGISTRATION: `What's your vehicle registration number?`,

    ASKING_MOTORCYCLE_VALUE: `What's the current market value of your motorcycle in your local currency?`,

    SELECT_PRODUCT: `📋 Choose your insurance plan:

{products}

Just reply with the number (e.g., 1, 2, or 3)`,

    ASKING_COVERAGE: `Perfect! Now, what type of coverage would you prefer?

1️⃣ Basic Coverage - Third-party liability protection
2️⃣ Comprehensive Coverage - Theft, fire, accidents, and third-party
3️⃣ Premium Coverage - Full protection with 24/7 roadside assistance`,

    CALCULATING_QUOTE: `Let me calculate your personalized quote...`,

    QUOTE_READY: (firstName: string, make: string, model: string, coverage: string, price: string) => `
Great news, ${firstName}! 🎉

Here's your personalized quote for your ${model} ${make}:

📋 Coverage: ${coverage}
💰 Price: ${price}/month

This price is locked for 24 hours. Would you like to proceed with this insurance?`,

    COVERAGE_DETAILS: (type: string) => {
        const details = COVERAGE_DETAILS[type as keyof typeof COVERAGE_DETAILS];
        return `
📋 ${details.name}

Coverage includes: ${details.coverage}
Description: ${details.description}`;
    },

    PAYMENT_INSTRUCTIONS: (amount: string) => `
Excellent choice! Let's proceed with your insurance. 

💳 Payment Details:
Amount: ${amount}

Please click the link below to complete your payment securely:

[PAYMENT LINK]

Once you complete the payment, your insurance will be activated immediately.`,

    PAYMENT_CONFIRMATION: (policyNumber: string, coverage: string) => `
✅ Payment Successful!

Your insurance is now active! 🎉

📋 Policy Details:
Policy Number: ${policyNumber}
Coverage: ${coverage}
Status: Active

You can now ride with peace of mind. Your policy details have been sent to your email.

Is there anything else I can help you with?`,

    ERROR: `I didn't quite understand that. Could you please try again?`,

    INVALID_INPUT: `That doesn't look right. Please follow the options provided.`,

    MAIN_MENU: (name: string) => `How can I help you today, ${name}?`,

    MAIN_MENU_OPTIONS: ["Buy Insurance", "File a Claim", "My Profile"],

    ASKING_CLAIM_DESCRIPTION: `We're sorry to hear that. Please describe the incident in a few words. (e.g., "Minor collision at Haile Selassie Ave")`,

    ASKING_CLAIM_PHOTO: `Please upload a photo of the damage or the police report if available.`,

    CLAIM_SUBMITTED: `✅ Claim Received!
We have received your claim request. Our team will review it and get back to you within 24 hours.

You can track your claim status in your dashboard.`,
};
