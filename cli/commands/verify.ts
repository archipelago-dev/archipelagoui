import fs from "fs";
import path from "path";

export async function runVerify() {
    const hasConfig = fs.existsSync(path.resolve("archipelago.config.ts"));
    const hasGlobalCSS = fs.existsSync(path.resolve("assets/global.css"));
    const hasSrc = fs.existsSync(path.resolve("src"));

    console.log("🔍 Verifying project structure...");
    if (!hasSrc) return console.error("❌ Missing: /src");
    if (!hasConfig) console.warn("⚠️  Missing: archipelago.config.ts");
    if (!hasGlobalCSS) console.warn("⚠️  Missing: assets/global.css");

    console.log("✅ Structure looks valid.");
}
