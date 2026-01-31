"use client";

import { useState, useEffect } from "react";
import { Check, X, Search, Filter, Loader2, MessageCircle, Eye, FileText } from "lucide-react";
// @ts-ignore
import styles from "../../dashboard.module.css";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/config";

export default function RegistrationMonitor() {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDocs, setSelectedDocs] = useState<any[] | null>(null);

    const fetchRegistrations = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/insurance/admin/registrations`);
            const data = await res.json();
            if (data.success) {
                setRegistrations(data.users);
            }
        } catch (error) {
            console.error("Failed to fetch:", error);
            toast.error("Could not connect to Hima Server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const updateStatus = async (userId: string, status: 'verified' | 'rejected') => {
        let reason = "";
        if (status === 'rejected') {
            reason = prompt("Please provide a reason for rejection:") || "";
            if (!reason) return;
        }

        toast.loading(`${status === 'verified' ? 'Approving' : 'Rejecting'} user...`);
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: status === 'verified' ? 'approve_kyc' : 'reject_kyc', reason })
            });
            const data = await res.json();
            if (data.success) {
                toast.dismiss();
                toast.success(`User ${status}`);
                fetchRegistrations();
            } else {
                toast.dismiss();
                toast.error("Update failed: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Transformation failed");
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>KYC Monitor</h1>
                <p className={styles.subtitle}>Manage real-time user registrations</p>
            </div>

            <div className={styles.section}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '0.75rem 1rem' }}>
                        <Search size={18} color="#64748b" />
                        <input type="text" placeholder="Search by phone, name or ID..." style={{ border: 'none', background: 'transparent', width: '100%', color: 'white', outline: 'none' }} />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" color="#8b5cf6" size={40} style={{ margin: '0 auto' }} />
                        <p style={{ marginTop: '1rem', color: '#64748b' }}>Establishing secure connection...</p>
                    </div>
                ) : (registrations.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '2rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <p style={{ color: '#64748b' }}>No registrations found.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <th style={{ padding: '1rem', color: '#64748b', fontWeight: 500 }}>User / Phone</th>
                                    <th style={{ padding: '1rem', color: '#64748b', fontWeight: 500 }}>National ID</th>
                                    <th style={{ padding: '1rem', color: '#64748b', fontWeight: 500 }}>Time</th>
                                    <th style={{ padding: '1rem', color: '#64748b', fontWeight: 500 }}>Status</th>
                                    <th style={{ padding: '1rem', color: '#64748b', fontWeight: 500 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.map((user) => (
                                    <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600, color: 'white' }}>{user.firstName || 'Anonymous'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#8b5cf6' }}>WA: +{user.phoneNumber}</div>
                                            {user.loginPhoneNumber && (
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Login: {user.loginPhoneNumber}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#94a3b8' }}>{user.nationalId || 'N/A'}</td>
                                        <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: user.kycStatus === 'pending' ? 'rgba(234, 179, 8, 0.1)' : user.kycStatus === 'verified' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: user.kycStatus === 'pending' ? '#facc15' : user.kycStatus === 'verified' ? '#4ade80' : '#f87171',
                                                border: `1px solid ${user.kycStatus === 'pending' ? 'rgba(234, 179, 8, 0.2)' : user.kycStatus === 'verified' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                            }}>
                                                {user.kycStatus?.toUpperCase() || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {user.kycStatus === 'pending' && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {user.kycDocuments && user.kycDocuments.length > 0 && (
                                                        <button
                                                            onClick={() => setSelectedDocs(user.kycDocuments)}
                                                            style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '0.5rem', border: '1px solid rgba(139, 92, 246, 0.2)', cursor: 'pointer' }}
                                                            title="View Documents"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => updateStatus(user._id, 'verified')}
                                                        style={{ padding: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: '0.5rem', border: '1px solid rgba(34, 197, 94, 0.2)', cursor: 'pointer' }}
                                                        title="Approve"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(user._id, 'rejected')}
                                                        style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }}
                                                        title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => window.open(`https://wa.me/${user.phoneNumber}`, '_blank')}
                                                        style={{ padding: '0.5rem', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', borderRadius: '0.5rem', border: '1px solid rgba(37, 211, 102, 0.2)', cursor: 'pointer' }}
                                                        title="Chat on WhatsApp"
                                                    >
                                                        <MessageCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
            {/* KYC Documents Modal */}
            {selectedDocs && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div
                        onClick={() => setSelectedDocs(null)}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
                    ></div>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '900px', maxHeight: '90vh', background: '#111', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>KYC Verification Documents</h2>
                            <button onClick={() => setSelectedDocs(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {selectedDocs.map((doc, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '1rem' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={16} /> {doc.type?.replace('_', ' ')}
                                    </div>
                                    <div style={{ width: '100%', aspectRatio: '16/10', background: '#000', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                        <img src={doc.url} alt={doc.type} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Uploaded: {new Date(doc.uploadedAt).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
