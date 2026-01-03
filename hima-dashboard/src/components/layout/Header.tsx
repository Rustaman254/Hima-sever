"use client";

import { Bell, Search, Settings, ChevronDown, LogOut, User as UserIcon, Menu } from "lucide-react";
// @ts-ignore
import styles from "./header.module.css";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as auth from "@/lib/auth";

export default function Header({ role, onMenuClick }: { role: string, onMenuClick?: () => void }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        toast.info("Logging out...");
        auth.removeToken();
        setTimeout(() => router.push("/"), 1000);
    };

    const user = auth.getUser();
    const displayName = user?.name || (role === "admin" ? "Hima Admin" : role === "lp" ? "Ryan Partner" : "John User");

    return (
        <header className={styles.header}>
            <button className={styles.menuBtn} onClick={onMenuClick}>
                <Menu size={24} />
            </button>
            <div className={styles.leftSection}>
                {/* User Profile Pill */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <div className={styles.profilePill} onClick={() => setIsProfileOpen(!isProfileOpen)}>
                        <div className={styles.avatar}>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${role}`} alt="avatar" />
                        </div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{displayName}</span>
                            <span className={styles.userBadge}>{role.toUpperCase()} PRO</span>
                        </div>
                        <ChevronDown size={14} className="text-gray-400" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>

                    {isProfileOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '110%',
                            left: 0,
                            width: '220px',
                            background: 'rgba(21, 26, 35, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '1rem',
                            padding: '0.5rem',
                            zIndex: 200,
                            boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.5)'
                        }}>
                            <button style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                <UserIcon size={16} color="#6B7280" /> Profile Settings
                            </button>
                            <button style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                <Settings size={16} color="#6B7280" /> Preferences
                            </button>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }} />
                            <button
                                onClick={handleLogout}
                                style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <button className={styles.depositBtn}>
                    {role === 'user' ? 'Top up Wallet' : 'Deposit'}
                    <span className={styles.lockIcon}>🔒</span>
                </button>
            </div>

            <div className={styles.rightSection}>
                <div className={styles.iconBtn}>
                    <span className={styles.notificationDot}>2</span>
                    <Bell size={18} />
                </div>

                <div className={styles.searchBar}>
                    <Search size={16} className="text-gray-500" />
                    <input type="text" placeholder="Explore resources..." />
                    <span className={styles.shortcutKey}>/</span>
                </div>

                <div className={styles.iconBtn}>
                    <Settings size={18} />
                </div>
            </div>
        </header>
    );
}
