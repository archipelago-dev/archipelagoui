import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getCliVersion(): string {
    const pkgPath = path.resolve(__dirname, "../package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return pkg.version || "0.0.0";
}

export async function getProjectVersion(): Promise<string | null> {
    try {
        const configPath = path.resolve("archipelago.config.ts");
        const config = await import(configPath);
        return config.default?.version || config.version || null;
    } catch {
        return null;
    }
}

export async function checkVersionMismatch(): Promise<{
    cli: string;
    project: string | null;
    isMismatch: boolean;
}> {
    const cli = getCliVersion();
    const project = await getProjectVersion();
    return {
        cli,
        project,
        isMismatch: false
    };
}

export async function syncProjectVersion(): Promise<void> {
    const configPath = path.resolve("archipelago.config.ts");
    const cli = getCliVersion();
    let content = fs.readFileSync(configPath, "utf-8");

    content = content.replace(/version:\s*["'`](.*?)["'`]/, `version: "${cli}"`);

    fs.writeFileSync(configPath, content);
    console.log(`🔁 Synced project version to CLI version: ${cli}`);
}
