"use client";

import React, { ReactNode } from "react";
import styles from "./AuthLayout.module.css";
// We'll rely on global or module styles. I'll create a module css for this.

// Placeholder icon components to match the design vibe
const PlusIcon = () => <span style={{ fontSize: '24px', fontWeight: 300 }}>+</span>;
const BoltIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="black" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

interface AuthLayoutProps {
    children: ReactNode;
    isAdminMode: boolean;
    onAdminToggle: () => void;
}

export default function AuthLayout({ children, isAdminMode, onAdminToggle }: AuthLayoutProps) {
    return (
        <div className={styles.container}>
            {/* Left Side - Visual Grid */}
            <div className={styles.visualSide}>
                <div className={styles.gridContainer}>
                    {/* Row 1 */}
                    <div className={styles.tile} style={{ backgroundImage: 'radial-gradient(circle at center, #2e2e2e 0%, #000 100%)' }}></div>
                    <div className={styles.tile} style={{ background: '#7c3aed' }}> {/* Purple */} </div>
                    <div className={styles.tile} style={{ background: '#c084fc', display: 'flex', flexDirection: 'column', padding: '1.5rem', justifyContent: 'flex-end', color: '#1a1a1a' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Total Care.</h3>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Total Different.</h3>
                    </div>

                    {/* Row 2 */}
                    <div className={styles.tile} style={{ background: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '60px', height: '60px', background: 'black', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
                            </svg>
                        </div>
                    </div>
                    <div className={styles.tile} style={{ background: '#fef08a', color: '#1a1a1a', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <PlusIcon />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 500, margin: 0 }}>Building trust in blockchain technology</h3>
                    </div>

                    {/* Row 3 */}
                    <div className={styles.tile} style={{ background: '#fef08a', color: '#1a1a1a', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <PlusIcon />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 500, margin: 0 }}>Own your power</h3>
                    </div>
                    <div className={styles.tile} style={{ backgroundImage: 'radial-gradient(circle at center, #2e2e2e 0%, #1a1a1a 100%)' }}></div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className={styles.formSide}>
                <div className={styles.topBar}>
                    <button onClick={onAdminToggle} className={styles.adminLink}>
                        {isAdminMode ? "User Login" : "Admin Login"}
                    </button>
                </div>
                <div className={styles.formContent}>
                    {children}
                </div>
            </div>
        </div>
    );
}
