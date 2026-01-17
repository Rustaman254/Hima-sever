import fs from 'fs';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'server.log');

export const fileLogger = {
    log: (message: string, level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG' = 'INFO') => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}\n`;

        // Also log to console for development visibility
        if (level === 'ERROR') {
            console.error(logMessage.trim());
        } else {
            console.log(logMessage.trim());
        }

        try {
            // Disable file logging on Vercel as the filesystem is read-only
            if (process.env.VERCEL !== '1') {
                fs.appendFileSync(logFilePath, logMessage);
            }
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
};
