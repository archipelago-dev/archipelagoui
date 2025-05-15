import path from "path";

export async function loadConfig(): Promise<any> {
    const configPath = path.resolve("archipelago.config.ts");
    try {
        const config = await import(configPath);
        return config.default ?? config;
    } catch {
        return {};
    }
}
