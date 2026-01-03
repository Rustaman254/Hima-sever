"use client";

import { HelpCircle, MessageSquare, BookOpen, ExternalLink, Zap } from "lucide-react";

export default function UserSupport() {
    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginBottom: '1rem' }}>How can we help?</h1>
                <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>Search our knowledge base or contact a support specialist.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
                {[
                    { title: 'Knowledge Base', desc: 'Browse guides and tutorials on using Hima.', icon: <BookOpen size={24} />, color: '#3b82f6' },
                    { title: 'Live Chat', desc: 'Chat with our support team in real-time.', icon: <MessageSquare size={24} />, color: '#8b5cf6' },
                    { title: 'Community', desc: 'Join the Hima Discord to discuss with others.', icon: <Zap size={24} />, color: '#4ade80' }
                ].map((card, i) => (
                    <div key={i} style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ width: '3.5rem', height: '3.5rem', background: `${card.color}15`, color: card.color, borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            {card.icon}
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>{card.title}</h3>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>{card.desc}</p>
                        <button style={{ background: 'none', border: 'none', color: '#8b5cf6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
                            Get Started <ChevronRight size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', padding: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '2rem' }}>Frequently Asked Questions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                        'How is my insurance payout calculated?',
                        'What data sources are used for flood detection?',
                        'Can I withdraw my liquidity at any time?',
                        'What are the fees for filing a claim?'
                    ].map((q, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                            <span style={{ color: '#E2E8F0', fontWeight: 500 }}>{q}</span>
                            <ChevronRight size={18} color="#6B7280" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// @ts-ignore
function ChevronRight({ size, color = "currentColor" }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
    )
}
