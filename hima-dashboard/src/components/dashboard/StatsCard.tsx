import { LucideIcon } from "lucide-react";
// @ts-ignore
import styles from "./stats-card.module.css";

interface StatsCardProps {
    title: string;
    value: string;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export default function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <span className={styles.title}>{title}</span>
                <Icon size={20} className={styles.icon} />
            </div>
            <div className={styles.content}>
                <div className={styles.value}>
                    {value}
                    {trend && (
                        <span className={`${styles.trend} ${trend.isPositive ? styles.trendUp : styles.trendDown}`}>
                            {trend.isPositive ? "+" : "-"}{trend.value}%
                        </span>
                    )}
                </div>
                {description && <p className={styles.description}>{description}</p>}
            </div>
        </div>
    );
}
