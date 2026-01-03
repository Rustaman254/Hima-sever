"use client";

import { useState, useEffect } from "react";
import { Activity, Clock, Terminal, ChevronRight, Loader2 } from "lucide-react";
// @ts-ignore
import tableStyles from "@/components/dashboard/tables.module.css";

export default function AdminLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch("http://localhost:8100/api/insurance/admin/logs");
                const data = await res.json();
                if (data.success) {
                    setLogs(data.logs);
                }
            } catch (error) {
                console.error("Logs fetch failed:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                {[
                    { label: 'Total Events', val: logs.length > 0 ? logs.length.toString() : '...', icon: <Terminal size={18} /> },
                    { label: 'Security Alerts', val: '0', icon: <Clock size={18} /> },
                    { label: 'Node Health', val: '99.9%', icon: <Activity size={18} /> }
                ].map((stat, i) => (
                    <div key={i} style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: '#6B7280', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{stat.val}</h3>
                        </div>
                        <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.75rem', borderRadius: '1rem', color: '#8b5cf6' }}>{stat.icon}</div>
                    </div>
                ))}
            </div>

            <div className={tableStyles.tableContainer}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ fontWeight: 700, color: 'white' }}>Live Audit Logs</h3>
                    <button style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View Advanced Terminal</button>
                </div>

                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" color="#8b5cf6" size={40} style={{ margin: '0 auto' }} />
                        <p style={{ marginTop: '1rem', color: '#64748b' }}>Establishing secure connection...</p>
                    </div>
                ) : (logs.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                        No system logs found for this period.
                    </div>
                ) : (
                    <table className={tableStyles.table}>
                        <thead>
                            <tr>
                                <th className={tableStyles.th}>Event Type</th>
                                <th className={tableStyles.th}>Message/Details</th>
                                <th className={tableStyles.th}>Target User</th>
                                <th className={tableStyles.th}>Reference</th>
                                <th className={tableStyles.th}>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log._id} className={tableStyles.tr}>
                                    <td className={tableStyles.td}>
                                        <div style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '2rem',
                                            background: 'rgba(139, 92, 246, 0.1)',
                                            color: '#8b5cf6',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            display: 'inline-block'
                                        }}>
                                            {log.type}
                                        </div>
                                    </td>
                                    <td className={tableStyles.td} style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                                        {log.message}
                                    </td>
                                    <td className={tableStyles.td} style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                        {log.userId ? `${log.userId.substring(0, 12)}...` : 'System'}
                                    </td>
                                    <td className={tableStyles.td}>
                                        <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', color: '#64748b' }}>
                                            {log.metadata?.txHash ? log.metadata.txHash.substring(0, 10) : 'N/A'}
                                        </code>
                                    </td>
                                    <td className={tableStyles.td} style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ))}
            </div>
        </div>
    );
}
