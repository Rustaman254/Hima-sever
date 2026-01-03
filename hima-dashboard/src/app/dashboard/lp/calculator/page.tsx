"use client";

import { useState } from "react";
import { Calculator, Info, RefreshCw, Zap } from "lucide-react";

export default function LPCalculator() {
    const [investment, setInvestment] = useState(5000);
    const [days, setDays] = useState(30);
    const [apy, setApy] = useState(12.5);

    const earnings = (investment * (apy / 100) * (days / 365)).toFixed(2);
    const total = (Number(investment) + Number(earnings)).toFixed(2);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                {/* Input Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: '#8b5cf622', color: '#8b5cf6', borderRadius: '1rem' }}><Calculator size={24} /></div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>Yield Calculator</h2>
                    </div>

                    <div className="input-field">
                        <label style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem', display: 'block' }}>Initial Investment (USD)</label>
                        <input
                            type="range" min="100" max="100000" step="100"
                            value={investment} onChange={e => setInvestment(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#8b5cf6', marginBottom: '1rem' }}
                        />
                        <input
                            type="number" className="input"
                            value={investment} onChange={e => setInvestment(Number(e.target.value))}
                            style={{ fontSize: '1.25rem', fontWeight: 700 }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem', display: 'block' }}>Duration (Days)</label>
                            <input className="input" type="number" value={days} onChange={e => setDays(Number(e.target.value))} />
                        </div>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem', display: 'block' }}>Expected APY (%)</label>
                            <input className="input" type="number" step="0.1" value={apy} onChange={e => setApy(Number(e.target.value))} />
                        </div>
                    </div>

                    <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1.25rem', borderRadius: '1rem', display: 'flex', gap: '1rem' }}>
                        <Info size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
                            Calculations are based on current pool performance. Actual yields may fluctuate based on insurance claim volumes.
                        </p>
                    </div>
                </div>

                {/* Result Section */}
                <div style={{ background: 'rgba(21, 26, 35, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '2rem', padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center', marginBottom: '0.5rem' }}>Estimated Earnings</p>
                    <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#4ade80', textAlign: 'center', marginBottom: '2rem', letterSpacing: '-0.02em' }}>
                        ${earnings}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Total Value</span>
                            <span style={{ color: 'white', fontWeight: 600 }}>${total}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Daily Avg</span>
                            <span style={{ color: 'white', fontWeight: 600 }}>${(Number(earnings) / days).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Fee Burn</span>
                            <span style={{ color: '#f87171' }}>-0.02%</span>
                        </div>
                    </div>

                    <button className="btn btn-primary" style={{ marginTop: '2.5rem', width: '100%', height: '3.5rem' }}>
                        <Zap size={18} fill="white" /> Stake & Earn Now
                    </button>
                </div>
            </div>
        </div>
    );
}
