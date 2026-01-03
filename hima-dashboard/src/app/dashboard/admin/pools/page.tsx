"use client";

import { useState } from "react";
import { Search, Plus, Filter, MoreVertical, Shield, Wheat, Sprout } from "lucide-react";
// @ts-ignore
import styles from "./admin.module.css";
// @ts-ignore
import tableStyles from "@/components/dashboard/tables.module.css";
import { Modal } from "@/components/ui/SharedUI";
import { toast } from "sonner";

const POOLS_DATA = [
    { id: 1, name: "Farmer Mutual (ETH)", type: "Coverage", tvl: "$2.9M", yield: "13.62%", status: "Healthy", icon: <Shield size={18} /> },
    { id: 2, name: "Crop Yield Chain", type: "Risk", tvl: "$2.0M", yield: "12.72%", status: "Risk", icon: <Wheat size={18} /> },
    { id: 3, name: "Drought Protect", type: "Coverage", tvl: "$0.9M", yield: "6.29%", status: "Healthy", icon: <Sprout size={18} /> },
    { id: 4, name: "Flood Guard Elite", type: "Premium", tvl: "$4.1M", yield: "8.50%", status: "Healthy", icon: <Shield size={18} /> },
];

export default function AdminPools() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreatePool = () => {
        toast.success("Initializing new insurance pool...");
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className={tableStyles.searchHeader}>
                <div className={tableStyles.searchBox}>
                    <Search size={18} />
                    <input type="text" placeholder="Search pool by name or type..." />
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} /> New Pool
                </button>
            </div>

            <div className={tableStyles.tableContainer}>
                <table className={tableStyles.table}>
                    <thead>
                        <tr>
                            <th className={tableStyles.th}>Pool Name</th>
                            <th className={tableStyles.th}>Category</th>
                            <th className={tableStyles.th}>Total Value Locked</th>
                            <th className={tableStyles.th}>Yield</th>
                            <th className={tableStyles.th}>Status</th>
                            <th className={tableStyles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {POOLS_DATA.map((pool) => (
                            <tr key={pool.id} className={tableStyles.tr}>
                                <td className={tableStyles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '0.5rem' }}>{pool.icon}</div>
                                        {pool.name}
                                    </div>
                                </td>
                                <td className={tableStyles.td}>{pool.type}</td>
                                <td className={tableStyles.td}>{pool.tvl}</td>
                                <td className={tableStyles.td} style={{ color: '#4ade80', fontWeight: 600 }}>{pool.yield}</td>
                                <td className={tableStyles.td}>
                                    <span className={`${tableStyles.statusBadge} ${pool.status === 'Healthy' ? tableStyles.statusActive : tableStyles.statusRisk}`}>
                                        {pool.status}
                                    </span>
                                </td>
                                <td className={tableStyles.td}><MoreVertical size={16} color="#6B7280" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Insurance Pool">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#9CA3AF' }}>Pool Name</label>
                        <input type="text" className="input" placeholder="e.g. Cyclone Relief" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#9CA3AF' }}>Category</label>
                            <select className="input"><option>Coverage</option><option>Risk</option></select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#9CA3AF' }}>Initial APY (%)</label>
                            <input type="number" className="input" placeholder="12.5" />
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={handleCreatePool}>Deploy Pool Contract</button>
                </div>
            </Modal>
        </div>
    );
}
