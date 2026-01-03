"use client";

import { Search, UserCheck, ShieldCheck, MoreVertical, Mail } from "lucide-react";
// @ts-ignore
import tableStyles from "@/components/dashboard/tables.module.css";

const PROVIDERS = [
    { id: 1, name: "Global Reinsurance", level: "L3", liquidity: "$1.2M", earned: "$45k", status: "Verified" },
    { id: 2, name: "Nexus Mutual DAO", level: "L3", liquidity: "$5.8M", earned: "$210k", status: "Verified" },
    { id: 3, name: "Mantle Core", level: "L2", liquidity: "$850k", earned: "$32k", status: "Pending" },
    { id: 4, name: "Hima Ops LP", level: "L1", liquidity: "$240k", earned: "$12k", status: "Verified" },
];

export default function AdminProviders() {
    return (
        <div>
            <div className={tableStyles.searchHeader}>
                <div className={tableStyles.searchBox}>
                    <Search size={18} />
                    <input type="text" placeholder="Search liquidity providers..." />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-glass">Export CSV</button>
                    <button className="btn btn-primary"><UserCheck size={18} /> Verify New LP</button>
                </div>
            </div>

            <div className={tableStyles.tableContainer}>
                <table className={tableStyles.table}>
                    <thead>
                        <tr>
                            <th className={tableStyles.th}>Provider Name</th>
                            <th className={tableStyles.th}>Level</th>
                            <th className={tableStyles.th}>Total Liquidity</th>
                            <th className={tableStyles.th}>Fees Earned</th>
                            <th className={tableStyles.th}>Trust Status</th>
                            <th className={tableStyles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {PROVIDERS.map((lp) => (
                            <tr key={lp.id} className={tableStyles.tr}>
                                <td className={tableStyles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '2rem', height: '2rem', background: '#3b82f633', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 700 }}>{lp.name[0]}</div>
                                        {lp.name}
                                    </div>
                                </td>
                                <td className={tableStyles.td}>{lp.level}</td>
                                <td className={tableStyles.td}>{lp.liquidity}</td>
                                <td className={tableStyles.td}>{lp.earned}</td>
                                <td className={tableStyles.td}>
                                    <span className={`${tableStyles.statusBadge} ${lp.status === 'Verified' ? tableStyles.statusActive : tableStyles.statusPending}`}>
                                        {lp.status}
                                    </span>
                                </td>
                                <td className={tableStyles.td}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><Mail size={16} /></button>
                                        <button style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><MoreVertical size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
