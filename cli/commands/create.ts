// @ts-ignore
import path from "path";
// @ts-ignore
import fs from "fs-extra";
// @ts-ignore
import prompts from "prompts";
import open from "open";

const SCAFFOLD_BASE = path.resolve("scaffolding", "default");

export async function runCreate(
    type: string,
    name: string,
    options: any,
    config: any
) {
    const cwd = process.cwd();
    const targetDir = options.dirPath
        ? path.resolve(options.dirPath)
        : type === "app"
            ? path.join(cwd, name)
            : cwd;

    // 👉 Graphical setup
    if (options.graphical && type === "app") {
        const port = 8822;
        console.log(`Launching graphical setup at http://localhost:${port}`);

        const server = await import("../web/web-setup-server");
        await open(`http://localhost:${port}`);
        return; // Let the web-setup server handle the rest
    }

    // 👉 Interactive prompt
    if (options.interactive && type === "app") {
        const response = await prompts([
            {
                name: "features",
                type: "multiselect",
                message: "Which features to include?",
                choices: [
                    { title: "Edge", value: "edge" },
                    { title: "SSR", value: "ssr" },
                    { title: "Static", value: "static" }
                ]
            },
            {
                name: "useGit",
                type: "confirm",
                message: "Initialize Git repository?"
            },
            {
                name: "installDeps",
                type: "confirm",
                message: "Run pnpm install?"
            }
        ]);

        // extend config based on responses...
        config.features = response.features;
        config.git = response.useGit;
        config.install = response.installDeps;
    }

    // 👉 App scaffold
    if (type === "app") {
        await fs.copy(SCAFFOLD_BASE, targetDir);
        console.log(`🌀 App scaffolded to: ${targetDir}`);

        if (config.git) {
            await fs.writeFile(path.join(targetDir, ".gitignore"), "node_modules\n");
            await runCommand("git init", targetDir);
        }

        if (config.install) {
            await runCommand("pnpm install", targetDir);
        }

        return;
    }

    // 👉 Other types: component, page, module, store
    const subdirMap: Record<string, string> = {
        component: "src/components",
        page: "src/pages",
        module: "src/modules",
        plugin: "src/plugins",
        store: "src/stores"
    };

    const relPath = subdirMap[type];
    if (!relPath) {
        console.error(`❌ Unknown type: ${type}`);
        return;
    }

    const dest = path.join(targetDir, relPath, `${name}.archy.tsx`);
    await fs.ensureDir(path.dirname(dest));
    await fs.writeFile(dest, `<Template>\n  <div>${type}: ${name}</div>\n</Template>\n`);
    console.log(`✅ ${type} created: ${dest}`);
}

async function runCommand(cmd: string, cwd: string) {
    const { execSync } = await import("child_process");
    execSync(cmd, { cwd, stdio: "inherit" });
}
