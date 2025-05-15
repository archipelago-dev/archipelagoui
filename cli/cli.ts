#!/usr/bin/env node
import { Command } from "commander";
import { loadConfig } from "./utils/config.js";
import { checkForCliUpdates, applyCliUpdate } from "./utils/update.js";
import { logHistory } from "./utils/history.js";
import { runHistory } from "./commands/history.js";
import { runCreate } from "./commands/create.js";
import { runDev } from "./commands/dev.js";
import { runBuild } from "./commands/build.js";
import { runStart } from "./commands/start.js";
import { runVerify } from "./commands/verify.js";
import { runPreCompile } from "./commands/pre-compile.js";
import { runHydrate } from "./commands/hydrate.js";
import {runRender} from "./commands/render";
import {runServe} from "./commands/serve";

// 🌐 Auto-version check before anything else
(async () => {
    const { isOutdated, current, latest } = await checkForCliUpdates();
    if (!isOutdated) {
        console.log(`⚠️  Archipelago CLI update available: v${latest} (you have v${current})`);
        if (process.argv.includes("--update") || process.env.AUTO_UPDATE === "true") {
            await applyCliUpdate();
        } else {
            console.log(`💡 Run with --update or set AUTO_UPDATE=true to upgrade automatically.\n`);
        }
    }
})();

// CLI setup
const program = new Command();

program
    .name("archipelago")
    .description("Archipelago CLI – Modular Edge App Framework")
    .version("0.1.0");

program
    .command("create")
    .description("Create a new app, component, page, plugin, module or store")
    .argument("<type>", "Type to create")
    .argument("<name>", "Name of the entity")
    .option("--dir-path <path>", "Target directory")
    .option("--interactive", "Prompt mode")
    .option("--graphical", "Use browser-based graphical setup")
    .action(async (type, name, options) => {
        const config = await loadConfig();
        await runCreate(type, name, options, config);
        await logHistory(`create ${type} ${name}`);
    });

program
    .command("render")
    .description("Render a single .archy file or folder of .archy templates")
    .argument("<input>", "File or directory to render")
    .option("-o, --output <dir>", "Output directory", "dist/rendered")
    .option("-w, --watch", "Watch for changes and re-render")

    .action(async (input, opts) => {
        await runRender(input, opts.output);
        await logHistory(`render ${input}`);
    });

program
    .command("hydrate")
    .description("Run Archipelago JIT hydration with worker threads (browser mode)")
    .option("--debug", "Enable devtool overlay")
    .action(async (opts) => {
        await runHydrate(opts);
        await logHistory("hydrate");
    });

program
    .command('serve')
    .description('Start the backend server for VFS, stream, and API endpoints')
    .action(async () => {
        await runServe();
        await logHistory('serve');
    });

program.command("dev").description("Start dev server").action(async () => {
    await runDev();
    await logHistory("dev");
});

program
    .command("history")
    .description("View recent CLI command history")
    .option("-n, --limit <number>", "Number of entries", "20")
    .action(async (opts) => {
        await runHistory(Number(opts.limit));
    });

program.command("build").description("Build for production").action(async () => {
    await runBuild();
    await logHistory("build");
});

program.command("start").description("Start preview server").action(async () => {
    await runStart();
    await logHistory("start");
});

program.command("verify").description("Check config and structure").action(async () => {
    await runVerify();
    await logHistory("verify");
});

program.command("pre-compile").description("Run JSX/gen stubs").action(async () => {
    await runPreCompile();
    await logHistory("pre-compile");
});

program.parse();
