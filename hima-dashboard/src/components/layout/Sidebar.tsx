"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Layers, /* Assets/Pools */
    Users, /* Providers */
    Calculator, /* Calculator */
    Activity, /* API */
    Zap, /* Active Staking/Liquidity */
    Shield,
    Settings,
    Bolt,
    FileText,
    LifeBuoy,
    MessageSquare
} from "lucide-react";
// @ts-ignore
import styles from "./sidebar.module.css";
import { API_BASE_URL } from "@/lib/config";

import { useState, useEffect } from "react";

interface SidebarProps {
    role: "admin" | "lp" | "user";
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (role === "admin") {
            const fetchStats = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/api/insurance/admin/stats`);
                    const data = await res.json();
                    if (data.success) {
                        setPendingCount(data.stats.pendingKyc + data.stats.pendingPolicies + data.stats.pendingClaims);
                    }
                } catch (e) {
                    console.error("Sidebar stats fetch failed", e);
                }
            };
            fetchStats();
            // Poll every 30s
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [role]);

    const adminItems = [
        { name: "Dashboard", href: `/dashboard/admin`, icon: LayoutDashboard, badge: pendingCount > 0 ? pendingCount.toString() : undefined },
        { name: "Messages", href: `/dashboard/admin/messages`, icon: MessageSquare },
        { name: "Insurance Pools", href: `/dashboard/admin/pools`, icon: Layers },
        { name: "Providers", href: `/dashboard/admin/providers`, icon: Users },
        { name: "Active Policies", href: `/dashboard/admin/active`, icon: Zap },
        { name: "System Logs", href: `/dashboard/admin/logs`, icon: Activity },
        { name: "Settings", href: `/dashboard/admin/settings`, icon: Settings },
    ];

    const lpItems = [
        { name: "Dashboard", href: `/dashboard/lp`, icon: LayoutDashboard },
        { name: "My Assets", href: `/dashboard/lp/pools`, icon: Layers },
        { name: "Staking Providers", href: `/dashboard/lp/providers`, icon: Users },
        { name: "Liquid Staking", href: `/dashboard/lp/active`, icon: Zap, badge: "Beta" },
        { name: "Calculator", href: `/dashboard/lp/calculator`, icon: Calculator },
        { name: "Settings", href: `/dashboard/lp/settings`, icon: Settings },
    ];

    const userItems = [
        { name: "My Policies", href: `/dashboard/user`, icon: Shield },
        { name: "My Profile", href: `/dashboard/user/profile`, icon: Users },
        { name: "Purchase Coverage", href: `/dashboard/user/purchase`, icon: Layers },
        { name: "Claims", href: `/dashboard/user/claims`, icon: FileText },
        { name: "Support", href: `/dashboard/user/support`, icon: LifeBuoy },
        { name: "Settings", href: `/dashboard/user/settings`, icon: Settings },
    ];

    const navItems = role === "admin" ? adminItems : role === "lp" ? lpItems : userItems;

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`${styles.overlay} ${isOpen ? styles.showOverlay : ""}`}
                onClick={onClose}
            />
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
                <div className={styles.logoContainer}>
                    <Shield size={24} className="text-white" fill="white" />
                    <span className={styles.logoText}>Hima</span>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                            >
                                <Icon size={18} />
                                {item.name}
                                {/* @ts-ignore */}
                                {item.badge && <span className={styles.badge}>{item.badge}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.promoCard}>
                    <div className={styles.promoContent}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Bolt size={16} fill="#fbbf24" className={styles.boltIcon} />
                            <h3 className={styles.promoTitle}>Activate Super</h3>
                        </div>
                        <p className={styles.promoText}>Unlock all features on Hima</p>
                    </div>
                </div>
            </aside>
        </>
    );
}
