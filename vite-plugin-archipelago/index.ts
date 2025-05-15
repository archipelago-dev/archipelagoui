import { Plugin } from "vite";
import * as fs from "fs";
import * as path from "path";

const SYNTAX_DIR = path.resolve("syntax");
const STUB_DIR = path.join(SYNTAX_DIR, "stubs");
const COMPONENTS_JSON = path.join(SYNTAX_DIR, "components.json");

export default function ArchipelagoPlugin(): Plugin {
    return {
        name: "vite-plugin-archipelago",
        enforce: "pre",
        config(config, env) {
            console.log("✅ Archipelago plugin loaded (env:", env.mode + ")");
        },
        resolveId(id) {
            if (id === "virtual:archipelago-components") return id;
        },
        load(id) {
            if (id === "virtual:archipelago-components") {
                const meta = JSON.parse(fs.readFileSync(COMPONENTS_JSON, "utf-8"));
                const imports: string[] = [];
                const exports: string[] = [];

                for (const tag in meta) {
                    const file = `${tag}.ts`;
                    const fullPath = `./stubs/${file}`;
                    if (fs.existsSync(path.join(STUB_DIR, file))) {
                        imports.push(`import { ${tag} } from "${fullPath}";`);
                        exports.push(`"${tag}": ${tag}`);
                    }
                }

                // LazyImport split
                imports.push(`import { LazyImportAsync } from "./stubs/LazyImportAsync";`);
                imports.push(`import { LazyImportSync } from "./stubs/LazyImportSync";`);
                exports.push(`"LazyImportAsync": LazyImportAsync`);
                exports.push(`"LazyImportSync": LazyImportSync`);

                return `
${imports.join("\n")}

export const ArchipelagoComponentRegistry = {
  ${exports.join(",\n  ")}
};
`;
            }
        }
    };
}
