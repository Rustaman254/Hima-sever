"use client";

import { useState } from "react";
import { FileText, Clock, CheckCircle2, AlertCircle, FilePlus, Search } from "lucide-react";
// @ts-ignore
import tableStyles from "@/components/dashboard/tables.module.css";
import { toast } from "sonner";

const CLAIMS = [
    { id: "#CLM-4821", pool: "Crop Failure Protect", date: "Oct 12, 2025", amount: "$1,200", status: "Approved" },
    { id: "#CLM-5201", pool: "Drought Insurance", date: "Nov 05, 2025", amount: "$3,450", status: "Pending" },
    { id: "#CLM-3104", pool: "Flood Guard", date: "Sep 20, 2025", amount: "$800", status: "Paid" },
];

export default function UserClaims() {
    const handleNewClaim = () => {
        toast.info("Uploading evidence to IPFS...");
        setTimeout(() => {
            toast.success("Claim submitted. You will be notified once the Oracle verifies the data.");
        }, 2000);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Claims Center</h1>
                    <p style={{ color: '#94a3b8' }}>Monitor and file your insurance claims.</p>
                </div>
                <button className="btn btn-primary" onClick={handleNewClaim}>
                    <FilePlus size={18} /> File New Claim
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Pending Review', val: '1', color: '#fbbf24', icon: <Clock size={16} /> },
                    { label: 'Approved & Paid', val: '2', color: '#4ade80', icon: <CheckCircle2 size={16} /> },
                    { label: 'Total Payouts', val: '$2,000', color: '#8b5cf6', icon: <FileText size={16} /> }
                ].map((stat, i) => (
                    <div key={i} style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: `${stat.color}15`, color: stat.color, padding: '0.75rem', borderRadius: '1rem' }}>{stat.icon}</div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{stat.val}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className={tableStyles.tableContainer}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ fontWeight: 700, color: 'white' }}>Claim History</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-glass" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Filter</button>
                    </div>
                </div>
                <table className={tableStyles.table}>
                    <thead>
                        <tr>
                            <th className={tableStyles.th}>Claim ID</th>
                            <th className={tableStyles.th}>Insurance Pool</th>
                            <th className={tableStyles.th}>Date Filed</th>
                            <th className={tableStyles.th}>Amount</th>
                            <th className={tableStyles.th}>Status</th>
                            <th className={tableStyles.th}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {CLAIMS.map((claim) => (
                            <tr key={claim.id} className={tableStyles.tr}>
                                <td className={tableStyles.td} style={{ color: '#8b5cf6', fontWeight: 700 }}>{claim.id}</td>
                                <td className={tableStyles.td}>{claim.pool}</td>
                                <td className={tableStyles.td} style={{ color: '#6B7280' }}>{claim.date}</td>
                                <td className={tableStyles.td} style={{ fontWeight: 600 }}>{claim.amount}</td>
                                <td className={tableStyles.td}>
                                    <span className={`${tableStyles.statusBadge} ${claim.status === 'Approved' ? tableStyles.statusActive : claim.status === 'Paid' ? tableStyles.statusActive : tableStyles.statusPending}`}>
                                        {claim.status}
                                    </span>
                                </td>
                                <td className={tableStyles.td}>
                                    <button style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '0.75rem' }}>Details</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
