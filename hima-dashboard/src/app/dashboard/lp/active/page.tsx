"use client";

import { Zap, TrendingUp, Info } from "lucide-react";

export default function LPLiquidStaking() {
    return (
        <div style={{ maxWidth: '800px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '2rem', padding: '3rem', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <Zap size={32} fill="#fbbf24" color="#fbbf24" />
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>Liquid Staking</h1>
                </div>

                <p style={{ color: '#c7d2fe', fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                    Hima Liquid Staking allows you to earn yields on your insurance liquidity while remaining liquid. Receive **hETH** tokens in exchange for your ETH deposits.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '1.5rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Net APY</p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 700, color: '#4ade80' }}>18.42%</h3>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '1.5rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Redemption Time</p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>Instant</h3>
                    </div>
                </div>
            </div>

            <div style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Stake Assets</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>Amount to Stake (ETH)</label>
                        <input className="input" placeholder="0.00" type="number" />
                    </div>
                    <button className="btn btn-primary" style={{ height: '3.5rem' }}>Mint hETH</button>
                </div>
            </div>
        </div>
    );
}
