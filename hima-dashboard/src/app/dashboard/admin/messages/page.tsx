"use client";

import { useState, useEffect } from "react";
// @ts-ignore
import styles from "./messages.module.css";
import { Search, Send, Users, MessageSquare, AlertCircle } from "lucide-react";

export default function MessagesPage() {
    const [mode, setMode] = useState<"broadcast" | "single">("broadcast");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [messageData, setMessageData] = useState({ type: 'text', message: '', buttons: '' });
    const [loading, setLoading] = useState(false);

    // Search users when query changes
    useEffect(() => {
        const searchUsers = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                // We'll reuse the main users endpoint for now and filter client side 
                // In a real app we'd want a dedicated search endpoint
                const res = await fetch("http://localhost:8100/api/users");
                const data = await res.json();
                if (data.success) {
                    const filtered = data.users.filter((u: any) =>
                        u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.phoneNumber?.includes(searchQuery)
                    );
                    setSearchResults(filtered.slice(0, 5));
                }
            } catch (error) {
                console.error("Search failed", error);
            }
        };
        const timeout = setTimeout(searchUsers, 500);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = async () => {
        try {
            const res = await fetch("http://localhost:8100/api/users/messages/history");
            const data = await res.json();
            if (data.success) {
                setHistory(data.logs);
            }
        } catch (error) {
            console.error("History fetch failed", error);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleSend = async () => {
        if (!messageData.message) return alert("Please enter a message");
        if (mode === 'single' && !selectedUser) return alert("Please select a user");

        setLoading(true);
        try {
            const body: any = { message: messageData.message, type: messageData.type };
            if (messageData.type === 'buttons') {
                body.buttons = messageData.buttons.split(',').map(b => b.trim()).filter(b => b);
                if (body.buttons.length === 0 || body.buttons.length > 3) {
                    alert("Please provide 1-3 buttons");
                    setLoading(false);
                    return;
                }
            }

            let url = "http://localhost:8100/api/users/broadcast";
            if (mode === "single") {
                url = `http://localhost:8100/api/users/${selectedUser._id}/message`;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (data.success) {
                alert(mode === 'broadcast' ? `Broadcast sent to ${data.sent} users!` : "Message sent successfully!");
                setMessageData({ type: 'text', message: '', buttons: '' });
                fetchHistory(); // Refresh history
            } else {
                alert("Failed: " + data.error);
            }
        } catch (error) {
            console.error("Send failed", error);
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', letterSpacing: '-0.025em' }}>Communication Hub</h1>
                <p style={{ color: '#9CA3AF', marginTop: '0.25rem' }}>Send updates, alerts, and messages to your users.</p>
            </div>

            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', overflow: 'hidden', marginBottom: '2rem' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <button
                        onClick={() => setMode('broadcast')}
                        style={{ flex: 1, padding: '1rem', background: mode === 'broadcast' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: mode === 'broadcast' ? '#3b82f6' : '#6B7280', border: 'none', borderBottom: mode === 'broadcast' ? '2px solid #3b82f6' : 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <Users size={18} /> Broadcast to All
                    </button>
                    <button
                        onClick={() => setMode('single')}
                        style={{ flex: 1, padding: '1rem', background: mode === 'single' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: mode === 'single' ? '#3b82f6' : '#6B7280', border: 'none', borderBottom: mode === 'single' ? '2px solid #3b82f6' : 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <MessageSquare size={18} /> Direct Message
                    </button>
                </div>

                <div style={{ padding: '2rem' }}>

                    {/* Recipient Selection for Single Mode */}
                    {mode === 'single' && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ color: '#9CA3AF', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Search User (Name or Phone)</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                                <input
                                    type="text"
                                    value={selectedUser ? `${selectedUser.firstName} (${selectedUser.phoneNumber})` : searchQuery}
                                    onChange={(e) => {
                                        if (selectedUser) setSelectedUser(null);
                                        setSearchQuery(e.target.value);
                                    }}
                                    placeholder="Start typing to search..."
                                    style={{ width: '100%', background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 0.75rem 0.75rem 3rem', borderRadius: '0.5rem', color: 'white', outline: 'none' }}
                                />
                                {selectedUser && (
                                    <button
                                        onClick={() => { setSelectedUser(null); setSearchQuery(""); }}
                                        style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer' }}
                                    >✕</button>
                                )}
                            </div>

                            {/* Dropdown Results */}
                            {!selectedUser && searchResults.length > 0 && (
                                <div style={{ marginTop: '0.5rem', background: '#1c1c1c', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                    {searchResults.map(user => (
                                        <div
                                            key={user._id}
                                            onClick={() => { setSelectedUser(user); setSearchResults([]); }}
                                            style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user.firstName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{user.phoneNumber}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Warning for Broadcast */}
                    {mode === 'broadcast' && (
                        <div style={{ padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                            <AlertCircle size={20} style={{ color: '#eab308', flexShrink: 0 }} />
                            <div>
                                <h4 style={{ color: '#eab308', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Broadcasting to Everyone</h4>
                                <p style={{ color: '#fbbf24', fontSize: '0.8rem', opacity: 0.9 }}>This message will be sent to all registered active users. Please double check before sending.</p>
                            </div>
                        </div>
                    )}

                    {/* Message Composer */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ color: '#9CA3AF', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Message Type</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        checked={messageData.type === 'text'}
                                        onChange={() => setMessageData({ ...messageData, type: 'text' })}
                                        style={{ accentColor: '#3b82f6' }}
                                    />
                                    Standard Text
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        checked={messageData.type === 'buttons'}
                                        onChange={() => setMessageData({ ...messageData, type: 'buttons' })}
                                        style={{ accentColor: '#3b82f6' }}
                                    />
                                    Interactive Buttons
                                </label>
                            </div>
                        </div>

                        <div>
                            <label style={{ color: '#9CA3AF', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Content</label>
                            <textarea
                                value={messageData.message}
                                onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                                rows={6}
                                placeholder="Type your message here..."
                                style={{ width: '100%', background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '0.5rem', color: 'white', outline: 'none', resize: 'vertical' }}
                            />
                        </div>

                        {messageData.type === 'buttons' && (
                            <div>
                                <label style={{ color: '#9CA3AF', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Buttons (comma separated, max 3)</label>
                                <input
                                    type="text"
                                    value={messageData.buttons}
                                    onChange={(e) => setMessageData({ ...messageData, buttons: e.target.value })}
                                    placeholder="e.g. Confirm, Reject, More Info"
                                    style={{ width: '100%', background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.5rem', color: 'white', outline: 'none' }}
                                />
                            </div>
                        )}

                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '1rem 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleSend}
                                disabled={loading}
                                style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    padding: '0.75rem 2rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                <Send size={18} />
                                {loading ? "Sending..." : "Send Message"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>Message History</h2>
                    <button onClick={fetchHistory} style={{ color: '#3b82f6', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>Refresh</button>
                </div>

                <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', overflow: 'hidden' }}>
                    {history.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                            No message history found.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {history.map((log) => {
                                const isInbound = log.type === "WEBHOOK" || log.type === "REGISTRATION";
                                const userLabel = log.userData ? `${log.userData.name || 'User'} (${log.userData.phone})` : (log.metadata?.from || "Unknown");

                                return (
                                    <div key={log._id} style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: isInbound ? 'flex-start' : 'flex-end' }}>
                                        <div style={{
                                            maxWidth: '80%',
                                            background: isInbound ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.1)',
                                            padding: '1rem',
                                            borderRadius: '0.75rem',
                                            border: isInbound ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(59, 130, 246, 0.2)'
                                        }}>
                                            <div style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                                                <span style={{ fontWeight: 600, color: isInbound ? '#9CA3AF' : '#60a5fa' }}>
                                                    {isInbound ? `👤 ${userLabel}` : "🛡️ ADMIN"} • {log.type}
                                                </span>
                                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div style={{ color: 'white', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                                                {log.message}
                                            </div>

                                            {/* Broadcast Stats */}
                                            {log.type === 'ADMIN_BROADCAST' && log.metadata?.sentCount !== undefined && (
                                                <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.5rem', fontWeight: 500 }}>
                                                    Sent to {log.metadata.sentCount} users {log.metadata.failedCount > 0 && `(Failed: ${log.metadata.failedCount})`}
                                                </div>
                                            )}

                                            {/* Recipient for Direct Messages */}
                                            {!isInbound && log.type === 'ADMIN_OUTBOUND' && log.userData && (
                                                <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.5rem' }}>
                                                    To: {log.userData.name} ({log.userData.phone})
                                                </div>
                                            )}

                                            {log.metadata?.buttons && (
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                    {log.metadata.buttons.map((b: string, i: number) => (
                                                        <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: '#9CA3AF' }}>{b}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
