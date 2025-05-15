// @ts-nocheck
import fs from "fs";
import path from "path";

const BASE_DIR = path.resolve("core-libs");
const TEMPLATE = {
    compilerOptions: {
        target: "ES2020",
        module: "ESNext",
        moduleResolution: "Node",
        outDir: "dist",
        rootDir: "src",
        declaration: true,
        declarationDir: "dist",
        esModuleInterop: true,
        strict: true,
        jsx: "react-jsx",
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        incremental: false
    },
    include: ["src"]
};

fs.readdirSync(BASE_DIR).forEach((folder) => {
    const dir = path.join(BASE_DIR, folder);
    const configPath = path.join(dir, "tsconfig.build.json");

    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
    fs.writeFileSync(configPath, JSON.stringify(TEMPLATE, null, 2));
    console.log(`✅ Updated: ${folder}/tsconfig.build.json`);
});
