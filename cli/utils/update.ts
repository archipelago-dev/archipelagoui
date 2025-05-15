import { execSync } from "child_process";
import { getCliVersion } from "./version.js";
import https from "https";

export function detectPackageManager(): "pnpm" | "yarn" | "npm" {
    try {
        if (execSync("pnpm --version")) return "pnpm";
    } catch {}
    try {
        if (execSync("yarn --version")) return "yarn";
    } catch {}
    return "npm";
}

export async function checkForCliUpdates(): Promise<{
    current: string;
    latest: string;
    isOutdated: boolean;
}> {
    const current = getCliVersion();
    const latest = await getLatestFromNpm("archipelago");
    return {
        current,
        latest,
        isOutdated: current !== latest
    };
}

function getLatestFromNpm(pkg: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get(`https://registry.npmjs.org/${pkg}/latest`, (res) => {
            let data = "";
            res.on("data", (c) => (data += c));
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.version);
                } catch (e) {
                    reject(e);
                }
            });
        });
    });
}

export async function applyCliUpdate(pkg = "archipelago") {
    const manager = detectPackageManager();
    const cmd =
        manager === "pnpm"
            ? `pnpm add -g ${pkg}`
            : manager === "yarn"
                ? `yarn global add ${pkg}`
                : `npm install -g ${pkg}`;
    console.log(`⬆️  Updating CLI via: ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
}
