"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// @ts-ignore
import styles from "../auth.module.css";
import { toast } from 'sonner';
import CustomPhoneInput from "@/components/auth/CustomPhoneInput";
import AuthLayout from "@/components/auth/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";
import * as auth from "@/lib/auth";

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);

    // --- WhatsApp Code Request ---
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber) return toast.error("Enter your phone number");

        setIsLoading(true);
        toast.loading("Sending secure code via WhatsApp...");

        try {
            const res = await fetch("http://localhost:8100/api/auth/whatsapp/login", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber })
            });
            const data = await res.json();

            if (data.success) {
                toast.dismiss();
                toast.success("Code sent! Check your WhatsApp");
                setIsOtpSent(true);
            } else {
                toast.dismiss();
                toast.error(data.error || "Failed to send code");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Auth server offline");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Verify Code ---
    const handleVerifyCode = async (otp: string) => {
        setIsLoading(true);
        toast.loading("Verifying code...");

        try {
            const res = await fetch("http://localhost:8100/api/auth/whatsapp/verify", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, code: otp })
            });
            const data = await res.json();

            if (data.success) {
                auth.setToken(data.token);
                auth.setUser(data.user);

                toast.dismiss();
                toast.success("Registration successful!");
                const userRole = data.user?.role || 'user';
                router.push(`/dashboard/${userRole}`);
            } else {
                toast.dismiss();
                toast.error(data.error || "Invalid code");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Auth server offline");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout isAdminMode={false} onAdminToggle={() => router.push('/')}>
            <h2 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {isOtpSent ? "Verify Code" : "Sign Up"}
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
                {isOtpSent
                    ? `Enter the 6-digit code sent to ${phoneNumber}`
                    : "Create an account to get started."}
            </p>

            {!isOtpSent ? (
                <form onSubmit={handleRequestCode}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Phone Number</label>
                        <CustomPhoneInput
                            value={phoneNumber}
                            onChange={(phone) => setPhoneNumber(phone)}
                        />
                    </div>

                    <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '1rem', background: 'white', color: 'black', borderRadius: '9999px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                        {isLoading ? "Sending..." : "Sign Up"}
                    </button>

                    <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Or</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    </div>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <a href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>
                            Already have an account? <span style={{ marginLeft: '4px', textDecoration: 'underline' }}>Log In</span>
                        </a>
                    </div>
                </form>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <OtpInput length={6} onComplete={handleVerifyCode} disabled={isLoading} />

                    <button
                        onClick={() => setIsOtpSent(false)}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                        Change Phone Number
                    </button>
                </div>
            )}
        </AuthLayout>
    );
}
