import fs from "fs";
import path from "path";

const HISTORY_PATH = path.resolve(process.env.HOME || "~", ".archipelago/history.log");

export async function logHistory(cmd: string) {
    const line = `[${new Date().toISOString()}] ${cmd}\n`;
    await fs.promises.mkdir(path.dirname(HISTORY_PATH), { recursive: true });
    await fs.promises.appendFile(HISTORY_PATH, line);
}
