"use client";

import { useState } from "react";
import { Shield, Key, Eye, EyeOff, Copy, AlertTriangle } from "lucide-react";
// @ts-ignore
import styles from "../../admin/admin.module.css";
import { toast, Toaster } from "sonner";
import * as auth from "@/lib/auth";

export default function SettingsPage() {
    const [showKey, setShowKey] = useState(false);
    const [privateKey, setPrivateKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);

    const handleRevealKey = async () => {
        setIsLoading(true);
        try {
            const token = auth.getToken();
            const res = await fetch("http://localhost:8100/api/insurance/wallet/private-key", {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (data.success) {
                setPrivateKey(data.privateKey);
                setIsRevealed(true);
                setShowKey(true);
            } else {
                toast.error(data.error || "Failed to reveal key");
            }
        } catch (err) {
            toast.error("Auth server offline");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <Toaster position="top-right" theme="dark" />

            <div style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', padding: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Account Settings</h1>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '2rem' }}>Manage your Hima profile and secure wallet.</p>

                <div style={{ display: 'grid', gap: '2.5rem' }}>
                    {/* Wallet Section */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.75rem' }}>
                                <Key size={20} color="#8b5cf6" />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Secure Wallet Export</h2>
                        </div>

                        <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '1rem' }}>
                                    <AlertTriangle size={24} color="#ef4444" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ef4444' }}>Security Warning</h3>
                                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                                        Your private key grants absolute control over your Hima wallet. Never share it with anyone.
                                        Hima staff will never ask for your private key. Storing it in plaintext on your computer is risky.
                                    </p>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem' }}>
                                {!isRevealed ? (
                                    <button
                                        onClick={handleRevealKey}
                                        disabled={isLoading}
                                        className={styles.actionBtn}
                                        style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', color: 'white', fontWeight: 700 }}
                                    >
                                        {isLoading ? "Authenticating..." : "Reveal Private Key"}
                                    </button>
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <div style={{
                                            background: 'rgba(0,0,0,0.3)',
                                            padding: '1.25rem',
                                            borderRadius: '1rem',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem',
                                            color: showKey ? 'white' : 'transparent',
                                            filter: showKey ? 'none' : 'blur(8px)',
                                            userSelect: showKey ? 'all' : 'none',
                                            wordBreak: 'break-all',
                                            minHeight: '60px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>
                                            {privateKey}
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                            <button
                                                onClick={() => setShowKey(!showKey)}
                                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                            >
                                                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                                {showKey ? "Hide" : "Show"} Key
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(privateKey);
                                                    toast.success("Private key copied to clipboard!");
                                                }}
                                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                            >
                                                <Copy size={16} />
                                                Copy Key
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
