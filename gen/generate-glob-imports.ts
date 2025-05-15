#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import chokidar from "chokidar";

const inputDir = path.resolve(process.argv[2] || "components");
const outputFile = path.resolve("syntax/components.generated.ts");

function normalizeTagName(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9]/g, " ")
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");
}

function runGeneration() {
    function scan(dir: string, prefix = ""): [string, string][] {
        const imports: [string, string][] = [];

        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const sub = prefix + entry.name[0].toUpperCase() + entry.name.slice(1);
                imports.push(...scan(fullPath, sub));
            } else if (entry.name.endsWith(".archy.tsx")) {
                const base = path.basename(entry.name, ".archy.tsx");
                const tag = normalizeTagName(prefix + base);
                const rel = "./" + path.relative(path.dirname(outputFile), fullPath).replace(/\\/g, "/").replace(/\.tsx$/, "");
                imports.push([tag, rel]);
            }
        }

        return imports;
    }

    const entries = scan(inputDir);

    const output = [
        "// AUTO-GENERATED FILE. DO NOT EDIT.",
        ...entries.map(([name, path]) => `export { default as ${name} } from "${path}";`)
    ];

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, output.join("\n") + "\n");
    console.log(`✅ Component imports → ${outputFile}`);
}

if (process.argv.includes("--watch")) {
    chokidar.watch(`${inputDir}/**/*.archy.tsx`).on("change", runGeneration).on("add", runGeneration);
    console.log("👀 Watching for components...");
    runGeneration();
} else {
    runGeneration();
}
