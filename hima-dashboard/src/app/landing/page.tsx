"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Zap, Lock, BarChart3, Users, Globe } from "lucide-react";

export default function LandingPage() {
    const router = useRouter();

    return (
        <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at top center, #1e1b4b 0%, #020617 100%)', overflow: 'hidden' }}>

            {/* Navbar */}
            <nav className="glass" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                padding: '1rem 2rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Shield size={18} color="white" fill="white" />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Hima</span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => router.push('/')}
                        style={{
                            background: 'transparent',
                            color: '#cbd5e1',
                            border: 'none',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Log In
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => router.push('/register')}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                paddingTop: '8rem',
                paddingBottom: '4rem',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative'
            }}>
                {/* Background glow effects */}
                <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '50%', filter: 'blur(100px)', zIndex: -1 }}></div>

                <div className="glass" style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#a78bfa',
                    border: '1px solid rgba(167, 139, 250, 0.2)'
                }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 10px #a78bfa' }}></span>
                    Now live on Mantle Testnet
                </div>

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    marginBottom: '1.5rem',
                    letterSpacing: '-0.02em',
                    maxWidth: '800px'
                }}>
                    Insurance for the <span className="text-gradient">Unknown.</span><br />
                    Built for <span style={{ color: 'white' }}>Everyone.</span>
                </h1>

                <p style={{
                    color: '#94a3b8',
                    fontSize: '1.125rem',
                    maxWidth: '600px',
                    lineHeight: 1.6,
                    marginBottom: '2.5rem'
                }}>
                    Hima provides decentralized, instant, and transparent micro-insurance coverage powered by blockchain technology. Protect what matters, instantly.
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => router.push('/register')}
                        style={{ padding: '1rem 2rem', fontSize: '1rem' }}
                    >
                        Start Protecting Now
                    </button>
                    <button
                        className="btn glass"
                        onClick={() => router.push('/')}
                        style={{ padding: '1rem 2rem', fontSize: '1rem', color: 'white' }}
                    >
                        Access Account
                    </button>
                </div>

                {/* Hero Stats/Image Placeholder */}
                <div style={{
                    marginTop: '4rem',
                    width: '100%',
                    maxWidth: '1000px',
                    aspectRatio: '16/9',
                    background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.4) 0%, rgba(30, 27, 75, 0.1) 100%)',
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '2rem', fontWeight: 700 }}>
                        Dashboard Preview
                    </div>
                    {/* Mock UI Elements could go here */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, #020617, transparent)' }}></div>
                </div>
            </section>

            {/* Features Grid */}
            <section style={{ padding: '4rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Why Choose Hima?</h2>
                    <p style={{ color: '#94a3b8' }}>Built with advanced technology to ensure security and speed.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <FeatureCard
                        icon={<Zap size={24} color="#60a5fa" />}
                        title="Instant Settlements"
                        desc="Claims are processed automatically via smart contracts. No paperwork, no waiting periods."
                    />
                    <FeatureCard
                        icon={<Lock size={24} color="#a78bfa" />}
                        title="Blockchain Secured"
                        desc="Your policy is minted as an NFT on the blockchain, ensuring immutable proof of ownership."
                    />
                    <FeatureCard
                        icon={<Globe size={24} color="#34d399" />}
                        title="Global Access"
                        desc="Access standard insurance coverage from anywhere in the world without geographic restrictions."
                    />
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                padding: '3rem 1.5rem',
                marginTop: '4rem',
                background: 'rgba(2, 6, 23, 0.5)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield size={20} color="#a78bfa" />
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Hima Insurance</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        © 2026 Hima Protocol. All rights reserved.
                    </div>
                </div>
            </footer>
        </main>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="glass" style={{
            padding: '2rem',
            borderRadius: '1.5rem',
            transition: 'transform 0.3s ease',
            cursor: 'default'
        }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
            }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>{title}</h3>
            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{desc}</p>
        </div>
    );
}
