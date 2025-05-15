import fs from "fs";
import path from "path";

const HISTORY_PATH = path.resolve(process.env.HOME || "~", ".archipelago/history.log");

export async function runHistory(limit = 20) {
    if (!fs.existsSync(HISTORY_PATH)) {
        console.log("🗒️  No command history yet.");
        return;
    }

    const lines = fs.readFileSync(HISTORY_PATH, "utf-8").trim().split("\n");
    const recent = lines.slice(-limit);
    console.log(`📜 Last ${recent.length} CLI actions:\n`);
    for (const line of recent) {
        console.log("•", line);
    }
}
