/**
 * Bilingual Translation Utility for HIMA WhatsApp Bot
 * Supports English (en) and Swahili (sw)
 */

export type Language = 'en' | 'sw';

interface TranslationParams {
    [key: string]: string | number;
}

// Translation dictionary
const translations: Record<string, Record<Language, string>> = {
    // Language Selection
    welcome_language: {
        en: 'Karibu HIMA 🚀\nWelcome to HIMA, boda boda insurance on WhatsApp.\n\nChagua lugha / Choose language:',
        sw: 'Karibu HIMA 🚀\nWelcome to HIMA, bima ya boda boda kwenye WhatsApp.\n\nChagua lugha / Choose language:'
    },
    lang_button_english: {
        en: 'English',
        sw: 'English'
    },
    lang_button_swahili: {
        en: 'Kiswahili',
        sw: 'Kiswahili'
    },

    // No Account / Registration
    welcome_no_account: {
        en: 'Welcome to HIMA 🚀\nYou do not have an account yet. Let us register you.',
        sw: 'Karibu HIMA 🚀\nHujasajili akaunti bado. Tuchukue maelezo yako kwanza.'
    },
    reg_start_button: {
        en: 'Start registration',
        sw: 'Anza usajili'
    },
    reg_full_name: {
        en: 'Please send your full name as on your ID.',
        sw: 'Tafadhali tuma majina yako kamili kama yalivyo kwenye kitambulisho.'
    },
    reg_id_number: {
        en: 'Please send your National ID number.',
        sw: 'Tafadhali tuma nambari ya kitambulisho chako cha taifa.'
    },
    reg_dob: {
        en: 'Please send your date of birth (format: YYYY-MM-DD, e.g., 1990-05-15).',
        sw: 'Tafadhali tuma tarehe yako ya kuzaliwa (muundo: YYYY-MM-DD, mfano: 1990-05-15).'
    },
    reg_plate_number: {
        en: 'Please send your motorcycle plate number (e.g., KCA 123A).',
        sw: 'Tafadhali tuma nambari ya gari lako la pikipiki (mfano: KCA 123A).'
    },
    reg_id_photo: {
        en: 'Please send a clear photo of your National ID (front side).',
        sw: 'Tafadhali tuma picha wazi ya kitambulisho chako cha taifa (upande wa mbele).'
    },
    reg_logbook_photo: {
        en: 'Please send a photo of your motorcycle logbook.',
        sw: 'Tafadhali tuma picha ya logbook ya pikipiki yako.'
    },
    reg_bike_photo: {
        en: 'Please send a photo of your motorcycle (showing the plate number clearly).',
        sw: 'Tafadhali tuma picha ya pikipiki yako (ikionyesha nambari ya gari wazi).'
    },
    reg_selfie_photo: {
        en: 'Please send a selfie of yourself with your motorcycle.',
        sw: 'Tafadhali tuma picha yako ukiwa na pikipiki yako.'
    },
    reg_thank_you: {
        en: 'Thank you. Your details have been submitted for KYC review. You will get a message once approved.',
        sw: 'Asante. Maelezo yako yametumwa kwa ukaguzi wa KYC. Utapokea ujumbe baada ya kukubaliwa.'
    },

    // KYC Status Messages
    kyc_pending: {
        en: 'Your KYC is under review. Please check again later.',
        sw: 'Maelezo yako ya KYC bado yanakaguliwa. Tafadhali rudi tena baadaye.'
    },
    kyc_rejected: {
        en: 'Your KYC was not approved. Reply HELP for assistance.',
        sw: 'KYC yako haijakubaliwa. Tuma neno HELP upate msaada.'
    },
    kyc_approved_welcome: {
        en: 'Welcome back! Your account is verified. ✅',
        sw: 'Karibu tena! Akaunti yako imethibitishwa. ✅'
    },

    // Main Menu
    main_menu_title: {
        en: 'HIMA 🚀\nWhat would you like to do?',
        sw: 'HIMA 🚀\nUngependa kufanya nini?'
    },
    main_menu_buy: {
        en: 'Buy insurance',
        sw: 'Nunua bima'
    },
    main_menu_profile: {
        en: 'View profile',
        sw: 'Profaili yangu'
    },
    main_menu_claim: {
        en: 'File a claim',
        sw: 'Dai bima'
    },

    // Buy Insurance Flow
    buy_choose_cover: {
        en: 'Choose your HIMA boda boda cover:\n\n1) Third party only\n2) Comprehensive\n3) Personal accident (rider)\n\nTap a button to select.',
        sw: 'Chagua kifurushi cha HIMA boda boda:\n\n1) Third party pekee\n2) Comprehensive\n3) Ajali binafsi (dereva)\n\nBofya kitufe kuchagua.'
    },
    buy_button_tp: {
        en: 'Third party',
        sw: 'Third party'
    },
    buy_button_comp: {
        en: 'Comprehensive',
        sw: 'Comprehensive'
    },
    buy_button_pa: {
        en: 'Personal accident',
        sw: 'Ajali binafsi'
    },
    buy_confirm_details: {
        en: 'Please confirm your selection:\n\n*Product:* {{productName}}\n*Premium:* KES {{premium}}\n*Coverage:* {{coverage}}\n\nDo you want to proceed?',
        sw: 'Tafadhali thibitisha chaguo lako:\n\n*Bidhaa:* {{productName}}\n*Malipo:* KES {{premium}}\n*Bima:* {{coverage}}\n\nUngependa kuendelea?'
    },
    buy_button_confirm: {
        en: 'Yes, proceed',
        sw: 'Ndio, endelea'
    },
    buy_button_cancel: {
        en: 'No, cancel',
        sw: 'Hapana, sitisha'
    },
    buy_payment_prompt: {
        en: 'Please check your phone to complete the M-Pesa payment.',
        sw: 'Tafadhali angalia simu yako kukamilisha malipo ya M-Pesa.'
    },
    buy_cancelled: {
        en: 'Purchase cancelled. Returning to main menu.',
        sw: 'Ununuzi umesitishwa. Kurudi kwenye menyu kuu.'
    },

    // View Profile
    profile_details: {
        en: 'Your HIMA profile:\n\n*Name:* {{name}}\n*ID:* {{idNumber}}\n*Motorcycle:* {{plate}}\n*Policy:* {{policyNumber}}\n\nProfile link: {{profileUrl}}',
        sw: 'Profaili yako ya HIMA:\n\n*Jina:* {{name}}\n*Kitambulisho:* {{idNumber}}\n*Pikipiki:* {{plate}}\n*Polisi:* {{policyNumber}}\n\nKiungo cha profaili: {{profileUrl}}'
    },
    profile_button_open: {
        en: 'Open web profile',
        sw: 'Fungua profaili'
    },
    profile_no_policy: {
        en: 'None',
        sw: 'Hakuna'
    },

    // File Claim Flow
    claim_start_date: {
        en: 'Please send the accident date (format: YYYY-MM-DD, e.g., 2026-01-16).',
        sw: 'Tafadhali tuma tarehe ya ajali (muundo: YYYY-MM-DD, mfano: 2026-01-16).'
    },
    claim_location: {
        en: 'Please send the location where the accident occurred.',
        sw: 'Tafadhali tuma mahali ambapo ajali ilitokea.'
    },
    claim_description: {
        en: 'Please provide a brief description of what happened.',
        sw: 'Tafadhali eleza kwa ufupi kilichotokea.'
    },
    claim_damage_photo: {
        en: 'Please send a photo of the damage to your motorcycle.',
        sw: 'Tafadhali tuma picha ya uharibifu wa pikipiki yako.'
    },
    claim_police_abstract: {
        en: 'Please send a photo of the police abstract (if available). Type SKIP if you don\'t have it.',
        sw: 'Tafadhali tuma picha ya ripoti ya polisi (ikiwa inapatikana). Andika SKIP kama huna.'
    },
    claim_submitted: {
        en: 'Your claim has been submitted successfully. Claim number: {{claimNumber}}\n\nOur team will review it and contact you soon.',
        sw: 'Dai lako limetumwa kikamilifu. Nambari ya dai: {{claimNumber}}\n\nTimu yetu itakagua na kuwasiliana nawe hivi karibuni.'
    },

    // Error Messages
    error_invalid_input: {
        en: 'Invalid input. Please try again.',
        sw: 'Ingizo si sahihi. Tafadhali jaribu tena.'
    },
    error_invalid_date: {
        en: 'Invalid date format. Please use YYYY-MM-DD (e.g., 2026-01-16).',
        sw: 'Muundo wa tarehe si sahihi. Tafadhali tumia YYYY-MM-DD (mfano: 2026-01-16).'
    },
    error_invalid_image: {
        en: 'Please send an image file.',
        sw: 'Tafadhali tuma faili ya picha.'
    },
    error_general: {
        en: 'Something went wrong. Please try again or contact support.',
        sw: 'Kuna tatizo. Tafadhali jaribu tena au wasiliana na msaada.'
    },

    // General
    greeting_registered: {
        en: 'Welcome back, {{name}}! 👋',
        sw: 'Karibu tena, {{name}}! 👋'
    },
    help_message: {
        en: 'HIMA Help:\n\n• Type HI or MENU to see options\n• Contact support: support@hima.com\n• Call: +254 700 000 000',
        sw: 'Msaada wa HIMA:\n\n• Andika HI au MENU kuona chaguzi\n• Wasiliana na msaada: support@hima.com\n• Piga simu: +254 700 000 000'
    },
    button_tap_prompt: {
        en: 'Tap a button',
        sw: 'Bofya kitufe'
    },
    button_continue: {
        en: 'Continue',
        sw: 'Endelea'
    }
};

/**
 * Get translated text for a given key and language
 * @param lang - Language code ('en' or 'sw')
 * @param key - Translation key
 * @param params - Optional parameters for string interpolation
 * @returns Translated string
 */
export function t(lang: Language, key: string, params?: TranslationParams): string {
    const translation = translations[key];

    if (!translation) {
        console.warn(`Translation key not found: ${key}`);
        return key;
    }

    let text = translation[lang] || translation['en'];

    // Replace parameters if provided
    if (params) {
        Object.keys(params).forEach(paramKey => {
            const placeholder = `{{${paramKey}}}`;
            text = text.replace(new RegExp(placeholder, 'g'), String(params[paramKey]));
        });
    }

    return text;
}

/**
 * Get the user's preferred language, defaulting to English
 * @param user - User object with preferredLanguage field
 * @returns Language code
 */
export function getUserLanguage(user: any): Language {
    return user?.preferredLanguage === 'sw' ? 'sw' : 'en';
}
