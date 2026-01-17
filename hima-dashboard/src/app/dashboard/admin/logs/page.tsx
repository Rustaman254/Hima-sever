"use client";

import { useState, useEffect } from "react";
import { Activity, Clock, Terminal, ChevronRight, Loader2, Wifi } from "lucide-react";
// @ts-ignore
import tableStyles from "@/components/dashboard/tables.module.css";
import { useLogs } from "@/context/LogsContext";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

export default function AdminLogs() {
    const { logs: liveLogs, isConnected } = useLogs();
    const router = useRouter();
    const [historicalLogs, setHistoricalLogs] = useState<any[]>([]);
    const [selectedFilter, setSelectedFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);

    // Merge live and historical, deduplicating by _id or timestamp
    const allLogs = [...liveLogs, ...historicalLogs].filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i).sort((a, b) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime());

    // Filtered view
    const displayedLogs = selectedFilter === "ALL" ? allLogs : allLogs.filter(l => l.type === selectedFilter);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                // Fetch historical logs
                const res = await fetch(`${API_BASE_URL}/api/logs?limit=100&type=${selectedFilter}`);
                const data = await res.json();
                if (data.success) {
                    setHistoricalLogs(data.logs);
                }
            } catch (error) {
                console.error("Logs fetch failed:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [selectedFilter]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                {[
                    { label: 'Live Events', val: displayedLogs.length > 0 ? displayedLogs.length.toString() : '...', icon: <Terminal size={18} /> },
                    { label: 'Connection Status', val: isConnected ? 'Online' : 'Offline', icon: <Wifi size={18} color={isConnected ? '#22c55e' : '#ef4444'} /> },
                    { label: 'System Health', val: '99.9%', icon: <Activity size={18} /> }
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected ? '#22c55e' : '#ef4444', boxShadow: isConnected ? '0 0 8px #22c55e' : 'none' }}></div>
                        <h3 style={{ fontWeight: 700, color: 'white' }}>Real-time Audit Logs</h3>

                        {/* Filters */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '2rem' }}>
                            {['ALL', 'WEBHOOK', 'SYSTEM', 'ERROR'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setSelectedFilter(filter)}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        background: selectedFilter === filter ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                                        color: selectedFilter === filter ? 'white' : '#9CA3AF',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/admin/terminal')}
                        style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Terminal size={14} />
                        View Advanced Terminal
                    </button>
                </div>

                {loading && displayedLogs.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" color="#8b5cf6" size={40} style={{ margin: '0 auto' }} />
                        <p style={{ marginTop: '1rem', color: '#64748b' }}>Establishing secure connection...</p>
                    </div>
                ) : (displayedLogs.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                        {isConnected ? `No ${selectedFilter.toLowerCase()} logs found.` : "Connecting to stream..."}
                    </div>
                ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <table className={tableStyles.table}>
                            <thead style={{ position: 'sticky', top: 0, background: 'hsl(var(--card))', zIndex: 10 }}>
                                <tr>
                                    <th className={tableStyles.th}>Event Type</th>
                                    <th className={tableStyles.th}>Message/Details</th>
                                    <th className={tableStyles.th}>Target User</th>
                                    <th className={tableStyles.th}>Reference</th>
                                    <th className={tableStyles.th}>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedLogs.map((log, i) => (
                                    <tr key={i} className={tableStyles.tr} style={{ animation: i === 0 ? 'fadeIn 0.5s ease' : 'none' }}>
                                        <td className={tableStyles.td}>
                                            <div style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '2rem',
                                                background: log.type === 'WEBHOOK' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                                color: log.type === 'WEBHOOK' ? '#22c55e' : '#8b5cf6',
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
                                                {log.metadata?.txHash ? log.metadata.txHash.substring(0, 10) : (log.metadata ? 'DATA' : 'N/A')}
                                            </code>
                                        </td>
                                        <td className={tableStyles.td} style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

