"use client";

import { Wallet, PieChart, TrendingUp, Download } from "lucide-react";
// @ts-ignore
import tableStyles from "@/components/dashboard/tables.module.css";

const ASSETS = [
    { id: 1, name: "USXC Stablecoin", amount: "12,050", value: "$12,050", allocation: "60%", change: "+0.5%" },
    { id: 2, name: "HIMA Goverance", amount: "4,200", value: "$8,400", allocation: "30%", change: "+4.2%" },
    { id: 3, name: "ETH (Staked)", amount: "2.5", value: "$6,250", allocation: "10%", change: "-1.1%" },
];

export default function LPAssets() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                {/* Balance Overview */}
                <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '2rem', padding: '2.5rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px', background: 'rgba(139, 92, 246, 0.2)', filter: 'blur(50px)', borderRadius: '50%' }}></div>
                    <p style={{ fontSize: '0.875rem', color: '#c7d2fe', marginBottom: '0.5rem' }}>Total Asset Value</p>
                    <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'white', marginBottom: '2rem' }}>$26,700.00</h1>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>24h Profit</p>
                            <p style={{ color: '#4ade80', fontWeight: 700 }}>+$240.50 (0.9%)</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Yield</p>
                            <p style={{ color: 'white', fontWeight: 700 }}>$1,248.00</p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <div style={{ background: 'hsl(var(--card))', borderRadius: '1.25rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: '#3b82f622', padding: '0.75rem', borderRadius: '1rem', color: '#3b82f6' }}><Wallet size={20} /></div>
                        <div><p style={{ fontSize: '0.75rem', color: '#64748b' }}>Connected Wallet</p><p style={{ fontSize: '0.875rem', color: 'white', fontWeight: 600 }}>0x4f...e3a2</p></div>
                    </div>
                    <div style={{ background: 'hsl(var(--card))', borderRadius: '1.25rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: '#8b5cf622', padding: '0.75rem', borderRadius: '1rem', color: '#8b5cf6' }}><PieChart size={20} /></div>
                        <div><p style={{ fontSize: '0.75rem', color: '#64748b' }}>Pools Joined</p><p style={{ fontSize: '0.875rem', color: 'white', fontWeight: 600 }}>4 Active</p></div>
                    </div>
                    <div style={{ background: 'hsl(var(--card))', borderRadius: '1.25rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: '#4ade8022', padding: '0.75rem', borderRadius: '1rem', color: '#4ade80' }}><TrendingUp size={20} /></div>
                        <div><p style={{ fontSize: '0.75rem', color: '#64748b' }}>Current APY</p><p style={{ fontSize: '0.875rem', color: 'white', fontWeight: 600 }}>12.4% Avg</p></div>
                    </div>
                </div>
            </div>

            <div className={tableStyles.tableContainer}>
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontWeight: 700, color: 'white' }}>Asset Breakdown</h3>
                    <button className="btn btn-glass" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}><Download size={14} /> Report</button>
                </div>
                <table className={tableStyles.table}>
                    <thead>
                        <tr>
                            <th className={tableStyles.th}>Asset</th>
                            <th className={tableStyles.th}>Amount</th>
                            <th className={tableStyles.th}>Market Value</th>
                            <th className={tableStyles.th}>Allocation</th>
                            <th className={tableStyles.th}>24H Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ASSETS.map(asset => (
                            <tr key={asset.id} className={tableStyles.tr}>
                                <td className={tableStyles.td} style={{ fontWeight: 600 }}>{asset.name}</td>
                                <td className={tableStyles.td}>{asset.amount}</td>
                                <td className={tableStyles.td}>{asset.value}</td>
                                <td className={tableStyles.td}>
                                    <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative', marginTop: '4px' }}>
                                        <div style={{ width: asset.allocation, height: '100%', background: '#8b5cf6', borderRadius: '3px' }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{asset.allocation}</span>
                                </td>
                                <td className={tableStyles.td} style={{ color: asset.change.startsWith('+') ? '#4ade80' : '#f87171' }}>{asset.change}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
