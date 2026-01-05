"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, MapPin, Contact, List, MessageSquare, ShoppingBag, Layers } from 'lucide-react';

interface Chat {
    _id: string;
    lastMessage: string;
    lastSender: string;
    lastCreatedAt: string;
    unreadCount: number;
    user: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profilePicture?: string;
    };
}

interface Message {
    _id: string;
    message: string;
    sender: 'USER' | 'ADMIN' | 'SYSTEM';
    createdAt: string;
    metadata?: any;
}

export default function WhatsAppChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial load and polling
    useEffect(() => {
        fetchChats();
        fetchUnreadTotal();
        const interval = setInterval(() => {
            fetchChats();
            fetchUnreadTotal();
            if (activeChat) fetchMessages(activeChat._id);
        }, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [activeChat?._id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchChats = async () => {
        try {
            const res = await fetch("http://localhost:3001/api/users/chats");
            const data = await res.json();
            if (data.success) setChats(data.chats);
        } catch (e) {
            console.error("Failed to fetch chats");
        }
    };

    const fetchUnreadTotal = async () => {
        try {
            const res = await fetch("http://localhost:3001/api/users/chats/unread-total");
            const data = await res.json();
            if (data.success) setUnreadTotal(data.count);
        } catch (e) { }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/users/chats/${userId}/messages`);
            const data = await res.json();
            if (data.success) setMessages(data.messages);
        } catch (e) { }
    };

    const markAsRead = async (userId: string) => {
        try {
            await fetch(`http://localhost:3001/api/users/chats/${userId}/read`, { method: 'POST' });
            fetchUnreadTotal();
        } catch (e) { }
    };

    const handleSend = async (type = 'text', payload: any = {}) => {
        if (!activeChat || (!newMessage && type === 'text')) return;
        setIsLoading(true);
        try {
            const body = type === 'text' ? { message: newMessage, type: 'text' } : { message: payload.message || 'Advanced Message', type, ...payload };
            const res = await fetch(`http://localhost:3001/api/users/${activeChat._id}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setNewMessage("");
                setShowAdvanced(false);
                fetchMessages(activeChat._id);
            }
        } catch (e) {
            alert("Failed to send message");
        }
        setIsLoading(false);
    };

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, fontFamily: 'Inter, sans-serif' }}>
            {/* Bubble */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: '#25D366',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer',
                        position: 'relative', transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <MessageCircle size={24} />
                    {unreadTotal > 0 && (
                        <span style={{
                            position: 'absolute', top: '-0.2rem', right: '-0.2rem', background: '#EF4444',
                            color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem',
                            borderRadius: '1rem', border: '2px solid white'
                        }}>
                            {unreadTotal}
                        </span>
                    )}
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div style={{
                    width: '24rem', height: '36rem', background: '#0D1117', borderRadius: '1rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161B22' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {activeChat ? (
                                <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '0.25rem' }}>
                                    ←
                                </button>
                            ) : null}
                            <span style={{ color: 'white', fontWeight: 600 }}>
                                {activeChat ? `${activeChat.user.firstName} ${activeChat.user.lastName}` : "Hima Conversations"}
                            </span>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}>
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0D1117', overflow: 'hidden' }}>
                        {!activeChat ? (
                            /* Chat List */
                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                {chats.map(chat => (
                                    <div
                                        key={chat._id}
                                        onClick={() => { setActiveChat(chat); markAsRead(chat._id); }}
                                        style={{
                                            padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.03)',
                                            cursor: 'pointer', transition: 'background 0.2s',
                                            display: 'flex', gap: '0.75rem', alignItems: 'center'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                                            <User size={16} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>{chat.user.firstName} {chat.user.lastName}</span>
                                                <span style={{ color: '#4B5563', fontSize: '0.7rem' }}>{new Date(chat.lastCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ color: '#6B7280', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                                                    {chat.lastSender === 'ADMIN' ? 'You: ' : ''}{chat.lastMessage}
                                                </p>
                                                {chat.unreadCount > 0 && (
                                                    <span style={{ background: '#25D366', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', minWidth: '1.2rem', height: '1.2rem', borderRadius: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {chat.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {chats.length === 0 && (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280', fontSize: '0.9rem' }}>No conversations yet</div>
                                )}
                            </div>
                        ) : (
                            /* Active Chat Window */
                            <>
                                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {messages.map(msg => (
                                        <div key={msg._id} style={{
                                            alignSelf: msg.sender === 'USER' ? 'flex-start' : 'flex-end',
                                            maxWidth: '80%',
                                            background: msg.sender === 'USER' ? '#161B22' : '#238636',
                                            color: 'white', padding: '0.6rem 0.8rem', borderRadius: '0.75rem',
                                            fontSize: '0.85rem', position: 'relative',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                                            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', textAlign: 'right', marginTop: '0.2rem' }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Composer */}
                                {showAdvanced && (
                                    <div style={{ padding: '0.5rem', background: '#161B22', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <button onClick={() => handleSend('location', { lat: -1.286389, lng: 36.817223, name: "Nairobi HQ", address: "CBD" })} style={{ padding: '0.5rem', background: '#21262D', color: '#9CA3AF', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.65rem' }}>
                                            <MapPin size={16} /><span style={{ marginTop: '0.2rem' }}>Location</span>
                                        </button>
                                        <button onClick={() => handleSend('contact', { name: "Hima Support", phone: "+254700000000" })} style={{ padding: '0.5rem', background: '#21262D', color: '#9CA3AF', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.65rem' }}>
                                            <Contact size={16} /><span style={{ marginTop: '0.2rem' }}>Contact</span>
                                        </button>
                                        <button onClick={() => handleSend('buttons', { message: "How can we help?", buttons: ["Claims", "Policy", "Agent"] })} style={{ padding: '0.5rem', background: '#21262D', color: '#9CA3AF', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.65rem' }}>
                                            <MessageSquare size={16} /><span style={{ marginTop: '0.2rem' }}>Buttons</span>
                                        </button>
                                        <button onClick={() => handleSend('list', { message: "Available Products", title: "Select a Plan", button: "View Plans", sections: [{ title: "Popular", rows: [{ id: "p1", title: "Daily Cover", description: "KES 50/day" }, { id: "p2", title: "Monthly Cover", description: "KES 1200/mo" }] }] })} style={{ padding: '0.5rem', background: '#21262D', color: '#9CA3AF', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.65rem' }}>
                                            <List size={16} /><span style={{ marginTop: '0.2rem' }}>List</span>
                                        </button>
                                        <button onClick={() => handleSend('product', { productRetailerId: "HIMA_MOTO_001" })} style={{ padding: '0.5rem', background: '#21262D', color: '#9CA3AF', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.65rem' }}>
                                            <ShoppingBag size={16} /><span style={{ marginTop: '0.2rem' }}>Product</span>
                                        </button>
                                        <button onClick={() => handleSend('flow', { flowId: "REG_FLOW_001", flowAction: "navigate", flowData: { screen: "START" } })} style={{ padding: '0.5rem', background: '#21262D', color: '#9CA3AF', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.65rem' }}>
                                            <Layers size={16} /><span style={{ marginTop: '0.2rem' }}>Flow</span>
                                        </button>
                                    </div>
                                )}

                                <div style={{ padding: '0.75rem', background: '#161B22', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        style={{ background: 'none', border: 'none', color: showAdvanced ? '#25D366' : '#6B7280', cursor: 'pointer' }}
                                    >
                                        <List size={20} />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                                        placeholder="Type a message..."
                                        style={{
                                            flex: 1, background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '2rem', padding: '0.5rem 1rem', color: 'white', fontSize: '0.85rem',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        disabled={isLoading || !newMessage}
                                        onClick={() => handleSend()}
                                        style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#238636', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: isLoading || !newMessage ? 0.5 : 1 }}
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
