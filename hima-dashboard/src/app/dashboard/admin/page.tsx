"use client";

import { useState, useEffect } from "react";
import { Shield, Sprout, Wheat, Users, FileCheck, Landmark, Activity } from "lucide-react";
import { PoolCard } from "@/components/dashboard/HighFiCards";
import { ActivePositionCard } from "@/components/dashboard/ActivePositionCard";
// @ts-ignore
import styles from "./admin.module.css";
import { toast } from "sonner";

export default function AdminOverview() {
    const [stats, setStats] = useState<any>({
        totalUsers: 0,
        pendingKyc: 0,
        totalPolicies: 0,
        activePolicies: 0,
        pendingPolicies: 0,
        pendingClaims: 0,
        totalTvl: 0,
        revenue: 0
    });
    const [reviews, setReviews] = useState<any>({
        kyc: [],
        policies: [],
        claims: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, reviewsRes] = await Promise.all([
                    fetch("http://localhost:8100/api/insurance/admin/stats"),
                    fetch("http://localhost:8100/api/insurance/admin/reviews")
                ]);

                const statsData = await statsRes.json();
                const reviewsData = await reviewsRes.json();

                if (statsData.success) {
                    setStats(statsData.stats);
                }
                if (reviewsData.success) {
                    setReviews(reviewsData.reviews);
                }
            } catch (error) {
                console.error("Data fetch failed:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className={styles.layoutGrid}>

            {/* Left Main Column */}
            <div className={styles.mainColumn}>

                {/* Stats Summary Grid */}
                <div className={styles.statsGrid}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Total Users</span>
                            <Users size={16} color="#8b5cf6" />
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{stats.totalUsers}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Pending KYC</span>
                            <FileCheck size={16} color="#f59e0b" />
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stats.pendingKyc > 0 ? '#f59e0b' : 'white' }}>
                            {stats.pendingKyc}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Pending Actions</span>
                            <Shield size={16} color="#10b981" />
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: (stats.pendingPolicies + stats.pendingClaims) > 0 ? '#10b981' : 'white' }}>
                            {stats.pendingPolicies + stats.pendingClaims}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>System Health</span>
                            <Activity size={16} color="#ec4899" />
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>100%</div>
                    </div>
                </div>

                {/* Top Pools Section */}
                <section>
                    <div className={styles.sectionHeader}>
                        <div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <p className="text-gray-400 text-sm">Recommended pools for 24 hours</p>
                                <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full">3 Pools</span>
                            </div>
                            <h2 className={styles.sectionTitle}>Insurance Performance</h2>
                        </div>
                    </div>

                    <div className={styles.poolsGrid}>
                        <PoolCard
                            icon={<Shield size={24} color="#8b5cf6" />}
                            name="Global TVL"
                            type="Total Value Locked"
                            apy="8.5"
                            trend="Stable"
                            isPositive={true}
                            tvl={`$${stats.totalTvl.toLocaleString()}`}
                        />
                        <PoolCard
                            icon={<Wheat size={24} color="#f59e0b" />}
                            name="Total Policies"
                            type="Historical Count"
                            apy="100"
                            trend="Growth"
                            isPositive={true}
                            tvl={stats.totalPolicies.toString()}
                        />
                        <PoolCard
                            icon={<Sprout size={24} color="#ec4899" />}
                            name="System Revenue"
                            type="Total Earned"
                            apy="15.2"
                            trend="↑ 4.2%"
                            isPositive={true}
                            tvl={`$${stats.revenue.toLocaleString()}`}
                        />
                    </div>
                </section>

                {/* Review Items Section */}
                <section>
                    <h2 className={styles.sectionTitle}>Items Requiring Attention</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Pending KYC Users */}
                        {reviews.kyc?.length > 0 && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Users size={18} color="#f59e0b" /> Pending KYC ({reviews.kyc.length})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {reviews.kyc.map((user: any) => (
                                        <div key={user._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>+{user.phoneNumber}</div>
                                            </div>
                                            <a href="/dashboard/admin/registrations" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Review</a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pending Policies (Premium/Issue Review) */}
                        {reviews.policies?.length > 0 && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Shield size={18} color="#8b5cf6" /> Policy Issuance ({reviews.policies.length})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {reviews.policies.map((policy: any) => (
                                        <div key={policy._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{policy.coverageType?.toUpperCase()} - {policy.policyNumber}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>User: {policy.user?.firstName} ({policy.user?.phoneNumber})</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10b981' }}>${policy.premiumAmountKES}</span>
                                                <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Approve</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pending Claims */}
                        {reviews.claims?.length > 0 && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Activity size={18} color="#ec4899" /> Claim Requests ({reviews.claims.length})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {reviews.claims.map((claim: any) => (
                                        <div key={claim._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>Claim #{claim._id.slice(-6)}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{claim.incidentDescription?.substring(0, 40)}...</div>
                                            </div>
                                            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: '#ec4899', color: '#ec4899' }}>Assess</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(!reviews.kyc?.length && !reviews.policies?.length && !reviews.claims?.length) && (
                            <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '2rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <p style={{ color: '#64748b' }}>No pending items. All systems are up to date! ✅</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Right Column - Status Card */}
            <div className={styles.rightColumn}>
                <div style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', padding: '1.5rem', minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: '#3b82f622', color: '#3b82f6', borderRadius: '0.75rem' }}><FileCheck size={20} /></div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>KYC Quick Link</h3>
                    </div>

                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                        You have {stats.pendingKyc} pending identity verifications from the WhatsApp onboarding flow.
                    </p>

                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <a href="/dashboard/admin/registrations" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                            Review KYC Requests
                        </a>
                        <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            Download All Reports
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper for fix Landmark typo
function लैंडमार्क(props: any) { return <Landmark {...props} /> }
