import { ArrowUpRight, Wallet, Lock } from "lucide-react";
// @ts-ignore
import styles from "./cards.module.css";

interface PoolCardProps {
    icon: any; // SVG or string
    name: string;
    type: string;
    apy: string;
    trend: string;
    isPositive: boolean;
    tvl: string;
}

export function PoolCard({ icon, name, type, apy, trend, isPositive, tvl }: PoolCardProps) {
    return (
        <div className={styles.poolCard}>
            <div className={styles.cardHeader}>
                <div>
                    <div className={styles.iconWrapper}>
                        {icon}
                    </div>
                    <span className={styles.badge}>{type}</span>
                    <h3 className={styles.poolName}>{name}</h3>
                </div>
                <div className={styles.arrowIcon}>
                    <ArrowUpRight size={16} />
                </div>
            </div>

            <div className={styles.metrics}>
                <span className={styles.label}>Reward Rate</span>
                <div className={styles.apy}>{apy}%</div>
                <div className={`${styles.trend} ${isPositive ? styles.trendUp : styles.trendDown}`}>
                    {isPositive ? '↑' : '↓'} {trend}
                </div>
            </div>

            <div className={styles.chartArea}>
                {/* Simple SVG Sparkline */}
                <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <path
                        d={isPositive ? "M0 35 Q 20 30, 40 20 T 100 5" : "M0 10 Q 30 20, 60 30 T 100 35"}
                        fill="none"
                        stroke={isPositive ? "#8b5cf6" : "#ef4444"}
                        strokeWidth="2"
                    />
                    <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={isPositive ? "#8b5cf6" : "#ef4444"} stopOpacity="0.2" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </linearGradient>
                    <path
                        d={isPositive ? "M0 35 Q 20 30, 40 20 T 100 5 V 40 H 0 Z" : "M0 10 Q 30 20, 60 30 T 100 35 V 40 H 0 Z"}
                        fill="url(#grad)"
                        stroke="none"
                    />
                </svg>
                <span style={{ position: 'absolute', bottom: 0, right: 0, fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0' }}>
                    +{tvl}
                </span>
            </div>
        </div>
    );
}

export function PortfolioCard() {
    return (
        <div className={styles.portfolioCard}>
            <div className={styles.glow} />

            <div className={styles.portfolioHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'white' }}>Hima</span>
                    <span style={{ fontSize: '0.75rem', color: '#e2e8f0' }}>®</span>
                </div>
                <span className={styles.tag}>New</span>
            </div>

            <h2 className={styles.portfolioTitle}>Liquidity Portfolio</h2>
            <p className={styles.portfolioDesc}>
                An all-in-one portfolio that helps you maximize improved yields from Hima's insurance pools.
            </p>

            <div className={styles.actions}>
                <button className={styles.connectBtn}>
                    Connect with Wallet <Wallet size={16} />
                </button>
                <button className={styles.addressBtn}>
                    Enter a Wallet Address <Lock size={14} />
                </button>
            </div>
        </div>
    );
}
