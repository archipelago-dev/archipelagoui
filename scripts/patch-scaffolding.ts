// @ts-nocheck
import fs from "fs";
import path from "path";

const BASE = path.resolve("scaffolding");
const TEMPLATE = {
    compilerOptions: {
        target: "ES2020",
        module: "ESNext",
        moduleResolution: "Node",
        jsx: "react-jsx",
        strict: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        types: ["vite/client"],
        baseUrl: ".",
        paths: {
            "@archipelagoui/*": ["../../core-libs/*/src"]
        }
    },
    include: ["src"]
};

for (const folder of fs.readdirSync(BASE)) {
    const projectPath = path.join(BASE, folder);
    const configPath = path.join(projectPath, "tsconfig.json");
    const stat = fs.statSync(projectPath);
    if (!stat.isDirectory()) continue;

    fs.writeFileSync(configPath, JSON.stringify(TEMPLATE, null, 2));
    console.log(`✅ Patched: scaffolding/${folder}/tsconfig.json`);
}
