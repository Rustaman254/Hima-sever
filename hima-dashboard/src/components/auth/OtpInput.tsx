"use client";

import React, { useRef, useState, useEffect } from 'react';

interface OtpInputProps {
    length?: number;
    onComplete: (otp: string) => void;
    disabled?: boolean;
}

export default function OtpInput({ length = 6, onComplete, disabled = false }: OtpInputProps) {
    const [code, setCode] = useState<string[]>(new Array(length).fill(''));
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    const processInput = (e: React.ChangeEvent<HTMLInputElement>, slot: number) => {
        const value = e.target.value;
        if (/[^0-9]/.test(value)) return;

        const newCode = [...code];
        newCode[slot] = value.substring(value.length - 1); // Only take the last char if multiple
        setCode(newCode);

        if (value && slot < length - 1) {
            inputsRef.current[slot + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, slot: number) => {
        if (e.key === 'Backspace' && !code[slot] && slot > 0) {
            inputsRef.current[slot - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length);
        if (!/^[0-9]+$/.test(pastedData)) return;

        const newCode = [...code];
        pastedData.split('').forEach((char, index) => {
            newCode[index] = char;
        });
        setCode(newCode);

        // Focus last filled or next empty
        const nextEmpty = newCode.findIndex(c => !c);
        const focusIndex = nextEmpty === -1 ? length - 1 : nextEmpty;
        inputsRef.current[focusIndex]?.focus();
    };

    useEffect(() => {
        if (code.every(digit => digit !== '')) {
            onComplete(code.join(''));
        }
    }, [code, onComplete]);

    return (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {code.map((digit, idx) => (
                <input
                    key={idx}
                    ref={(ref) => { inputsRef.current[idx] = ref }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={disabled}
                    onChange={(e) => processInput(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={handlePaste}
                    style={{
                        width: '40px',
                        height: '50px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '1.25rem',
                        color: 'white',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
            ))}
        </div>
    );
}
