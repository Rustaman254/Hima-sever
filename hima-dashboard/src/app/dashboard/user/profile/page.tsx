"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, MapPin, Phone, Mail, Calendar, CheckCircle, Clock, Plus } from "lucide-react";
// @ts-ignore
import styles from "../../admin/admin.module.css";
import { toast } from "sonner";
import * as auth from "@/lib/auth";

export default function UserProfile() {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [walletAddress, setWalletAddress] = useState<string>("");

    useEffect(() => {
        const fetchProfile = async () => {
            // Strictly use the authenticated session user
            const sessionUser = auth.getUser();
            const phone = sessionUser ? sessionUser.phoneNumber : null;

            if (!phone) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`http://localhost:8100/api/insurance/users/${phone}`);
                const data = await res.json();

                if (data.success) {
                    setUserData(data.user);
                    setWalletAddress(data.user.walletAddress || "");
                } else {
                    toast.error(data.error || "Profile not found");
                }
            } catch (err) {
                toast.error("Auth server offline");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                <Clock className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                Loading rider profile...
            </div>
        );
    }

    if (!userData) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                No rider profile found for this number.
            </div>
        );
    }

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', overflow: 'hidden' }}>
                <div style={{ height: '160px', background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: '-50px', left: '40px', width: '120px', height: '120px', borderRadius: '2.5rem', border: '6px solid hsl(var(--background))', background: 'hsl(var(--card))', overflow: 'hidden' }}>
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.phoneNumber}`} alt="avatar" style={{ width: '100%', height: '100%' }} />
                    </div>
                </div>

                <div style={{ padding: '70px 40px 40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{userData.name}</h1>
                                {userData.kycStatus === 'verified' && <CheckCircle size={24} color="#10b981" fill="#10b98122" />}
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>Active Hima Rider</p>

                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> {userData.phoneNumber}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> {userData.email || "No Email"}</span>
                                {userData.kycStatus === 'verified' && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={14} color="#10b981" /> Verified
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ textAlign: 'center', padding: '1rem 1.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#a78bfa', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>KYC Status</span>
                                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: userData.kycStatus === 'verified' ? '#10b981' : '#f59e0b' }}>
                                    {userData.kycStatus?.toUpperCase() || "PENDING"}
                                </span>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem 1.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#a78bfa', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>Policies</span>
                                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white' }}>{userData.policies?.length || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* EVM Wallet Info */}
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <Shield size={20} color="#8b5cf6" />
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Connected EVM Wallet</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <code style={{ fontSize: '0.875rem', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', flex: 1, marginRight: '1rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {walletAddress || "Generating secure wallet..."}
                            </code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(walletAddress);
                                    toast.success("Wallet address copied!");
                                }}
                                className={styles.actionBtn}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                            >
                                Copy Address
                            </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1rem' }}>
                            This is your custodial wallet on the Mantle network. You can reveal your private key in the <strong>Settings</strong> page.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield size={20} color="#8b5cf6" /> Active Policies
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {userData.policies && userData.policies.length > 0 ? (
                            userData.policies.map((policy: any, idx: number) => (
                                <div key={idx} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 700 }}>{policy.coverage}</span>
                                        <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>● ACTIVE</span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Policy: {policy.policyNumber}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.8125rem' }}>
                                        <span style={{ color: '#64748b' }}>Coverage Ends: {new Date(policy.endDate).toLocaleDateString()}</span>
                                        <span style={{ fontWeight: 600 }}>${policy.premium}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No active insurance policies.</p>
                        )}
                    </div>
                </div>

                <div style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Recent Activity</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                                <Shield size={18} color="#8b5cf6" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Account Registered</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(userData.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                        {userData.kycStatus === 'verified' && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={18} color="#10b981" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Identity Verified</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Completed</div>
                                </div>
                            </div>
                        )}
                        {userData.policies && userData.policies.length > 0 && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                                    <Plus size={18} color="#8b5cf6" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Insurance Activated</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Recent</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
