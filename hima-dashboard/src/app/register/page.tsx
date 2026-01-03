"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, MessageCircle, UserPlus, Info } from "lucide-react";
// @ts-ignore
import styles from "../auth.module.css";
import { Toaster, toast } from 'sonner';

export default function RegisterPage() {
    const router = useRouter();

    return (
        <div className={styles.authContainer}>
            <div className={styles.backgroundGlow} style={{ top: '60%', right: '70%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)' }} />

            <div className={styles.authCard}>
                <div className={styles.logoArea}>
                    <div className={styles.logoIcon}>
                        <UserPlus size={28} color="white" />
                    </div>
                    <h1 className={styles.title}>Join Hima</h1>
                    <p className={styles.subtitle}>Getting started is easy</p>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '1.5rem', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={18} color="#8b5cf6" /> Why WhatsApp?
                    </h3>
                    <p style={{ color: '#9CA3AF', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                        Hima uses WhatsApp for secure identity verification and instant insurance payouts. Your number is your account ID.
                    </p>
                </div>

                <a
                    href="https://wa.me/14155238886?text=join%20hima"
                    target="_blank"
                    className={styles.submitBtn}
                    style={{ textDecoration: 'none', background: '#25D366' }}
                    onClick={() => toast.success("Opening WhatsApp...")}
                >
                    <MessageCircle size={22} fill="white" color="#25D366" />
                    Sign Up on WhatsApp
                </a>

                <div className={styles.divider}>
                    <span>Or if you already have an account</span>
                </div>

                <p className={styles.footerText}>
                    <a href="/" className={styles.footerLink} style={{ margin: 0 }}>Back to Login</a>
                </p>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.7rem', color: '#4B5563' }}>
                        By joining, you agree to our Terms of Service and Privacy Policy.
                        <br />© 2026 Hima Insurance.
                    </p>
                </div>
            </div>
        </div>
    );
}
