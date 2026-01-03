"use client";

import { Umbrella, FileCheck, AlertTriangle, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { PoolCard } from "@/components/dashboard/HighFiCards";
import { ActivePositionCard } from "@/components/dashboard/ActivePositionCard";
// @ts-ignore
import styles from "../admin/admin.module.css";
import { toast } from 'sonner';
import * as auth from "@/lib/auth";
import { useEffect, useState } from "react";

export default function UserOverview() {
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [userName, setUserName] = useState("Rider");

    useEffect(() => {
        const user = auth.getUser();
        if (user) {
            // Fetch products
            fetch("http://localhost:8100/api/insurance/products")
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setProducts(data.products);
                    }
                })
                .catch(() => { });

            // Try to fetch full profile for name and policies
            fetch(`http://localhost:8100/api/insurance/users/${user.phoneNumber}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setUserData(data.user);
                        if (data.user.firstName) {
                            setUserName(data.user.firstName);
                        }
                    }
                })
                .catch(() => { });
        }
    }, []);

    const handlePurchase = (product: any) => {
        setSelectedProduct(product);
        setShowPurchaseModal(true);
    };

    const confirmPurchase = () => {
        toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
            loading: 'Confirming coverage with smart contract...',
            success: 'Insurance issued! Your protection is now active.',
            error: 'Error processing purchase',
        });
        setShowPurchaseModal(false);
    };

    const handleClaim = () => {
        if (!userData?.policies?.length) {
            toast.error("You don't have any active policies to claim against.");
            return;
        }

        const claimablePolicy = userData.policies.find((p: any) => p.isClaimable);
        if (!claimablePolicy) {
            toast.error("Your policy has not matured yet. Maturity takes 6 months.");
            return;
        }

        toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
            loading: 'Analyzing claim evidence via AI...',
            success: 'Claim preliminary report generated! Admin review pending.',
            error: 'Error submitting claim',
        });
    };

    return (
        <div className={styles.layoutGrid}>

            {/* Purchase Modal */}
            {showPurchaseModal && selectedProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '2.5rem', maxWidth: '500px', width: '100%', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <button onClick={() => setShowPurchaseModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '1rem' }}><Umbrella size={24} /></div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{selectedProduct.name}</h2>
                        </div>

                        <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                            {selectedProduct.description}
                        </p>

                        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Premium Amount</span>
                                <span style={{ color: 'white', fontWeight: 700 }}>KES {selectedProduct.premiumAmountKES.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Sum Assured</span>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>KES {selectedProduct.sumAssuredKES.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Maturity Period</span>
                                <span style={{ color: '#f59e0b', fontWeight: 700 }}>6 Months</span>
                            </div>
                        </div>

                        <button onClick={confirmPurchase} className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontWeight: 700 }}>
                            Confirm & Purchase
                        </button>
                    </div>
                </div>
            )}

            {/* Left Main Column */}
            <div className={styles.mainColumn}>

                {/* Welcome Banner */}
                <div style={{ background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '1.5rem', padding: '1.5rem 2rem', marginBottom: '2.5rem', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>Welcome back, {userName}! 👋</h1>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Your motorcycle is protected by Hima Smart Contracts.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{
                            background: userData?.policies?.length > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: userData?.policies?.length > 0 ? '#10b981' : '#f59e0b',
                            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem'
                        }}>
                            <ShieldCheck size={14} /> {userData?.policies?.length > 0 ? "Active Protection" : "No Active Policy"}
                        </span>
                    </div>
                </div>

                {/* Available Coverages */}
                <section>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2 className={styles.sectionTitle}>Quick Policy Purchase</h2>
                            <p className="text-gray-400 text-sm">Select a plan to instantly protect your motorcycle via smart contracts.</p>
                        </div>
                    </div>

                    <div className={styles.poolsGrid}>
                        {products.length > 0 ? (
                            products.map((product) => (
                                <div key={product._id} onClick={() => handlePurchase(product)}>
                                    <PoolCard
                                        icon={<Umbrella size={24} color={product.tier === "plus" ? "#ec4899" : product.tier === "standard" ? "#f59e0b" : "#8b5cf6"} />}
                                        name={product.name}
                                        type={product.coverageType.toUpperCase()}
                                        apy={`Premium: KES ${product.premiumAmountKES}`}
                                        trend={product.tier.toUpperCase()}
                                        isPositive={true}
                                        tvl={`Claim: KES ${product.sumAssuredKES.toLocaleString()}`}
                                    />
                                </div>
                            ))
                        ) : (
                            [1, 2, 3].map((i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', height: '180px', border: '1px dashed rgba(255,255,255,0.1)' }}></div>
                            ))
                        )}
                    </div>
                </section>

                {/* Active Position Section */}
                <section>
                    <h2 className={styles.sectionTitle}>
                        {userData?.policies?.length > 0 ? "My Active Policy" : "Recommended Protection"}
                    </h2>
                    <ActivePositionCard policy={userData?.policies?.[0]} />
                </section>
            </div>

            {/* Right Column */}
            <div className={styles.rightColumn}>
                {/* File Claim Quick Action */}
                <div style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: '#fbbf2422', color: '#fbbf24', borderRadius: '0.75rem' }}><AlertTriangle size={20} /></div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>Quick Claim</h3>
                    </div>

                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                        Experienced an accident or theft? Submit your claim now for rapid blockchain settlement.
                    </p>

                    <button
                        onClick={handleClaim}
                        className={`btn ${!userData?.policies?.length ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ width: '100%', opacity: !userData?.policies?.length ? 0.5 : 1, cursor: !userData?.policies?.length ? 'not-allowed' : 'pointer' }}
                        disabled={!userData?.policies?.length}
                    >
                        {!userData?.policies?.length ? "No Active Policy" : "Start Claim Process"}
                    </button>
                    {!userData?.policies?.length && (
                        <p style={{ fontSize: '0.7rem', color: '#ef4444', textAlign: 'center', marginTop: '-0.5rem' }}>
                            You must have an active policy to file a claim.
                        </p>
                    )}
                </div>

                {/* Recent Activities */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Activity History</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {userData?.policies?.map((p: any, i: number) => (
                            <div key={`p-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div>
                                    <p style={{ color: 'white', fontSize: '0.875rem', margin: 0 }}>Policy Issued</p>
                                    <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>{new Date(p.startDate).toLocaleDateString()}</p>
                                </div>
                                <div style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: 600 }}>{p.policyNumber}</div>
                            </div>
                        ))}
                        {userData?.claims?.map((c: any, i: number) => (
                            <div key={`c-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div>
                                    <p style={{ color: 'white', fontSize: '0.875rem', margin: 0 }}>Claim #{c.id.slice(-6)}</p>
                                    <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>{new Date(c.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div style={{ color: c.status === 'approved' ? '#10b981' : '#f59e0b', fontSize: '0.875rem', fontWeight: 600 }}>{c.status.toUpperCase()}</div>
                            </div>
                        ))}
                        {(!userData?.policies?.length && !userData?.claims?.length) && (
                            <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center' }}>No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
