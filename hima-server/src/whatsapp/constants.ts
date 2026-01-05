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
    WELCOME: `✨ Welcome to Hima - The Future of Smart Insurance! 🛡️

We're reimagining motorcycle protection with blockchain security and instant payouts.

🚀 Since this is your first time here, we've automatically secured a blockchain wallet for you. You can manage your digital assets and view your policies anytime in your profile.

Are you ready to start your registration and join the elite group of protected riders?`,

    GREETING_REGISTERED: (name: string) => `Welcome back, ${name}! 🏍️\n\nReady to get covered or manage your policies?`,

    WELCOME_TEMPLATE: {
        name: "welcome_new_user",
        language: "en",
        body: `Welcome to Hima Insurance Platform!

We're excited to have you join our community of protected riders.

Your secure blockchain wallet has been created automatically. You can view your wallet address and manage your policies through your profile.

To get started, please complete your registration by providing a few details.`,
    },

    REGISTRATION_INVITE: `🌟 To unlock your full potential on Hima, please complete your profile registration. It's fast and secure!`,

    ASKING_FIRST_NAME: `Excellent! Let's start with your profile. 👤

What is your first name?`,

    ASKING_LAST_NAME: `Great to meet you! And what is your last name?`,

    ASKING_NATIONAL_ID: `🛡️ Security is our priority. We need to verify your identity to comply with local regulations.

What is your National ID number?`,

    ASKING_ID_PHOTO: `📸 Perfect! Now, please upload a clear photo of your National ID. 

Make sure all details are visible and there's no glare.`,

    WAITING_FOR_APPROVAL: (name: string, id: string, phone: string, walletAddr: string) => `✅ Profile Updated Successfully!

Profile Summary:
👤 Name: ${name}
🆔 ID: ${id}
🔗 Wallet: ${walletAddr}
📊 KYC Status: ⏳ Under Review

We're reviewing your documents and will notify you as soon as your account is verified. You can explore your profile in the meantime!`,

    ACCOUNT_REJECTED: `❌ We're sorry, but your account registration couldn't be approved at this time. 

Please reach out to our dedicated support team for assistance.`,

    KYC_APPROVED: (name: string) => `🎉 Great news, ${name}!

Your Hima account has been officially verified! 🏆

You're now ready to join the future of insurance. What would you like to do next?`,

    KYC_REJECTED: (name: string) => `⚠️ Hello ${name}, we've reviewed your KYC documents and unfortunately, some details are unclear.

Please re-upload a clear, high-resolution photo of your National ID to proceed with verification.`,


    ASKING_MOTORCYCLE_MAKE: `Thanks! Now, what's the make of your motorcycle?

Examples: Honda, Yamaha, Bajaj, Suzuki`,

    ASKING_MOTORCYCLE_MODEL: `Great! What's the model?

Examples: CB125R, YZF-R3, CT100, GS150`,

    ASKING_MOTORCYCLE_YEAR: `What year was it manufactured?`,

    ASKING_REGISTRATION: `What's your vehicle registration number?`,

    ASKING_MOTORCYCLE_VALUE: `What's the current market value of your motorcycle in KES?

Please enter numbers only (e.g., 50000)`,

    SELECT_PRODUCT: `Choose your insurance plan from the options below:`,

    ASKING_COVERAGE: `Perfect! Now, what type of coverage would you prefer?

1. Basic Coverage - Third-party liability protection
2. Comprehensive Coverage - Theft, fire, accidents, and third-party
3. Premium Coverage - Full protection with 24/7 roadside assistance`,

    CALCULATING_QUOTE: `🔄 Calculating your personalized smart-insurance quote...`,

    QUOTE_READY: (firstName: string, make: string, model: string, coverage: string, price: string) => `
💎 Exclusive Quote for ${firstName}!

We've found a great rate for your ${make} ${model}:

📋 Coverage: ${coverage}
💰 Monthly Premium: ${price}

This offer is valid for 24 hours. Ready to activate your protection?`,

    COVERAGE_DETAILS: (type: string) => {
        const details = COVERAGE_DETAILS[type as keyof typeof COVERAGE_DETAILS];
        return `
📌 ${details.name}

🛡️ Includes: ${details.coverage}
📝 Description: ${details.description}`;
    },

    PAYMENT_INSTRUCTIONS: (amount: string) => `
💸 Complete Your Activation

Amount Due: KES ${amount}

Please click the secure link below to finalize your payment and activate your coverage immediately. 🚀`,

    PAYMENT_CONFIRMATION: (policyNumber: string, coverage: string) => `🎊 Payment Confirmed!

Congratulations! Your Hima Smart Insurance is now active. 🥳

📜 Policy Details:
- Number: ${policyNumber}
- Type: ${coverage}
- Status: ✅ Active

Riders, you're now part of a safer future. Safe travels! 🏍️⚡`,


    ERROR: `I didn't quite understand that. Could you please try again?`,

    INVALID_INPUT: `That doesn't look right. Please follow the options provided.`,

    MAIN_MENU: (name: string) => `How can I help you today, ${name}?`,

    MAIN_MENU_OPTIONS: ["Buy Insurance", "File Claim", "My Profile"],

    ASKING_CLAIM_DESCRIPTION: `We're sorry to hear that. Please describe the incident in a few words.

Example: "Minor collision at Haile Selassie Ave"`,

    ASKING_CLAIM_PHOTO: `Please upload a photo of the damage or the police report if available.`,

    CLAIM_SUBMITTED: `Claim Received!

We have received your claim request. Our team will review it and get back to you within 24 hours.

You can track your claim status in your dashboard.`,
};
