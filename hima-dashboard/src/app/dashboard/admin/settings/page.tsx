"use client";

import { useState, useEffect } from "react";
// @ts-ignore
import styles from "@/components/dashboard/tables.module.css"; // Reuse table styles for consistency if needed, or inline
import { Settings, Shield, Globe, MessageCircle, Lock, Server } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

export default function SettingsPage() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/settings`);
                const data = await res.json();
                if (data.success) {
                    setConfig(data.settings);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const SectionCard = ({ title, icon: Icon, children }: any) => (
        <div style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.5rem', color: '#8b5cf6' }}>
                    <Icon size={20} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>{title}</h3>
            </div>
            {children}
        </div>
    );

    const Field = ({ label, value }: any) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>{label}</span>
            <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: '#e4e4e7' }}>
                {value || 'Not Set'}
            </code>
        </div>
    );

    if (loading) {
        return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading configuration...</div>;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', letterSpacing: '-0.025em' }}>System Settings</h1>
                <p style={{ color: '#9CA3AF', marginTop: '0.25rem' }}>Manage integrations and audit system connection status.</p>
            </div>

            <SectionCard title="Blockchain Connection" icon={Server}>
                <Field label="Network" value="Mantle Testnet" />
                <Field label="RPC Status" value={config?.blockchain?.rpcUrl} />
                <Field label="Chain ID" value={config?.blockchain?.chainId} />
            </SectionCard>

            <SectionCard title="Security & Access" icon={Shield}>
                <Field label="Admin Portal Access" value="Restricted" />
                <Field label="Registration" value="Open" />
                <Field label="KYC Requirement" value="Mandatory" />
            </SectionCard>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '0.75rem', color: '#fef08a', fontSize: '0.9rem', display: 'flex', gap: '0.75rem' }}>
                <Lock size={18} />
                <div>
                    <strong>Admin Note:</strong> Some settings are managed via environment variables and require a server restart to change.
                </div>
            </div>
        </div >
    );
}
