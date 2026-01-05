"use client";

import { useEffect, useState } from "react";
// @ts-ignore
import tableStyles from "@/components/dashboard/tables.module.css";
import { Users, Search, Filter, MoreHorizontal, Shield, User as UserIcon, Check, X, Ban, MessageCircle } from "lucide-react";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleAction = async (userId: string, action: string) => {
        if (!confirm("Are you sure you want to perform this action?")) return;

        try {
            const res = await fetch(`http://localhost:8100/api/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (data.success) {
                setUsers(users.map(u => u._id === userId ? data.user : u));
            } else {
                alert("Action failed: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Action error:", error);
            alert("Failed to perform action");
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Fetch from the new generic userRouter
                const res = await fetch("http://localhost:8100/api/users");
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
                return <span style={{ background: 'rgba(113, 113, 122, 0.1)', color: '#71717a', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Unverified</span>;
        }
    };

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [messageData, setMessageData] = useState({ type: 'text', message: '', buttons: '' });

    const openMessageModal = (user: any) => {
        setSelectedUser(user);
        setMessageData({ type: 'text', message: '', buttons: '' });
        setIsMessageModalOpen(true);
    };

    const handleSendMessage = async () => {
        if (!messageData.message) return alert("Message is required");

        try {
            const body: any = { message: messageData.message, type: messageData.type };
            if (messageData.type === 'buttons') {
                body.buttons = messageData.buttons.split(',').map(b => b.trim()).filter(b => b);
                if (body.buttons.length === 0 || body.buttons.length > 3) {
                    return alert("Please provide 1-3 buttons separated by commas");
                }
            }

            const res = await fetch(`http://localhost:8100/api/users/${selectedUser?._id}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                alert("Message sent successfully!");
                setIsMessageModalOpen(false);
            } else {
                alert("Failed to send: " + data.error);
            }
        } catch (error) {
            console.error("Send error:", error);
            alert("Error sending message");
        }
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
                                    <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>{user.phoneNumber}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>ID: {user.nationalId || 'N/A'}</div>
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

            {/* Message Modal */}
            {isMessageModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '400px' }}>
                        <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                            Message {selectedUser?.firstName}
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ color: '#9CA3AF', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Message Type</label>
                                <select
                                    value={messageData.type}
                                    onChange={(e) => setMessageData({ ...messageData, type: e.target.value })}
                                    style={{ width: '100%', background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.5rem', color: 'white' }}
                                >
                                    <option value="text">Text Message</option>
                                    <option value="buttons">Interactive Buttons</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ color: '#9CA3AF', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Message Body</label>
                                <textarea
                                    value={messageData.message}
                                    onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                                    rows={4}
                                    placeholder="Type your message..."
                                    style={{ width: '100%', background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.5rem', color: 'white' }}
                                />
                            </div>

                            {messageData.type === 'buttons' && (
                                <div>
                                    <label style={{ color: '#9CA3AF', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Buttons (comma separated, max 3)</label>
                                    <input
                                        type="text"
                                        value={messageData.buttons}
                                        onChange={(e) => setMessageData({ ...messageData, buttons: e.target.value })}
                                        placeholder="Yes, No, More Info"
                                        style={{ width: '100%', background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.5rem', color: 'white' }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                <button
                                    onClick={() => setIsMessageModalOpen(false)}
                                    style={{ background: 'transparent', color: '#9CA3AF', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                >
                                    Send Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
