"use client";

import { useEffect, useState } from "react";
// @ts-ignore
import tableStyles from "@/components/dashboard/tables.module.css";
import {
    Users, Search, Filter, MoreHorizontal, Shield, User as UserIcon,
    Check, X, Ban, MessageCircle, Send, Eye, RotateCcw, FileText
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/config";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleAction = async (userId: string, action: string) => {
        let reason = "";
        if (action === 'reject_kyc') {
            reason = prompt("Please provide a reason for rejection (this will be sent to the user):") || "";
            if (!reason) return; // Cancel if no reason
        }

        if (!confirm(`Are you sure you want to perform ${action.replace('_', ' ')}?`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Action ${action} successful`);
                setUsers(users.map(u => u._id === userId ? data.user : u));
            } else {
                toast.error("Action failed: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Action error:", error);
            toast.error("Failed to perform action");
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Fetch from the new generic userRouter
                const res = await fetch(`${API_BASE_URL}/api/users`);
                const data = await res.json();
                if (data.success) {
                    setUsers(data.users);
                }
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "verified":
                return <span style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Verified</span>;
            case "pending":
                return <span style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Pending</span>;
            case "rejected":
                return <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Rejected</span>;
            default:
                return <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Unverified</span>;
        }
    };

    const [selectedDocs, setSelectedDocs] = useState<any[] | null>(null);

    const openMessageModal = (user: any) => {
        toast.info(`Messaging feature for ${user.firstName || 'user'} is coming soon!`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', letterSpacing: '-0.025em' }}>User Management</h1>
                    <p style={{ color: '#9CA3AF', marginTop: '0.25rem' }}>Manage system access and view rider profiles.</p>
                </div>
                <button style={{ background: '#8b5cf6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)' }}>
                    Export CSV
                </button>
            </div>

            <div className={tableStyles.tableContainer}>
                {/* Table Toolbar */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                        <input
                            type="text"
                            placeholder="Search by name, phone or ID..."
                            style={{ width: '100%', background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 0.75rem 0.75rem 3rem', borderRadius: '0.5rem', color: 'white', outline: 'none' }}
                        />
                    </div>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', cursor: 'pointer' }}>
                        <Filter size={18} /> Filter
                    </button>
                </div>

                <table className={tableStyles.table}>
                    <thead>
                        <tr>
                            <th className={tableStyles.th}>User / Type</th>
                            <th className={tableStyles.th}>Contact Info</th>
                            <th className={tableStyles.th}>KYC Status</th>
                            <th className={tableStyles.th}>Policy Status</th>
                            <th className={tableStyles.th}>Joined</th>
                            <th className={tableStyles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading users...</td></tr>
                        ) : users.map((user) => (
                            <tr key={user._id} className={tableStyles.tr}>
                                <td className={tableStyles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: user.role === 'admin' ? '#8b5cf6' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                            {user.role === 'admin' ? <Shield size={16} /> : <UserIcon size={16} />}
                                        </div>
                                        <div>
                                            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{user.firstName || 'Unknown'}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{user.role || 'rider'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className={tableStyles.td}>
                                    <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>WA: {user.phoneNumber}</div>
                                    {user.loginPhoneNumber && (
                                        <div style={{ color: '#8b5cf6', fontSize: '0.75rem', marginTop: '2px' }}>Login: {user.loginPhoneNumber}</div>
                                    )}
                                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>ID: {user.nationalId || 'N/A'}</div>
                                </td>
                                <td className={tableStyles.td}>
                                    {getStatusBadge(user.kycStatus)}
                                </td>
                                <td className={tableStyles.td}>
                                    {user.policyStatus === 'active' ? (
                                        <span style={{ color: '#22c55e', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>● Active</span>
                                    ) : (
                                        <span style={{ color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>○ Inactive</span>
                                    )}
                                </td>
                                <td className={tableStyles.td} style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className={tableStyles.td}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        {user.kycDocuments && user.kycDocuments.length > 0 && (
                                            <button
                                                onClick={() => setSelectedDocs(user.kycDocuments)}
                                                title="View KYC Documents"
                                                style={{ padding: '0.25rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                <Eye size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openMessageModal(user)}
                                            title="Send Message"
                                            style={{ padding: '0.25rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            <MessageCircle size={14} />
                                        </button>

                                        {user.kycStatus === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleAction(user._id, 'approve_kyc')}
                                                    title="Approve KYC"
                                                    style={{ padding: '0.25rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(user._id, 'reject_kyc')}
                                                    title="Reject KYC"
                                                    style={{ padding: '0.25rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </>
                                        )}

                                        {user.kycStatus === 'verified' && (
                                            <button
                                                onClick={() => handleAction(user._id, 'unverify_kyc')}
                                                title="Unverify User"
                                                style={{ padding: '0.25rem', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        )}

                                        {user.status !== 'blocked' ? (
                                            <button
                                                onClick={() => handleAction(user._id, 'block_user')}
                                                title="Block User"
                                                style={{ padding: '0.25rem', background: 'rgba(113, 113, 122, 0.1)', color: '#71717a', border: '1px solid rgba(113, 113, 122, 0.2)', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                <Ban size={14} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction(user._id, 'unblock_user')}
                                                title="Unblock User"
                                                style={{ padding: '0.25rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                <Check size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
