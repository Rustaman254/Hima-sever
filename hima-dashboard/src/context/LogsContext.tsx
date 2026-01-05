"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface Log {
    type: string;
    message: string;
    timestamp: string;
    userId?: string;
    metadata?: any;
}

interface LogsContextType {
    logs: Log[];
    isConnected: boolean;
    clearLogs: () => void;
}

const LogsContext = createContext<LogsContextType>({
    logs: [],
    isConnected: false,
    clearLogs: () => { },
});

export const useLogs = () => useContext(LogsContext);

export const LogsProvider = ({ children }: { children: React.ReactNode }) => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let eventSource: EventSource | null = null;

        const connect = () => {
            console.log("Connecting to log stream...");
            eventSource = new EventSource("http://localhost:8100/api/logs/stream");

            eventSource.onopen = () => {
                console.log("Log stream connected");
                setIsConnected(true);
            };

            eventSource.onmessage = (event) => {
                try {
                    const log = JSON.parse(event.data);
                    setLogs((prev) => [log, ...prev].slice(0, 500)); // Keep last 500 logs
                } catch (error) {
                    console.error("Error parsing log:", error);
                }
            };

            eventSource.onerror = (error) => {
                console.error("Log stream error:", error);
                setIsConnected(false);
                eventSource?.close();
                // Reconnect after 3 seconds
                setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, []);

    const clearLogs = () => setLogs([]);

    return (
        <LogsContext.Provider value={{ logs, isConnected, clearLogs }}>
            {children}
        </LogsContext.Provider>
    );
};
