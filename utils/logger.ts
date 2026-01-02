import fs from 'fs';
import path from 'path';

export function logDebug(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
    const logPath = path.join(process.cwd(), 'debug.log');

    try {
        fs.appendFileSync(logPath, logMessage);
    } catch (err) {
        console.error('Failed to write to debug.log:', err);
    }
}
