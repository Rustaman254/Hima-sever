"use client";

import { useState } from "react";
import { Shield, CloudRain, Wind, Thermometer, ChevronRight, Check } from "lucide-react";
// @ts-ignore
import styles from "./user.module.css";
import { Modal } from "@/components/ui/SharedUI";
import { toast } from "sonner";

const COVERAGES = [
    { id: 1, name: "Flood Protection", desc: "Covers crop loss due to excess rainfall and flooding.", premium: "3.5%", icon: <CloudRain size={24} />, color: "#3b82f6" },
    { id: 2, name: "Drought Guard", desc: "Instant payout if soil moisture drops below threshold.", premium: "5.0%", icon: <Thermometer size={24} />, color: "#f59e0b" },
    { id: 3, name: "Windstorm Coverage", desc: "Protection against severe storms and structural damage.", premium: "2.8%", icon: <Wind size={24} />, color: "#8b5cf6" },
    { id: 4, name: "General Crop Health", desc: "Comprehensive coverage for pests and disease outbreaks.", premium: "4.2%", icon: <Shield size={24} />, color: "#10b981" },
];

export default function UserPurchase() {
    const [selected, setSelected] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handlePurchase = () => {
        toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
            loading: 'Signing insurance policy on-chain...',
            success: 'Coverage active! You are now protected.',
            error: 'Transaction failed',
        });
        setIsModalOpen(false);
    };

    return (
        <div>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Protect Your Harvest</h1>
                <p style={{ color: '#94a3b8' }}>Select a coverage plan tailored to your region's risks.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                {COVERAGES.map(plan => (
                    <div
                        key={plan.id}
                        onClick={() => { setSelected(plan.id); setIsModalOpen(true); }}
                        style={{
                            background: 'hsl(var(--card))',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '2rem',
                            padding: '2rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative',
                            display: 'flex',
                            gap: '1.5rem'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                    >
                        <div style={{ width: '4rem', height: '4rem', background: `${plan.color}15`, color: plan.color, borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {plan.icon}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>{plan.name}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem' }}>{plan.desc}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: 700 }}>
                                {plan.premium} <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.75rem' }}>Premium Rate</span>
                            </div>
                        </div>
                        <div style={{ position: 'absolute', right: '2rem', alignSelf: 'center', color: '#64748b' }}>
                            <ChevronRight size={20} />
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Coverage Plan">
                {selected && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#64748b' }}>Selected Plan</span>
                                <span style={{ color: 'white', fontWeight: 600 }}>{COVERAGES.find(c => c.id === selected)?.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Rate / Year</span>
                                <span style={{ color: '#4ade80', fontWeight: 600 }}>{COVERAGES.find(c => c.id === selected)?.premium}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>
                                <Check size={16} color="#4ade80" /> Instant verification using satellite data
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>
                                <Check size={16} color="#4ade80" /> Payouts triggered automatically
                            </div>
                        </div>

                        <button className="btn btn-primary" onClick={handlePurchase} style={{ height: '3.5rem' }}>
                            Confirm & Pay Premium
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
