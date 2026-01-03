"use client";

import { Layers, Droplets, TrendingUp, Wallet, ArrowUpRight, Plus, PieChart, Landmark } from "lucide-react";
import { PoolCard } from "@/components/dashboard/HighFiCards";
import { ActivePositionCard } from "@/components/dashboard/ActivePositionCard";
// @ts-ignore
import styles from "../admin/admin.module.css";
import { toast } from "sonner";

export default function LPOverview() {

    const handleAction = (action: string) => {
        toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
            loading: `Initializing ${action} transaction...`,
            success: `${action} successful! Transaction confirmed on Mantle Testnet.`,
            error: `Error during ${action}`,
        });
    };

    return (
        <div className={styles.layoutGrid}>

            {/* Left Main Column */}
            <div className={styles.mainColumn}>

                {/* LP Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '1.5rem', padding: '1.5rem' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Total Staked</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>$20,650.00</h3>
                        <p style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '0.5rem' }}>↑ 12% from last week</p>
                    </div>
                    <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)', borderRadius: '1.5rem', padding: '1.5rem' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Accrued Yield</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>$482.15</h3>
                        <p style={{ color: '#8b5cf6', fontSize: '0.75rem', marginTop: '0.5rem' }}>Claimable: $120.40</p>
                    </div>
                    <div style={{ background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.1)', borderRadius: '1.5rem', padding: '1.5rem' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Portfolio Health</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>98.5%</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.5rem' }}>Low Risk Profile</p>
                    </div>
                </div>

                {/* Staked Pools Section */}
                <section>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2 className={styles.sectionTitle}>My Active Staking Positions</h2>
                            <p className="text-gray-400 text-sm">Managing liquidity across 3 high-yield insurance pools.</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => handleAction("Add Liquidity")} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <Plus size={18} /> New Deposit
                        </button>
                    </div>

                    <div className={styles.poolsGrid}>
                        <PoolCard
                            icon={<TrendingUp size={24} color="#8b5cf6" />}
                            name="Stable Yield (USDC)"
                            type="Mainstream"
                            apy="8.52%"
                            trend="+0.5%"
                            isPositive={true}
                            tvl="Staked: $12k"
                        />
                        <PoolCard
                            icon={<Droplets size={24} color="#3b82f6" />}
                            name="Liquidity Alpha"
                            type="Active"
                            apy="18.2%"
                            trend="+2.1%"
                            isPositive={true}
                            tvl="Staked: $5.4k"
                        />
                        <PoolCard
                            icon={<Layers size={24} color="#22c55e" />}
                            name="Re-Insure Vault"
                            type="Defensive"
                            apy="6.4%"
                            trend="-0.2%"
                            isPositive={false}
                            tvl="Staked: $3.2k"
                        />
                    </div>
                </section>

                {/* Active Position Section */}
                <section>
                    <h2 className={styles.sectionTitle}>Yield Projection & Breakdown</h2>
                    <ActivePositionCard />
                </section>
            </div>

            {/* Right Column */}
            <div className={styles.rightColumn}>
                {/* Wallet Info */}
                <div style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: '#3b82f622', color: '#3b82f6', borderRadius: '0.75rem' }}><Wallet size={20} /></div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>LP Wallet</h3>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>CONNECTED ADDRESS</p>
                        <p style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>0x71C...492b</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button onClick={() => handleAction("Claim Rewards")} className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            Claim $482.15 <ArrowUpRight size={16} />
                        </button>
                        <button onClick={() => handleAction("Re-invest")} className="btn btn-outline" style={{ width: '100%' }}>
                            Enable Auto-Compound
                        </button>
                    </div>
                </div>

                {/* Allocation Chart Mock */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PieChart size={18} color="#8b5cf6" /> Allocation
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                <span>Low Risk (USDC)</span>
                                <span>58%</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                <div style={{ width: '58%', height: '100%', background: '#8b5cf6', borderRadius: '3px' }}></div>
                            </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                <span>Stable Yield</span>
                                <span>26%</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                <div style={{ width: '26%', height: '100%', background: '#3b82f6', borderRadius: '3px' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                <span>Crypto Alpha</span>
                                <span>16%</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                <div style={{ width: '16%', height: '100%', background: '#ec4899', borderRadius: '3px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
