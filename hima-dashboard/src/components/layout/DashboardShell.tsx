"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Toaster } from 'sonner';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as auth from "@/lib/auth";
// @ts-ignore
import styles from "./dashboard-shell.module.css";

export default function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const role = pathname.includes("/admin") ? "admin" : pathname.includes("/lp") ? "lp" : "user";

    useEffect(() => {
        if (!auth.isAuthenticated()) {
            // Preserve the current URL to redirect back after login
            const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
            router.push(`/?redirect=${currentUrl}`);
        } else {
            setIsChecking(false);
        }
    }, [pathname, router]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (isChecking) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ border: '4px solid #1e293b', borderTop: '4px solid #8b5cf6', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Authenticating Hima Session...</p>
                </div>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                ` }} />
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            <Toaster position="top-right" theme="dark" />
            <Sidebar role={role as any} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className={styles.mainContent}>
                <Header role={role} onMenuClick={() => setIsSidebarOpen(true)} />
                {children}
            </main>
        </div>
    );
}
