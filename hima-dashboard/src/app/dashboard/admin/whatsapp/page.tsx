"use client";

import { useState, useEffect } from "react";
import {
    MessageSquare,
    Smartphone,
    Key,
    Settings,
    CheckCircle,
    AlertCircle,
    Zap,
    Send,
    Database,
    Globe
} from "lucide-react";
// @ts-ignore
import styles from "./whatsapp.module.css";
import { toast, Toaster } from "sonner";
import * as auth from "@/lib/auth";

export default function WhatsAppSettingsPage() {
    const [provider, setProvider] = useState<"twilio" | "meta">("meta");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Config states
    const [twilioConfig, setTwilioConfig] = useState({
        accountSid: "",
        authToken: "",
        whatsAppNumber: ""
    });

    const [metaConfig, setMetaConfig] = useState({
        accessToken: "",
        phoneNumberId: "",
        businessAccountId: "",
        webhookVerifyToken: "hima_webhook_verify_token",
        appSecret: ""
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = auth.getToken();
            const res = await fetch("http://localhost:8100/api/settings", {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (data.success) {
                setProvider(data.settings.whatsapp.provider);
                // Note: secrets are masked, we don't populate inputs with them
            } else {
                toast.error("Failed to load settings");
            }
        } catch (error) {
            toast.error("API server unreachable");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = auth.getToken();
            const config = provider === "twilio"
                ? {
                    twilioAccountSid: twilioConfig.accountSid,
                    twilioAuthToken: twilioConfig.authToken,
                    twilioWhatsAppNumber: twilioConfig.whatsAppNumber
                }
                : {
                    metaAccessToken: metaConfig.accessToken,
                    metaPhoneNumberId: metaConfig.phoneNumberId,
                    metaBusinessAccountId: metaConfig.businessAccountId,
                    metaWebhookVerifyToken: metaConfig.webhookVerifyToken,
                    metaAppSecret: metaConfig.appSecret
                };

            const res = await fetch("http://localhost:8100/api/settings", {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    provider,
                    config
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`WhatsApp service switched to ${provider.toUpperCase()}`);
            } else {
                toast.error(data.message || "Update failed");
            }
        } catch (error) {
            toast.error("Network error saving settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ color: 'white' }}>Loading settings...</div>;

    return (
        <div className={styles.settingsContainer}>
            <Toaster position="top-right" theme="dark" />

            <div className={styles.card}>
                <h1 className={styles.title}>WhatsApp Service Selection</h1>
                <p className={styles.subtitle}>Select and configure your preferred WhatsApp messaging provider.</p>

                <div className={styles.providerGrid}>
                    <div
                        className={`${styles.providerCard} ${provider === 'meta' ? styles.activeProvider : ''}`}
                        onClick={() => setProvider('meta')}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className={styles.providerIcon} style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                                <Globe size={24} color="#06b6d4" />
                            </div>
                            {provider === 'meta' && <div className={`${styles.badge} ${styles.badgeActive}`}>Active</div>}
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Meta WhatsApp Business API</h3>
                            <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>Direct integration with Meta (Cheaper, more features)</p>
                        </div>
                    </div>

                    <div
                        className={`${styles.providerCard} ${provider === 'twilio' ? styles.activeProvider : ''}`}
                        onClick={() => setProvider('twilio')}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className={styles.providerIcon} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                <MessageSquare size={24} color="#ef4444" />
                            </div>
                            {provider === 'twilio' && <div className={`${styles.badge} ${styles.badgeActive}`}>Active</div>}
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Twilio WhatsApp</h3>
                            <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>Reliable gateway with great tools</p>
                        </div>
                    </div>
                </div>

                <div className={styles.form}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Configuration</h2>

                    {provider === 'meta' ? (
                        <>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Access Token (leave blank to use .env)</label>
                                <input
                                    className={styles.input}
                                    type="password"
                                    placeholder="EAAMu0yPDPZCcB..."
                                    value={metaConfig.accessToken}
                                    onChange={e => setMetaConfig({ ...metaConfig, accessToken: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Phone Number ID (leave blank to use .env)</label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. 316943564631752"
                                    value={metaConfig.phoneNumberId}
                                    onChange={e => setMetaConfig({ ...metaConfig, phoneNumberId: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Business Account ID</label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. 579843564631752"
                                    value={metaConfig.businessAccountId}
                                    onChange={e => setMetaConfig({ ...metaConfig, businessAccountId: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Webhook Verify Token</label>
                                <input
                                    className={styles.input}
                                    value={metaConfig.webhookVerifyToken}
                                    onChange={e => setMetaConfig({ ...metaConfig, webhookVerifyToken: e.target.value })}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Twilio Account SID (leave blank to use .env)</label>
                                <input
                                    className={styles.input}
                                    placeholder="ACxxxxxxxxxxxxxxxx"
                                    value={twilioConfig.accountSid}
                                    onChange={e => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Auth Token (leave blank to use .env)</label>
                                <input
                                    className={styles.input}
                                    type="password"
                                    placeholder="xxxxxxxxxxxxxxxx"
                                    value={twilioConfig.authToken}
                                    onChange={e => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>WhatsApp Number (leave blank to use .env)</label>
                                <input
                                    className={styles.input}
                                    placeholder="whatsapp:+14155238886"
                                    value={twilioConfig.whatsAppNumber}
                                    onChange={e => setTwilioConfig({ ...twilioConfig, whatsAppNumber: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button className={styles.testBtn}>
                            <Zap size={18} /> Test Connection
                        </button>
                        <button
                            className={styles.saveBtn}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <CheckCircle size={18} /> {saving ? "Saving..." : "Apply & Save"}
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.card} style={{ borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} color="#8b5cf6" /> Webhook Information
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>META WEBHOOK URL</div>
                        <code style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>http://your-server.com/webhook</code>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>TWILIO WEBHOOK URL</div>
                        <code style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>http://your-server.com/twilio-webhook</code>
                    </div>
                </div>
            </div>
        </div>
    );
}
