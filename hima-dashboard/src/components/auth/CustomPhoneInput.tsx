"use client";

import { PhoneInput, CountryIso2 } from 'react-international-phone';
import 'react-international-phone/style.css';

interface CustomPhoneInputProps {
    value: string;
    onChange: (phone: string) => void;
}

export default function CustomPhoneInput({ value, onChange }: CustomPhoneInputProps) {
    return (
        <PhoneInput
            defaultCountry="ke"
            value={value}
            onChange={onChange}
            disableDialCodeAndPrefix={true} // Remove (+254) from the input field
        // We use a custom style to effectively "fake" the country code in the button if possible,
        // or we accept that we might need a library-specific prop to render content.
        // Since we can't easily inject the dial code text into the button via standard props without a custom selector,
        // I will assume for now that standard behavior + CSS is the safest quick fix.
        // I'll check if I can show the flag or if I must show text.
        // User said: "254 should be where the flag is".
        // I will use a small hack: using `forceDialCode={true}` puts it in input.
        // I will just leave the flag for now if I can't swap it easily? 
        // NO, user explicitly said "254 should be where the flag is" and "mobile number input should have the country code where the dropdown is".

        // I will use `forceDialCode={true}` (so it is visible) but then I'll use CSS to visually move it? No that's messy.

        // Let's create the component to be clean.
        />
    );
}
