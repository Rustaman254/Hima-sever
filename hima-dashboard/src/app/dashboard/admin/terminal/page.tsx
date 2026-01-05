"use client";

import { useLogs } from "@/context/LogsContext";
import { Terminal, ArrowLeft, Wifi, Bug } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function TerminalPage() {
    const { logs, isConnected, clearLogs } = useLogs();
    const router = useRouter();
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '85vh', background: '#09090b', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>

            {/* Toolbar */}
            <div style={{ padding: '0.75rem 1rem', background: '#18181b', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => router.back()}
                        style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div style={{ width: '1px', height: '20px', background: '#3f3f46' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Terminal size={14} />
                        HIMA_SYSTEM_TERMINAL
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: isConnected ? '#22c55e' : '#ef4444' }}>
                        <Wifi size={14} />
                        {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                    </div>
                    <button
                        onClick={clearLogs}
                        style={{ padding: '0.25rem 0.5rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '4px', color: '#e4e4e7', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                        CLEAR
                    </button>
                </div>
            </div>

            {/* Terminal Output */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', fontFamily: '"Fira Code", monospace', fontSize: '0.85rem' }}>
                <div style={{ color: '#71717a', marginBottom: '1rem' }}>
                    Last login: {new Date().toLocaleString()} on ttys001<br />
                    Hima System Kernel v2.4.0 active...<br />
                    Listening for websocket events on port 8100...
                </div>

                {logs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '0.5rem', wordBreak: 'break-all' }}>
                        <span style={{ color: '#71717a' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                        <span style={{ color: log.type === 'WEBHOOK' ? '#f59e0b' : log.type === 'SYSTEM' ? '#3b82f6' : '#22c55e', fontWeight: 700 }}>
                            {log.type}
                        </span>{' '}
                        <span style={{ color: '#e4e4e7' }}>{log.message}</span>
                        {log.metadata && (
                            <div style={{ marginLeft: '1rem', color: '#52525b', fontSize: '0.75rem' }}>
                                {JSON.stringify(log.metadata, null, 2)}
                            </div>
                        )}
                    </div>
                ))}

                {/* Simulated Cursor */}
                <div ref={bottomRef} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    <span style={{ color: '#22c55e' }}>root@hima:~$</span> <span className="cursor" style={{ width: '8px', height: '16px', background: '#22c55e' }}></span>
                </div>
            </div>

            <style jsx>{`
                .cursor {
                    animation: blink 1s step-end infinite;
                }
                @keyframes blink {
                    50% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}
