"use client";

import { Search, Shield, Zap, Globe, MoreVertical, BadgeCheck } from "lucide-react";
// @ts-ignore
import tableStyles from "@/components/dashboard/tables.module.css";
import { Dropdown } from "@/components/ui/SharedUI";
import { toast } from "sonner";

const STAKING_PROVIDERS = [
    { id: 1, name: "Nexus Mutual", score: "98/100", apy: "14.2%", capacity: "$50.2M", region: "Global" },
    { id: 2, name: "Etheros Liquid", score: "92/100", apy: "11.5%", capacity: "$18.4M", region: "Europe" },
    { id: 3, name: "Avalanche Stake", score: "95/100", apy: "13.1%", capacity: "$8.9M", region: "NA" },
    { id: 4, name: "Mantle Core", score: "88/100", apy: "9.8%", capacity: "$45.0M", region: "Asia" },
];

export default function LPStaking() {

    const handleStake = (name: string) => {
        toast.success(`Redirecting to ${name} delegation dashboard...`);
    };

    return (
        <div>
            <div className={tableStyles.searchHeader}>
                <div className={tableStyles.searchBox}>
                    <Search size={18} />
                    <input type="text" placeholder="Search delegated providers..." />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Dropdown label="Sort by APY" options={['Highest', 'Lowest']} onSelect={() => { }} />
                    <Dropdown label="Region" options={['Global', 'Asia', 'NA', 'Europe']} onSelect={() => { }} />
                </div>
            </div>

            <div className={tableStyles.tableContainer}>
                <table className={tableStyles.table}>
                    <thead>
                        <tr>
                            <th className={tableStyles.th}>Provider</th>
                            <th className={tableStyles.th}>Safety Score</th>
                            <th className={tableStyles.th}>Native APY</th>
                            <th className={tableStyles.th}>Total Capacity</th>
                            <th className={tableStyles.th}>HQ Region</th>
                            <th className={tableStyles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {STAKING_PROVIDERS.map((lp) => (
                            <tr key={lp.id} className={tableStyles.tr}>
                                <td className={tableStyles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '2rem', height: '2rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem' }}><BadgeCheck size={16} /></div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600 }}>{lp.name}</span>
                                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Verified Institution</span>
                                        </div>
                                    </div>
                                </td>
                                <td className={tableStyles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ height: '4px', width: '40px', background: 'rgba(34,197,94,0.1)', borderRadius: '2px' }}><div style={{ width: '90%', height: '100%', background: '#4ade80', borderRadius: '2px' }}></div></div>
                                        <span style={{ color: '#4ade80', fontWeight: 700 }}>{lp.score}</span>
                                    </div>
                                </td>
                                <td className={tableStyles.td} style={{ color: 'white', fontWeight: 600 }}>{lp.apy}</td>
                                <td className={tableStyles.td}>{lp.capacity}</td>
                                <td className={tableStyles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b' }}><Globe size={14} /> {lp.region}</div>
                                </td>
                                <td className={tableStyles.td}>
                                    <button className="btn btn-glass" onClick={() => handleStake(lp.name)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Stake Now <Zap size={12} fill="currentColor" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
