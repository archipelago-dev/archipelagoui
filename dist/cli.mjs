#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../node_modules/.pnpm/tsup@8.4.0_jiti@2.4.2_postcss@8.5.3_tsx@4.19.4_typescript@5.8.3/node_modules/tsup/assets/esm_shims.js
var init_esm_shims = __esm({
  "../node_modules/.pnpm/tsup@8.4.0_jiti@2.4.2_postcss@8.5.3_tsx@4.19.4_typescript@5.8.3/node_modules/tsup/assets/esm_shims.js"() {
    "use strict";
  }
});

// web/web-setup-server.ts
var web_setup_server_exports = {};
import express from "express";
import fs4 from "fs-extra";
import path5 from "path";
import bodyParser from "body-parser";
var PORT, app, TEMPLATE_DIR;
var init_web_setup_server = __esm({
  "web/web-setup-server.ts"() {
    "use strict";
    init_esm_shims();
    PORT = 8822;
    app = express();
    TEMPLATE_DIR = path5.resolve("scaffolding/default");
    app.use(bodyParser.json());
    app.use(express.static(path5.resolve("cli/web/public")));
    app.get("/api/modules", (req, res) => {
      res.json([
        { name: "auth-bridge", description: "ZKP auth module" },
        { name: "edge-share", description: "Edge mesh loader" },
        { name: "analytics", description: "Privacy-first analytics" }
      ]);
    });
    app.post("/api/create", async (req, res) => {
      const { name, features, modules } = req.body;
      const dest = path5.resolve(name);
      await fs4.copy(TEMPLATE_DIR, dest);
      const config2 = {
        name,
        features,
        modules
      };
      await fs4.writeFile(
        path5.join(dest, "archipelago.config.ts"),
        `export default ${JSON.stringify(config2, null, 2)}`
      );
      res.json({ status: "ok", location: dest });
    });
    app.post("/api/run", async (req, res) => {
      const { command } = req.body;
      const commands = ["dev", "build", "verify", "pre-compile", "start"];
      if (!commands.includes(command)) return res.status(400).json({ status: "invalid" });
      try {
        const { spawn: spawn2 } = await import("child_process");
        const proc = spawn2("pnpm", ["run", command], {
          cwd: process.cwd(),
          stdio: "inherit",
          shell: true
        });
        proc.on("exit", (code) => {
          res.json({ status: code === 0 ? "ok" : "fail", code });
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", error: err });
      }
    });
    app.get("/api/run-stream", (req, res) => {
      const { command } = req.query;
      if (!command || typeof command !== "string") {
        return res.status(400).send("Missing command");
      }
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      });
      const { spawn: spawn2 } = __require("child_process");
      const child = spawn2("pnpm", ["run", command], {
        cwd: process.cwd(),
        shell: true
      });
      child.stdout.on("data", (data) => {
        res.write(`event: stdout
data: ${data.toString().trim()}

`);
      });
      child.stderr.on("data", (data) => {
        res.write(`event: stderr
data: ${data.toString().trim()}

`);
      });
      child.on("exit", (code) => {
        res.write(`event: stdout
data: \u274C process exited with code ${code}

`);
        res.write("event: close\ndata: done\n\n");
        res.end();
      });
      req.on("close", () => {
        child.kill("SIGTERM");
      });
    });
    app.listen(PORT, () => {
      console.log(`\u{1F680} Graphical setup ready at http://localhost:${PORT}`);
    });
  }
});

// ../core/devtools/hydration-dev-overlay.ts
var hydration_dev_overlay_exports = {};
__export(hydration_dev_overlay_exports, {
  HydrationDevOverlay: () => HydrationDevOverlay
});
var HydrationDevOverlay;
var init_hydration_dev_overlay = __esm({
  "../core/devtools/hydration-dev-overlay.ts"() {
    "use strict";
    init_esm_shims();
    HydrationDevOverlay = class {
      static panel = null;
      static logList = null;
      static visible = false;
      static init() {
        if (this.panel) return;
        this.panel = document.createElement("div");
        this.panel.id = "hydration-dev-panel";
        this.panel.innerHTML = `
      <style>
        #hydration-dev-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 300px;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          color: #00ff88;
          font-family: monospace;
          font-size: 12px;
          padding: 10px;
          box-shadow: -2px 0 8px rgba(0,0,0,0.5);
          transform: translateX(100%);
          transition: transform 0.3s ease;
          z-index: 9999;
        }

        #hydration-dev-panel.open {
          transform: translateX(0);
        }

        #hydration-dev-toggle {
          position: fixed;
          top: 10px;
          right: 310px;
          z-index: 10000;
          background: #00ff88;
          color: #000;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          border-radius: 3px;
          user-select: none;
        }

        #hydration-dev-panel h3 {
          margin-top: 0;
          font-size: 14px;
          border-bottom: 1px solid #00ff88;
        }

        #hydration-dev-log {
          overflow-y: auto;
          height: 80vh;
          margin-top: 10px;
        }

        #hydration-dev-log div {
          margin-bottom: 4px;
        }
      </style>
      <h3>Hydration Debugger</h3>
      <div>Queue: <span id="hydration-queue-count">0</span></div>
      <div>Active Workers: <span id="hydration-worker-count">0</span></div>
      <div id="hydration-dev-log"></div>
    `;
        document.body.appendChild(this.panel);
        const toggle = document.createElement("div");
        toggle.id = "hydration-dev-toggle";
        toggle.textContent = "Hydration \u{1F527}";
        toggle.onclick = () => this.toggle();
        document.body.appendChild(toggle);
        this.logList = this.panel.querySelector("#hydration-dev-log");
      }
      static toggle() {
        if (!this.panel) return;
        this.visible = !this.visible;
        this.panel.classList.toggle("open", this.visible);
      }
      static updateQueueCount(count) {
        const el = document.getElementById("hydration-queue-count");
        if (el) el.textContent = String(count);
      }
      static updateWorkerCount(count) {
        const el = document.getElementById("hydration-worker-count");
        if (el) el.textContent = String(count);
      }
      static log(message) {
        if (!this.logList) return;
        const entry = document.createElement("div");
        entry.textContent = `[${(/* @__PURE__ */ new Date()).toISOString().split("T")[1].slice(0, 8)}] ${message}`;
        this.logList.prepend(entry);
      }
    };
  }
});

// cli.ts
init_esm_shims();
import { Command } from "commander";

// utils/config.ts
init_esm_shims();
import path from "path";
async function loadConfig() {
  const configPath = path.resolve("archipelago.config.ts");
  try {
    const config2 = await import(configPath);
    return config2.default ?? config2;
  } catch {
    return {};
  }
}

// utils/update.ts
init_esm_shims();
import { execSync } from "child_process";

// utils/version.ts
init_esm_shims();
import { fileURLToPath } from "url";
import path2 from "path";
import fs from "fs";
var __dirname2 = path2.dirname(fileURLToPath(import.meta.url));
function getCliVersion() {
  const pkgPath = path2.resolve(__dirname2, "../package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  return pkg.version || "0.0.0";
}

// utils/update.ts
import https from "https";
function detectPackageManager() {
  try {
    if (execSync("pnpm --version")) return "pnpm";
  } catch {
  }
  try {
    if (execSync("yarn --version")) return "yarn";
  } catch {
  }
  return "npm";
}
async function checkForCliUpdates() {
  const current = getCliVersion();
  const latest = await getLatestFromNpm("archipelago");
  return {
    current,
    latest,
    isOutdated: current !== latest
  };
}
function getLatestFromNpm(pkg) {
  return new Promise((resolve3, reject) => {
    https.get(`https://registry.npmjs.org/${pkg}/latest`, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve3(parsed.version);
        } catch (e) {
          reject(e);
        }
      });
    });
  });
}
async function applyCliUpdate(pkg = "archipelago") {
  const manager = detectPackageManager();
  const cmd = manager === "pnpm" ? `pnpm add -g ${pkg}` : manager === "yarn" ? `yarn global add ${pkg}` : `npm install -g ${pkg}`;
  console.log(`\u2B06\uFE0F  Updating CLI via: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

// utils/history.ts
init_esm_shims();
import fs2 from "fs";
import path3 from "path";
var HISTORY_PATH = path3.resolve(process.env.HOME || "~", ".archipelago/history.log");
async function logHistory(cmd) {
  const line = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${cmd}
`;
  await fs2.promises.mkdir(path3.dirname(HISTORY_PATH), { recursive: true });
  await fs2.promises.appendFile(HISTORY_PATH, line);
}

// commands/history.ts
init_esm_shims();
import fs3 from "fs";
import path4 from "path";
var HISTORY_PATH2 = path4.resolve(process.env.HOME || "~", ".archipelago/history.log");
async function runHistory(limit = 20) {
  if (!fs3.existsSync(HISTORY_PATH2)) {
    console.log("\u{1F5D2}\uFE0F  No command history yet.");
    return;
  }
  const lines = fs3.readFileSync(HISTORY_PATH2, "utf-8").trim().split("\n");
  const recent = lines.slice(-limit);
  console.log(`\u{1F4DC} Last ${recent.length} CLI actions:
`);
  for (const line of recent) {
    console.log("\u2022", line);
  }
}

// commands/create.ts
init_esm_shims();
import path6 from "path";
import fs5 from "fs-extra";
import prompts from "prompts";
import open from "open";
var SCAFFOLD_BASE = path6.resolve("scaffolding", "default");
async function runCreate(type, name, options, config2) {
  const cwd = process.cwd();
  const targetDir = options.dirPath ? path6.resolve(options.dirPath) : type === "app" ? path6.join(cwd, name) : cwd;
  if (options.graphical && type === "app") {
    const port = 8822;
    console.log(`Launching graphical setup at http://localhost:${port}`);
    const server = await Promise.resolve().then(() => (init_web_setup_server(), web_setup_server_exports));
    await open(`http://localhost:${port}`);
    return;
  }
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
    config2.features = response.features;
    config2.git = response.useGit;
    config2.install = response.installDeps;
  }
  if (type === "app") {
    await fs5.copy(SCAFFOLD_BASE, targetDir);
    console.log(`\u{1F300} App scaffolded to: ${targetDir}`);
    if (config2.git) {
      await fs5.writeFile(path6.join(targetDir, ".gitignore"), "node_modules\n");
      await runCommand("git init", targetDir);
    }
    if (config2.install) {
      await runCommand("pnpm install", targetDir);
    }
    return;
  }
  const subdirMap = {
    component: "src/components",
    page: "src/pages",
    module: "src/modules",
    plugin: "src/plugins",
    store: "src/stores"
  };
  const relPath = subdirMap[type];
  if (!relPath) {
    console.error(`\u274C Unknown type: ${type}`);
    return;
  }
  const dest = path6.join(targetDir, relPath, `${name}.archy.tsx`);
  await fs5.ensureDir(path6.dirname(dest));
  await fs5.writeFile(dest, `<Template>
  <div>${type}: ${name}</div>
</Template>
`);
  console.log(`\u2705 ${type} created: ${dest}`);
}
async function runCommand(cmd, cwd) {
  const { execSync: execSync2 } = await import("child_process");
  execSync2(cmd, { cwd, stdio: "inherit" });
}

// commands/dev.ts
init_esm_shims();
async function runDev() {
  const { spawn: spawn2 } = await import("child_process");
  const dev = spawn2("vite", ["dev"], { stdio: "inherit", shell: true });
  dev.on("exit", (code) => {
    if (code !== 0) console.error(`\u274C Dev server exited with code ${code}`);
  });
}

// commands/build.ts
init_esm_shims();
async function runBuild() {
  const { spawn: spawn2 } = await import("child_process");
  const build = spawn2("vite", ["build"], { stdio: "inherit", shell: true });
  build.on("exit", (code) => {
    if (code !== 0) console.error(`\u274C Build failed with code ${code}`);
  });
}

// commands/start.ts
init_esm_shims();
async function runStart() {
  const { spawn: spawn2 } = await import("child_process");
  const start = spawn2("vite", ["preview"], { stdio: "inherit", shell: true });
  start.on("exit", (code) => {
    if (code !== 0) console.error(`\u274C Preview exited with code ${code}`);
  });
}

// commands/verify.ts
init_esm_shims();
import fs6 from "fs";
import path7 from "path";
async function runVerify() {
  const hasConfig = fs6.existsSync(path7.resolve("archipelago.config.ts"));
  const hasGlobalCSS = fs6.existsSync(path7.resolve("assets/global.css"));
  const hasSrc = fs6.existsSync(path7.resolve("src"));
  console.log("\u{1F50D} Verifying project structure...");
  if (!hasSrc) return console.error("\u274C Missing: /src");
  if (!hasConfig) console.warn("\u26A0\uFE0F  Missing: archipelago.config.ts");
  if (!hasGlobalCSS) console.warn("\u26A0\uFE0F  Missing: assets/global.css");
  console.log("\u2705 Structure looks valid.");
}

// commands/pre-compile.ts
init_esm_shims();
async function runPreCompile() {
  console.log("\u{1F9EA} Running JSX pre-compile and stub generation...");
  const { execSync: execSync2 } = await import("child_process");
  try {
    execSync2("pnpm exec tsx src/gen/generate-jsx-types.ts", { stdio: "inherit" });
    execSync2("pnpm exec tsx src/gen/generate-glob-imports.ts", { stdio: "inherit" });
  } catch (err) {
    console.error("\u274C Pre-compile failed:", err);
  }
}

// commands/hydrate.ts
init_esm_shims();

// ../core/runtime/main.ts
init_esm_shims();

// ../core/runtime/ArchipelagoRenderer.ts
init_esm_shims();

// ../core/runtime/hydrate.ts
init_esm_shims();

// ../core/runtime/hydration-controller.ts
init_esm_shims();

// ../core/runtime/render-worker-pool.ts
init_esm_shims();
init_hydration_dev_overlay();
var RenderWorkerPool = class _RenderWorkerPool {
  constructor(poolSize = navigator.hardwareConcurrency || 4) {
    this.poolSize = poolSize;
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(new URL("../workers/render.worker.ts", import.meta.url), {
        type: "module"
      });
      worker.onmessage = (e) => {
        const { id, html, error } = e.data;
        const job = this.queue.find((j) => j.id === id);
        if (!job) return;
        if (error) job.reject(error);
        else job.resolve(html);
        this.busy.delete(worker);
        HydrationDevOverlay.updateWorkerCount(this.busy.size);
        this.dequeue();
      };
      this.workers.push(worker);
    }
  }
  static instance;
  workers = [];
  queue = [];
  busy = /* @__PURE__ */ new Set();
  static getInstance() {
    if (!_RenderWorkerPool.instance) {
      _RenderWorkerPool.instance = new _RenderWorkerPool();
    }
    return _RenderWorkerPool.instance;
  }
  async render(template, context, options = {}) {
    const id = `job-${Math.random().toString(36).substring(2, 8)}`;
    return new Promise((resolve3, reject) => {
      this.queue.push({ id, template, context, options, resolve: resolve3, reject });
      this.dequeue();
    });
  }
  dequeue() {
    if (this.queue.length === 0) return;
    const idleWorker = this.workers.find((w) => !this.busy.has(w));
    if (!idleWorker) return;
    const job = this.queue.shift();
    if (!job) return;
    this.busy.add(idleWorker);
    HydrationDevOverlay.updateWorkerCount(this.busy.size);
    idleWorker.postMessage({
      id: job.id,
      template: job.template,
      context: job.context,
      options: job.options
    });
  }
};

// ../core/runtime/hydration-controller.ts
init_hydration_dev_overlay();
var HydrationController = class _HydrationController {
  static instance;
  hydrationMap = /* @__PURE__ */ new Map();
  hydrationQueue = [];
  isProcessing = false;
  constructor() {
  }
  static getInstance() {
    if (!_HydrationController.instance) {
      _HydrationController.instance = new _HydrationController();
    }
    return _HydrationController.instance;
  }
  async initialize() {
    console.log("HydrationController initialized");
    if (typeof window !== "undefined") {
      const globalConfig = window.ArchipelagoRenderer?.config;
      if (globalConfig?.debug) {
        const { HydrationDevOverlay: HydrationDevOverlay2 } = await Promise.resolve().then(() => (init_hydration_dev_overlay(), hydration_dev_overlay_exports));
        HydrationDevOverlay2.init();
      }
    }
    this.setupIntersectionObserver();
  }
  async destroy() {
    this.hydrationMap.clear();
    this.hydrationQueue = [];
    this.isProcessing = false;
    console.log("HydrationController destroyed");
  }
  /**
   * Public method to queue any hydratable component
   */
  queueIslandHydration(el, role) {
    const id = el.id || `island-${Math.random().toString(36).substring(2, 9)}`;
    if (this.hydrationMap.has(id) || el.dataset.hydrated === "true") return;
    const priority = this.getPriority(el);
    this.hydrationQueue.push({ el, role, priority });
    this.hydrationQueue.sort((a, b) => a.priority - b.priority);
    this.processQueue();
  }
  /**
   * Hydration logic (de-duplicate, decorate, emit)
   */
  async hydrateIsland(el, role) {
    const id = el.id || `island-${Math.random().toString(36).substring(2, 9)}`;
    if (this.hydrationMap.has(id)) return;
    this.hydrationMap.set(id, true);
    el.dataset.hydrated = "true";
    el.classList.add("hydrated");
    const template = el.outerHTML;
    const context = {};
    const options = { hydrate: true };
    try {
      const html = await RenderWorkerPool.getInstance().render(template, context, options);
      el.outerHTML = html;
      const event = new CustomEvent("archipelago:hydrated", {
        bubbles: true,
        detail: { id, role }
      });
      el.dispatchEvent(event);
    } catch (err) {
      console.error(`Failed to hydrate component ${id}:`, err);
    }
    HydrationDevOverlay.log(`Hydrated <${el.tagName.toLowerCase()}> (${role}) as ${id}`);
    HydrationDevOverlay.updateQueueCount(this.hydrationQueue.length);
  }
  /**
   * Hydrate 1 element per frame
   */
  processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    const loop = () => {
      const next = this.hydrationQueue.shift();
      if (next) {
        this.hydrateIsland(next.el, next.role);
        requestAnimationFrame(loop);
      } else {
        this.isProcessing = false;
      }
    };
    requestAnimationFrame(loop);
  }
  /**
   * Convert priority string or number to normalized priority level
   */
  getPriority(el) {
    const raw = el.getAttribute("data-priority") || "medium";
    if (!isNaN(Number(raw))) return Number(raw);
    return {
      high: 1,
      medium: 5,
      low: 10
    }[raw] ?? 5;
  }
  /**
   * IO observer for data-preload="onVisible"
   */
  setupIntersectionObserver() {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const role = el.getAttribute("data-role") || "component";
          const preload = el.getAttribute("data-preload");
          if (preload === "onVisible") {
            this.queueIslandHydration(el, role);
          }
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: "100px",
      threshold: 0.1
    });
    document.querySelectorAll('[data-hydrate="true"][data-preload="onVisible"]').forEach((el) => {
      observer.observe(el);
    });
  }
};

// ../core/runtime/hydratable-element-manager.ts
init_esm_shims();
var HydratableElementManager = class {
  controller = HydrationController.getInstance();
  /**
   * Scan and queue all hydratable elements (both islands and global components)
   */
  scanAndQueueAll() {
    const selector = '[data-hydrate="true"]:not([data-hydrated])';
    this.observeDynamicComponents();
    document.querySelectorAll(selector).forEach((el) => {
      const role = el.getAttribute("data-role") || "component";
      const preload = el.getAttribute("data-preload") || "onVisible";
      this.observeDynamicComponents();
      if (preload === "eager") {
        this.controller.queueIslandHydration(el, role);
      }
      if (preload === "onVisible") {
        this.observeForVisibility(el, role);
      }
    });
  }
  /**
   * Observe an element using IntersectionObserver
   */
  observeForVisibility(el, role) {
    if (!("IntersectionObserver" in window)) {
      this.controller.queueIslandHydration(el, role);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.controller.queueIslandHydration(el, role);
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: "100px",
      threshold: 0.1
    });
    observer.observe(el);
  }
  observeDynamicComponents() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.dataset.hydrate === "true" && !node.dataset.hydrated) {
            const role = node.getAttribute("data-role") || "component";
            const preload = node.getAttribute("data-preload") || "onVisible";
            if (preload === "eager") {
              this.controller.queueIslandHydration(node, role);
            } else if (preload === "onVisible") {
              this.observeForVisibility(node, role);
            }
          }
        });
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
};

// ../core/runtime/hydrate.ts
var initialized = false;
async function hydrateDomAutomatically() {
  if (initialized) return;
  initialized = true;
  const controller = HydrationController.getInstance();
  await controller.initialize();
  const manager = new HydratableElementManager();
  manager.scanAndQueueAll();
}

// ../core/runtime/registry.ts
init_esm_shims();
var registry = /* @__PURE__ */ new Map();
function registerComponent(name, resolver, source = "local") {
  registry.set(name, { name, resolver, source });
}
async function resolveComponent(name) {
  const entry = registry.get(name);
  if (!entry) {
    console.warn(`[Archipelago] Component "${name}" not found in registry.`);
    return void 0;
  }
  try {
    return await entry.resolver();
  } catch (err) {
    console.error(`[Archipelago] Failed to resolve "${name}":`, err);
    return void 0;
  }
}
function listRegisteredComponents() {
  return Array.from(registry.keys());
}

// ../core/runtime/module-manager.ts
init_esm_shims();
var registeredModules = [];
function registerModule(mod) {
  registeredModules.push(mod);
}
async function callLifecycle(phase, context) {
  for (const mod of registeredModules) {
    try {
      if (mod[phase]) {
        await mod[phase](context);
      }
    } catch (err) {
      console.warn(`[ModuleManager] Error in module during ${phase}:`, err);
    }
  }
}

// ../core/vfs/container/vfs-container-manager.ts
init_esm_shims();

// ../core/crypto/hash.ts
init_esm_shims();
import { blake3 } from "@noble/hashes/blake3";
var Blake3 = class _Blake3 {
  hash;
  mac;
  key;
  ctx;
  hex;
  base64;
  constructor(input, context, key) {
    const inputBytes = new TextEncoder().encode(input);
    this.hash = blake3(inputBytes);
    this.hex = Buffer.from(this.hash).toString("hex");
    this.base64 = Buffer.from(this.hash).toString("base64");
    if (key) {
      this.key = blake3(this.hash, { key });
    }
    if (context) {
      this.ctx = blake3(this.hash, { context });
    }
    this.mac = blake3(this.hash, { key: new Uint8Array(32) });
  }
  /**
   * Creates a new Blake3 instance and returns only the result
   */
  static from(input, context, key) {
    return new _Blake3(input, context, key);
  }
  /**
   * Convert the result to a JSON-safe object
   */
  toJSON() {
    return {
      hex: this.hex,
      base64: this.base64,
      mac: this.mac ? Buffer.from(this.mac).toString("hex") : "",
      key: this.key ? Buffer.from(this.key).toString("hex") : "",
      ctx: this.ctx ? Buffer.from(this.ctx).toString("hex") : ""
    };
  }
};

// ../core/crypto/falcon.ts
init_esm_shims();
var superFalcon;
if (typeof window === "undefined") {
  const { createRequire } = await import("node:module");
  const require2 = createRequire(import.meta.url);
  superFalcon = require2("superfalcon").superFalcon;
} else {
  superFalcon = {
    keyPair: async () => ({ publicKey: new Uint8Array(), privateKey: new Uint8Array() }),
    sign: async (_msg, _priv) => new Uint8Array(),
    open: async (_sig, _pub) => new Uint8Array(),
    signDetached: async (_msg, _priv) => new Uint8Array(),
    verifyDetached: async (_sig, _msg, _pub) => true,
    importKeys: async (_keys, _pwd) => ({ publicKey: new Uint8Array(), privateKey: new Uint8Array() }),
    exportKeys: async (_kp, _pwd) => ({ private: { combined: "" }, public: { combined: "" } }),
    signFile: async (_data, _priv) => new Uint8Array(),
    verifyFile: async (_sig, _data, _pub) => true
  };
}
var keyPair = async () => {
  return await superFalcon.keyPair();
};
var sign = async (message, privateKey, additionalData) => {
  return await superFalcon.sign(message, privateKey, additionalData);
};
var open2 = async (signedMessage, publicKey, additionalData) => {
  return await superFalcon.open(signedMessage, publicKey, additionalData);
};
var signDetached = async (message, privateKey, additionalData) => {
  return await superFalcon.signDetached(message, privateKey, additionalData);
};
var verifyDetached = async (signature, message, publicKey, additionalData) => {
  return await superFalcon.verifyDetached(signature, message, publicKey, additionalData);
};
var importKeys = async (keyData, password) => {
  return superFalcon.importKeys(keyData, typeof password === "string" ? password : password?.postQuantum || password?.classical || "");
};
var exportKeys = async (keyPairObj, password) => {
  return superFalcon.exportKeys(keyPairObj, typeof password === "string" ? password : password?.postQuantum || password?.classical || "");
};
var signFile = async (fileData, privateKey, additionalData) => {
  return await signDetached(fileData, privateKey, additionalData);
};
var verifyFile = async (signature, fileData, publicKey, additionalData) => {
  return await verifyDetached(signature, fileData, publicKey, additionalData);
};
var falcon_default = {
  keyPair,
  sign,
  open: open2,
  signDetached,
  verifyDetached,
  importKeys,
  exportKeys,
  signFile,
  verifyFile
};
var FalconSignature = class {
  publicKey;
  privateKey;
  constructor() {
  }
  async generateKeyPair() {
    const { publicKey, privateKey } = await keyPair();
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    return { publicKey, privateKey };
  }
  async sign(message, privateKey = this.privateKey) {
    return await signDetached(message, privateKey);
  }
  async verify(message, signature, publicKey = this.publicKey) {
    return await verifyDetached(signature, message, publicKey);
  }
};

// ../core/vfs/memory-vfs.ts
init_esm_shims();

// ../core/vfs/types.ts
init_esm_shims();

// ../core/vfs/memory-vfs.ts
var MemoryVFS = class {
  /* ------------------------------------------------------------------ */
  /*  Interface props + constructor                                     */
  /* ------------------------------------------------------------------ */
  scheme = "mem";
  /* maps path → InMemoryEntry */
  files = /* @__PURE__ */ new Map();
  /* set of directory paths (always stored with a leading /) */
  directories = /* @__PURE__ */ new Set(["/"]);
  constructor() {
  }
  info(path13) {
    throw new Error("Method not implemented.");
  }
  list(path13) {
    throw new Error("Method not implemented.");
  }
  /* ------------------------------------------------------------------ */
  /*  Lifecycle                                                         */
  /* ------------------------------------------------------------------ */
  async mount() {
  }
  async unmount() {
    this.files.clear();
    this.directories.clear();
    this.directories.add("/");
  }
  /* ------------------------------------------------------------------ */
  /*  File operations                                                   */
  /* ------------------------------------------------------------------ */
  async readFile(path13) {
    const entry = this.files.get(path13);
    if (!entry) throw new Error(`File not found: ${path13}`);
    return entry.data;
  }
  async writeFile(path13, data) {
    if (!await this.exists(path13)) {
      await this.create(path13);
    }
    const entry = this.files.get(path13);
    entry.data = data;
    entry.info.size = data.length;
    entry.info.updatedAt = Date.now();
  }
  async readdir(dir = "/") {
    const handles = [];
    for (const [filePath, entry] of this.files) {
      if (filePath !== dir && filePath.startsWith(dir) && !filePath.slice(dir.length).includes("/")) {
        handles.push({
          ...entry.info,
          mtime: 0
        });
      }
    }
    for (const sub of this.directories) {
      if (sub !== dir && sub.startsWith(dir) && !sub.slice(dir.length).includes("/")) {
        handles.push({
          path: sub,
          size: 0,
          mtime: 0
        });
      }
    }
    return handles;
  }
  async stat(path13) {
    if (this.files.has(path13)) return { mtime: 0, ...this.files.get(path13).info };
    if (this.directories.has(path13)) {
      return {
        mtime: 0,
        path: path13,
        size: 0
      };
    }
    return null;
  }
  /* ------------------------------------------------------------------ */
  /*  Random‑access file API                                            */
  /* ------------------------------------------------------------------ */
  async open(path13, mode) {
    if (!await this.exists(path13)) {
      if (mode === "r" /* READ */) {
        throw new Error(`File not found: ${path13}`);
      }
      await this.create(path13);
    }
    const file = this.files.get(path13);
    let cursor = 0;
    return {
      async read(buffer, length) {
        const slice = file.data.slice(cursor, cursor + length);
        buffer.set(slice, 0);
        cursor += slice.length;
        return slice.length;
      },
      async write(buffer) {
        const newSize = Math.max(cursor + buffer.length, file.data.length);
        const next = new Uint8Array(newSize);
        next.set(file.data, 0);
        next.set(buffer, cursor);
        file.data = next;
        file.info.size = next.length;
        file.info.updatedAt = Date.now();
        cursor += buffer.length;
        return buffer.length;
      },
      async seek(offset, whence) {
        if (whence === "SET") cursor = offset;
        else if (whence === "CUR") cursor += offset;
        else cursor = file.data.length + offset;
      },
      async flush() {
      },
      async close() {
      },
      async getInfo() {
        return { ...file.info };
      }
    };
  }
  /* ------------------------------------------------------------------ */
  /*  Helpers                                                           */
  /* ------------------------------------------------------------------ */
  async create(path13) {
    const now = Date.now();
    this.files.set(path13, {
      data: new Uint8Array(0),
      info: {
        name: path13.split("/").pop() || path13,
        path: path13,
        size: 0,
        createdAt: now,
        updatedAt: now,
        isDirectory: false
      }
    });
  }
  async delete(path13) {
    if (!this.files.delete(path13)) {
      throw new Error(`File not found: ${path13}`);
    }
  }
  async exists(path13) {
    return this.files.has(path13) || this.directories.has(path13);
  }
  async mkdir(path13) {
    this.directories.add(path13.endsWith("/") ? path13.slice(0, -1) : path13);
  }
  async rmdir(path13, recursive = false) {
    if (!this.directories.has(path13)) throw new Error(`Directory not found: ${path13}`);
    this.directories.delete(path13);
    if (recursive) {
      for (const filePath of [...this.files.keys()]) {
        if (filePath.startsWith(`${path13}/`)) this.files.delete(filePath);
      }
    }
  }
};
function createMemoryVFS() {
  const vfs = new MemoryVFS();
  return vfs;
}

// ../core/vfs/safe-storage.ts
init_esm_shims();
var SafeStorage = class {
  constructor(fs10, root = "/store") {
    this.fs = fs10;
    this.root = root;
  }
  resolvePath(key) {
    return `${this.root}/${key}`;
  }
  async setItem(key, value) {
    const path13 = this.resolvePath(key);
    if (!await this.fs.exists(path13)) await this.fs.create(path13);
    const file = await this.fs.open(path13, "w" /* WRITE */);
    await file.write(new TextEncoder().encode(value));
    await file.flush();
    await file.close();
  }
  async getItem(key) {
    const path13 = this.resolvePath(key);
    if (!await this.fs.exists(path13)) return null;
    const file = await this.fs.open(path13, "r" /* READ */);
    const buffer = new Uint8Array(2048);
    const len = await file.read(buffer, buffer.length);
    await file.close();
    return new TextDecoder().decode(buffer.slice(0, len));
  }
  async removeItem(key) {
    const path13 = this.resolvePath(key);
    if (await this.fs.exists(path13)) {
      await this.fs.delete(path13);
    }
  }
  async clear() {
    await this.fs.rmdir(this.root, true);
    await this.fs.mkdir(this.root);
  }
  async keys() {
    const files = await this.fs.list(this.root);
    return files.map((f) => f.name);
  }
};

// ../core/vfs/stream/stream-adapter.ts
init_esm_shims();

// ../core/vfs/container/verify-vault.ts
init_esm_shims();
import { ungzip } from "pako";
async function verifyVaultSignature(vfs, filePath) {
  const sigPath = `${filePath}.sig.gz`;
  if (!await vfs.exists(sigPath)) {
    console.warn(`\u26A0\uFE0F No signature file found for: ${filePath}`);
    return false;
  }
  const file = await vfs.open(filePath, "r" /* READ */);
  const data = new Uint8Array(2048);
  const len = await file.read(data, data.length);
  await file.close();
  const fileContent = data.slice(0, len);
  const sigFile = await vfs.open(sigPath, "r" /* READ */);
  const sigBuf = new Uint8Array(1024);
  const sigLen = await sigFile.read(sigBuf, sigBuf.length);
  await sigFile.close();
  const sigJson = JSON.parse(
    new TextDecoder().decode(ungzip(sigBuf.slice(0, sigLen)))
  );
  const hash = Blake3.from(Buffer.from(fileContent).toString("utf-8")).base64;
  const verified = await falcon_default.FalconVerifyDetached(
    new Uint8Array(Buffer.from(sigJson.h, "base64")),
    new Uint8Array(Buffer.from(sigJson.s, "base64")),
    new Uint8Array(Buffer.from(sigJson.k, "base64"))
  );
  return verified && sigJson.h === hash;
}

// ../core/net/secure-sockets.ts
init_esm_shims();
import { EventEmitter as EventEmitter2 } from "node:events";

// ../hydra_compression/src/uDTLS-PQ/src/udtls-pq.ts
init_esm_shims();
import { EventEmitter } from "node:events";
import dgram from "node:dgram";

// ../hydra_compression/src/uDTLS-PQ/src/lib/types.ts
init_esm_shims();
var DTLSSession = class {
  constructor(id) {
    this.id = id;
  }
};

// ../hydra_compression/src/uDTLS-PQ/src/udtls-pq.ts
var DTLS = class extends EventEmitter {
  context;
  session;
  opts;
  state = "closed" /* CLOSED */;
  socket;
  constructor(options) {
    super();
    this.opts = {
      isServer: false,
      securityLevel: "standard" /* STANDARD */,
      minVersion: "1.2",
      maxVersion: "1.3",
      verifyPeer: true,
      debug: false,
      timeout: 3e4,
      mtu: 1400,
      autoFallback: true,
      cipherSuites: [],
      ...options
    };
    this.initContext();
  }
  /* ------------------------------------------------------------------ */
  /*  Context / Session Helpers                                         */
  /* ------------------------------------------------------------------ */
  initContext() {
    if (!this.opts.cert || !this.opts.key)
      throw new Error("Certificate & key required for DTLS context");
    if (this.compareVer(this.opts.minVersion, this.opts.maxVersion) > 0)
      throw new Error("minVersion cannot exceed maxVersion");
    const ctxOpts = {
      cert: typeof this.opts.cert === "string" ? Buffer.from(this.opts.cert) : this.opts.cert,
      key: this.opts.key,
      ciphers: this.opts.cipherSuites,
      pqCiphers: this.pickPqSuites(),
      enableCertTransparency: true,
      minVersion: this.mapVersion(this.opts.minVersion),
      maxVersion: this.mapVersion(this.opts.maxVersion),
      verifyMode: this.opts.verifyPeer ? 1 /* PEER */ : 0 /* NONE */,
      isServer: this.opts.isServer
    };
    this.context = nativeBindings.createContext(ctxOpts);
    if (!this.context) throw new Error("DTLS context init failed");
  }
  pickPqSuites() {
    switch (this.opts.securityLevel) {
      case "pq-medium" /* POST_QUANTUM_MEDIUM */:
        return ["TLS_KYBER512_WITH_AES_128_GCM_SHA256" /* KYBER512_AES_128_GCM_SHA256 */];
      case "pq-high" /* POST_QUANTUM_HIGH */:
        return ["TLS_KYBER768_WITH_AES_256_GCM_SHA384" /* KYBER768_AES_256_GCM_SHA384 */];
      case "hybrid" /* HYBRID */:
        return [
          "TLS_KYBER512_WITH_AES_128_GCM_SHA256" /* KYBER512_AES_128_GCM_SHA256 */,
          "TLS_KYBER768_WITH_AES_256_GCM_SHA384" /* KYBER768_AES_256_GCM_SHA384 */
        ];
      default:
        return void 0;
    }
  }
  mapVersion(v) {
    return {
      "1.0": "DTLS 1.0" /* DTLS_1_0 */,
      "1.2": "DTLS 1.2" /* DTLS_1_2 */,
      "1.3": "DTLS 1.3" /* DTLS_1_3 */
    }[v];
  }
  compareVer(a, b) {
    return parseFloat(a) - parseFloat(b);
  }
  /* ------------------------------------------------------------------ */
  /*  Client Connect                                                    */
  /* ------------------------------------------------------------------ */
  connect(port, host, cb) {
    if (this.state !== "closed" /* CLOSED */)
      throw new Error("DTLS instance already used");
    if (this.opts.isServer) throw new Error("Server mode cannot connect()");
    this.socket = dgram.createSocket("udp4");
    this.session = new DTLSSession(this.context.id);
    nativeBindings.setupAutomaticRekey(this.session.id, 3600);
    const ok = nativeBindings.dtlsConnect(this.session, host, port);
    if (!ok) {
      const err = nativeBindings.getError(this.session) ?? "DTLS connect error";
      return this.handleError(new Error(err));
    }
    this.state = "handshake" /* HANDSHAKE */;
    this.setupSocketEvents();
    if (cb) this.once("connect", cb);
  }
  /* ------------------------------------------------------------------ */
  /*  UDP Socket Event Wiring                                           */
  /* ------------------------------------------------------------------ */
  setupSocketEvents() {
    const sock = this.socket;
    sock.on("message", (msg) => this.onUdpData(msg));
    sock.on("error", (e) => this.handleError(e));
    sock.on("close", () => {
      this.state = "disconnected" /* DISCONNECTED */;
      this.emit("close");
    });
  }
  onUdpData(msg) {
    if (!msg?.length) {
      this.emit("error", new Error("Empty UDP packet"));
      return;
    }
    try {
      const res = nativeBindings.dtlsReceive(this.session, msg);
      if (res.handshakeComplete && this.state !== "connected" /* CONNECTED */) {
        this.state = "connected" /* CONNECTED */;
        this.emit("connect");
      }
      if (res.data) this.emit("message", res.data);
    } catch (e) {
      this.handleError(e);
    }
  }
  /* ------------------------------------------------------------------ */
  /*  Send / Close                                                      */
  /* ------------------------------------------------------------------ */
  send(data) {
    if (this.state !== "connected" /* CONNECTED */)
      throw new Error("DTLS not connected");
    const buf = typeof data === "string" ? Buffer.from(data) : data;
    const cipher = nativeBindings.aesGcmSeal(buf, buf, buf, buf);
    this.socket.send(cipher, 0, cipher.length, this.socket.remotePort, this.socket.remoteAddress);
  }
  close() {
    try {
      nativeBindings.dtlsShutdown(this.session);
    } catch {
    }
    nativeBindings.freeSession?.(this.session);
    nativeBindings.freeContext?.(this.context);
    this.socket?.close();
    this.state = "closed" /* CLOSED */;
  }
  /* ------------------------------------------------------------------ */
  /*  Error utility                                                     */
  /* ------------------------------------------------------------------ */
  handleError(err) {
    this.state = "error" /* ERROR */;
    this.emit("error", err);
    this.close();
  }
};

// ../core/net/secure-sockets.ts
var SecureSocket = class extends EventEmitter2 {
  session;
  opts;
  constructor(opts) {
    super();
    this.opts = opts;
    console.log("SecureSocket opts", opts);
  }
  /** Establish a DTLS (PQ‑hybrid) session. */
  async connect() {
    try {
      if (!this.opts.cert || !this.opts.key) {
        throw new Error("Certificate and key are required for DTLS connection");
      }
      this.opts["sessionTicket"] = void 0;
      this.session = new DTLS({
        isServer: false,
        ...this.opts,
        securityLevel: "hybrid" /* HYBRID */
      });
      this.session.on("data", (buf) => this.emit("message", buf));
      this.session.on("close", () => this.emit("close"));
      this.session.on("error", (e) => this.emit("error", e));
      this.emit("open");
    } catch (err) {
      this.emit("error", err);
      throw err;
    }
  }
  /** Send data (string or bytes). Throws if not connected. */
  async send(data) {
    if (!this.session) throw new Error("Not connected");
    const buffer = typeof data === "string" ? Buffer.from(data) : data;
    try {
      this.session.send(buffer);
    } catch (err) {
      this.emit("error", err);
      throw err;
    }
  }
  /** Close the connection. */
  close() {
    if (this.session) {
      try {
        this.session.close();
        this.session = void 0;
      } catch (err) {
        this.emit("error", err);
      }
    }
  }
};

// ../core/vfs/stream/stream-adapter.ts
var StreamAdapter = class {
  constructor(fs10, enableVerification = true, recordTo) {
    this.fs = fs10;
    this.enableVerification = enableVerification;
    if (this.url.protocol.startsWith("dtls")) {
      this.transport = new SecureSocket({
        host: this.url.hostname,
        port: parseInt(this.url.port, 10) || 4444
      });
      (async () => await this.transport?.connect())();
      this.transport.on("message", (chunk) => this.onChunk(chunk));
    } else {
    }
  }
  recordTo;
  url;
  transport;
  async openStream(path13) {
    if (this.enableVerification) {
      const verified = await verifyVaultSignature(this.fs, path13);
      if (!verified) throw new Error(`Signature failed: ${path13}`);
    }
    const file = await this.fs.open(path13, "r" /* READ */);
    const chunkSize = 64 * 1024;
    return new ReadableStream({
      pull: async function(controller) {
        const buffer = new Uint8Array(chunkSize);
        const len = await file.read(buffer, chunkSize);
        if (len === 0) {
          controller.close();
          await file.close();
          return;
        }
        controller.enqueue(buffer.slice(0, len));
        if (this.recordTo) {
          const hash = Blake3.from(path13).hex;
          const recPath = `/recordings/${hash}.chunk`;
          if (!await this.recordTo.exists(recPath)) await this.recordTo.create(recPath);
          const recFile = await this.recordTo.open(recPath, "a" /* APPEND */);
          await recFile.write(buffer.slice(0, len));
          await recFile.close();
        }
      }
    });
  }
  async getMetadata(path13) {
    const info = await this.fs.info(path13);
    const verified = this.enableVerification ? await verifyVaultSignature(this.fs, path13).catch(() => false) : true;
    const ext = path13.split(".").pop() || "";
    const mime = {
      mp4: "video/mp4",
      webm: "video/webm",
      ogg: "video/ogg",
      mp3: "audio/mpeg",
      wav: "audio/wav"
    }[ext] || "application/octet-stream";
    return { mime, size: info.size, verified };
  }
  /**
   * Link real-time pubsub stream as virtual feed
   */
  async pipeFromFeed(topic, getFeed) {
    const recPath = `/p2p/pub/${topic}.live`;
    if (!await this.fs.exists(recPath)) await this.fs.create(recPath);
    const writer = await this.fs.open(recPath, "a" /* APPEND */);
    for await (const chunk of getFeed()) {
      await writer.write(chunk);
    }
    await writer.flush();
    await writer.close();
  }
  onChunk(chunk) {
  }
};
function createStreamAdapter(source, verify = true, vault) {
  return new StreamAdapter(source, verify, vault);
}

// ../core/transports/secure-memory-transport.ts
init_esm_shims();

// ../core/crypto/aes.ts
init_esm_shims();
async function generateAesKey() {
  return crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );
}
async function importAesKey(keyData) {
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}
async function subtleEncrypt(data, key, iv) {
  const aesKey = key instanceof CryptoKey ? key : await importAesKey(key);
  const nonce = iv ?? crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, data);
  const result = new Uint8Array(nonce.length + encrypted.byteLength);
  result.set(nonce, 0);
  result.set(new Uint8Array(encrypted), nonce.length);
  return result;
}
async function subtleDecrypt(encrypted, key) {
  const aesKey = key instanceof CryptoKey ? key : await importAesKey(key);
  const iv = encrypted.slice(0, 12);
  const ciphertext = encrypted.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext);
  return new Uint8Array(decrypted);
}
var AESGCM = class {
  constructor(key) {
    this.key = key;
  }
  async encrypt(plaintext) {
    return subtleEncrypt(plaintext, this.key);
  }
  // @ts-ignore
  async decrypt(ciphertext, iv) {
    return subtleDecrypt(ciphertext, this.key);
  }
};

// ../core/crypto/factory.ts
init_esm_shims();

// ../core/interfaces/transport.ts
init_esm_shims();

// ../core/crypto/kyber.ts
init_esm_shims();
import { MlKem768 } from "mlkem";
var KyberKeyExchange = class {
  publicKey;
  privateKey;
  async generateKeyPair() {
    const inst = new MlKem768();
    const [pk, sk] = await inst.generateKeyPair();
    this.publicKey = pk;
    this.privateKey = sk;
    return { publicKey: pk, privateKey: sk };
  }
  async encapsulate(publicKey) {
    const inst = new MlKem768();
    const [ciphertext, sharedSecret] = await inst.encap(publicKey);
    return { ciphertext, sharedSecret };
  }
  async decapsulate(ciphertext, privateKey) {
    const inst = new MlKem768();
    return inst.decap(privateKey, ciphertext);
  }
};

// ../core/crypto/factory.ts
async function createCryptoBundle(opts) {
  const algorithm = opts.algorithm ?? "aes-gcm" /* AES_GCM */;
  const signature = opts.signature ?? "falcon" /* FALCON */;
  let encryption;
  let exchange;
  switch (algorithm) {
    case "kyber+aes-gcm" /* KYBER_AES_GCM */:
      const aesKey = await generateAesKey();
      encryption = new AESGCM(aesKey);
      exchange = new KyberKeyExchange();
      break;
    case "aes-gcm" /* AES_GCM */:
    default:
      encryption = new AESGCM(await generateAesKey());
      exchange = new KyberKeyExchange();
      break;
  }
  const sigImpl = new FalconSignature();
  const { publicKey, privateKey } = await sigImpl.generateKeyPair();
  return {
    encryption,
    exchange,
    signature: sigImpl,
    signaturePublicKey: publicKey,
    signaturePrivateKey: privateKey
  };
}

// ../core/transports/secure-memory-transport.ts
var SecureMemoryTransport = class {
  /* ------------------------------------------------------------------ */
  key = null;
  peer = null;
  handlers = {};
  options;
  context = null;
  session = null;
  aes = null;
  constructor(options) {
    this.options = options;
  }
  /* -------------------------- getters ------------------------------- */
  getContext() {
    return this.context;
  }
  getSession() {
    return this.session;
  }
  /* ------------------------- lifecycle ------------------------------ */
  async init() {
    console.info("[SecureMemoryTransport] Initializing transport\u2026");
    const crypto2 = await createCryptoBundle(this.options);
    this.key = await generateAesKey();
    this.aes = new AESGCM(this.key);
    const challenge = globalThis.crypto.getRandomValues(new Uint8Array(32));
    const signature = await crypto2.signature.sign(challenge, crypto2.signaturePrivateKey);
    const id = typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : Math.random().toString(36).slice(2);
    this.context = {
      id,
      isServer: this.options.isServer,
      crypto: crypto2,
      options: {},
      verified: false,
      handshake: {
        challenge,
        signature,
        // @ts-ignore
        publicKey: crypto2.signaturePublicKey
      }
    };
    this.session = {
      id: `${id}-session`,
      // @ts-ignore
      context: this.context,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      close: () => this.close()
    };
    console.debug("[SecureMemoryTransport] Generated handshake challenge and signature");
  }
  /* ------------------------- pairing / handshake -------------------- */
  /** Link two SecureMemoryTransport instances together */
  pairWith(peer) {
    console.info("[SecureMemoryTransport] Pairing with peer\u2026");
    if (!this.context || !peer.context) throw new Error("Both transports must be initialised");
    const localVerify = peer.context.crypto.signature.verify(
      this.context.handshake.challenge,
      this.context.handshake.signature,
      this.context.handshake.publicKey
    );
    const peerVerify = this.context.crypto.signature.verify(
      peer.context.handshake.challenge,
      peer.context.handshake.signature,
      peer.context.handshake.publicKey
    );
    Promise.race([
      Promise.all([localVerify, peerVerify]),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Handshake timeout")), 2e3)
      )
    ]).then((result) => {
      if (!Array.isArray(result) || result.length !== 2) {
        throw new Error("Unexpected handshake race result");
      }
      const [locOK, peerOK] = result;
      if (!locOK || !peerOK) throw new Error("Mutual handshake verification failed");
      this.context.verified = true;
      peer.context.verified = true;
      console.info("[SecureMemoryTransport] Mutual handshake verification successful");
      const sharedKey = this.key;
      this.aes = new AESGCM(sharedKey);
      this.key = sharedKey;
      peer.key = sharedKey;
      peer.aes = new AESGCM(sharedKey);
      this.peer = peer;
      peer.peer = this;
      if (!peer.key && this.key) peer.key = this.key;
    }).catch((err) => {
      throw new Error(`[SecureMemoryTransport] Handshake error: ${err.message}`);
    });
  }
  /* ------------------------- connection stubs ----------------------- */
  async connect(_port, _host) {
    console.info("[SecureMemoryTransport] Simulating connect (no\u2011op)\u2026");
  }
  async listen(_port) {
    console.info("[SecureMemoryTransport] Simulating listen (no\u2011op)\u2026");
  }
  /* ------------------------- data plane ----------------------------- */
  ensureVerified() {
    if (!this.context?.verified) throw new Error("Handshake not verified");
  }
  async send(data) {
    this.ensureVerified();
    if (!this.aes || !this.peer) return;
    console.debug("[SecureMemoryTransport] Sending encrypted payload\u2026");
    const encrypted = await this.aes.encrypt(data);
    this.session.lastActivityAt = Date.now();
    this.peer.receive(encrypted);
  }
  async receive(data) {
    this.ensureVerified();
    if (!this.aes) return;
    console.debug("[SecureMemoryTransport] Receiving and decrypting payload\u2026");
    const decrypted = await this.aes.decrypt(data);
    this.session.lastActivityAt = Date.now();
    this.emit("message", decrypted);
  }
  /* ------------------------- teardown ------------------------------- */
  close() {
    console.warn("[SecureMemoryTransport] Closing session\u2026");
    this.peer = null;
    this.key = null;
    this.session = null;
    this.context = null;
  }
  /* ------------------------- event helpers -------------------------- */
  on(event, handler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }
  emit(event, payload) {
    (this.handlers[event] || []).forEach((fn) => fn(payload));
  }
};

// ../core/vfs/adapter/ost.ts
init_esm_shims();

// ../core/transports/ost/OSTPackWriter.ts
init_esm_shims();

// ../core/transports/ost/OSTCompression.ts
init_esm_shims();
var compress;
var decompress;
if (typeof window === "undefined") {
  const { brotliCompress: brotliCompress2, brotliDecompress: brotliDecompress2 } = await import("zlib");
  const { promisify } = await import("util");
  compress = promisify(brotliCompress2);
  decompress = promisify(brotliDecompress2);
} else {
  compress = async () => {
    throw new Error("OSTCompression.compress() is not supported in the browser");
  };
  decompress = async () => {
    throw new Error("OSTCompression.decompress() is not supported in the browser");
  };
}
var DEFAULT_CONFIG = {
  windowLength: 1e3,
  labelLength: 4,
  variableWindow: false,
  compressionMethod: "huffman",
  subBinning: false,
  subBinningDepth: 0
};
var Bin = class {
  label;
  segments;
  constructor(label) {
    this.label = label;
    this.segments = [];
  }
  addSegment(segment) {
    this.segments.push(segment);
  }
  getData() {
    return this.segments.join("");
  }
};
var HuffmanNode = class {
  char;
  frequency;
  left;
  right;
  constructor(char, frequency, left = null, right = null) {
    this.char = char;
    this.frequency = frequency;
    this.left = left;
    this.right = right;
  }
  isLeaf() {
    return this.left === null && this.right === null;
  }
};
var OSTCompression = class {
  config;
  constructor(config2 = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config2 };
  }
  /**
   * Encodes the input data using the OST algorithm
   *
   * @param data The data to be compressed
   * @returns An object containing the compressed data and metadata
   */
  async encode(data) {
    const windows = this.divideIntoWindows(data);
    const labeledWindows = windows.map((window2) => ({
      window: window2,
      label: this.generateLabel(window2)
    }));
    const bins = this.groupIntoBins(labeledWindows);
    const compressedBins = /* @__PURE__ */ new Map();
    for (const [label, bin] of bins.entries()) {
      const compressedData = this.compressBin(bin);
      compressedBins.set(label, await compressedData);
    }
    return {
      compressedBins,
      metadata: {
        config: this.config
      }
    };
  }
  /**
   * Decodes the compressed data back to its original form
   *
   * @param compressedData The object containing compressed bins and metadata
   * @returns The original uncompressed data
   */
  async decode(compressedData) {
    const { compressedBins, metadata } = compressedData;
    const { windowLengths } = metadata;
    const binOrder = [];
    const variableWindow = windowLengths !== void 0;
    const decompressedBins = /* @__PURE__ */ new Map();
    for (const [label, compressedBin] of compressedBins.entries()) {
      const decompressedData = await this.decompressBin(compressedBin);
      decompressedBins.set(label, decompressedData);
    }
    return "Decompression process would reconstruct the original data here";
  }
  /**
   * Divides the input data into windows of specified length
   *
   * @param data The input data
   * @returns Array of windows
   */
  divideIntoWindows(data) {
    const windows = [];
    const { windowLength, variableWindow } = this.config;
    if (!variableWindow) {
      for (let i = 0; i < data.length; i += windowLength) {
        const end = Math.min(i + windowLength, data.length);
        windows.push(data.substring(i, end));
      }
    } else {
      let i = 0;
      while (i < data.length) {
        let currentWindowLength = windowLength;
        const end = Math.min(i + currentWindowLength, data.length);
        windows.push(data.substring(i, end));
        i = end;
      }
    }
    return windows;
  }
  /**
   * Generates a label for a window using the Huffman encoding strategy
   *
   * @param window The window to generate a label for
   * @returns The label string
   */
  generateLabel(window2) {
    const frequencyMap = /* @__PURE__ */ new Map();
    for (const char of window2) {
      const count = frequencyMap.get(char) || 0;
      frequencyMap.set(char, count + 1);
    }
    const tree = this.buildHuffmanTree(frequencyMap);
    const huffmanCodes = /* @__PURE__ */ new Map();
    this.generateHuffmanCodes(tree, "", huffmanCodes);
    const charsByEncodingLength = [];
    for (const [char, code] of huffmanCodes.entries()) {
      charsByEncodingLength.push({ char, encodingLength: code.length });
    }
    charsByEncodingLength.sort((a, b) => a.encodingLength - b.encodingLength);
    let label = "";
    let encodingLengths = "";
    for (let i = 0; i < Math.min(this.config.labelLength, charsByEncodingLength.length); i++) {
      const { char, encodingLength } = charsByEncodingLength[i];
      label += char;
      encodingLengths += encodingLength;
    }
    return `${label} ${encodingLengths}`;
  }
  /**
   * Builds a Huffman tree from a frequency map
   *
   * @param frequencyMap Map of character frequencies
   * @returns The root node of the Huffman tree
   */
  buildHuffmanTree(frequencyMap) {
    const nodes = [];
    for (const [char, frequency] of frequencyMap.entries()) {
      nodes.push(new HuffmanNode(char, frequency));
    }
    while (nodes.length > 1) {
      nodes.sort((a, b) => a.frequency - b.frequency);
      const left = nodes.shift();
      const right = nodes.shift();
      const newNode = new HuffmanNode("\0", left.frequency + right.frequency, left, right);
      nodes.push(newNode);
    }
    return nodes[0];
  }
  /**
   * Recursively generates Huffman codes for each character
   *
   * @param node Current node in the Huffman tree
   * @param code Current code
   * @param huffmanCodes Map to store character codes
   */
  generateHuffmanCodes(node, code, huffmanCodes) {
    if (node === null) return;
    if (node.isLeaf()) {
      huffmanCodes.set(node.char, code);
      return;
    }
    this.generateHuffmanCodes(node.left, code + "0", huffmanCodes);
    this.generateHuffmanCodes(node.right, code + "1", huffmanCodes);
  }
  /**
   * Groups labeled windows into bins with the same label
   *
   * @param labeledWindows Array of windows with their labels
   * @returns Map of bins by label
   */
  groupIntoBins(labeledWindows) {
    const bins = /* @__PURE__ */ new Map();
    for (const { window: window2, label } of labeledWindows) {
      if (!bins.has(label)) {
        bins.set(label, new Bin(label));
      }
      bins.get(label).addSegment(window2);
    }
    return bins;
  }
  /**
   * Compresses a bin using the configured compression method
   *
   * @param bin The bin to compress
   * @returns Compressed data as Uint8Array
   */
  async compressBin(bin) {
    const data = new TextEncoder().encode(bin.getData());
    switch (this.config.compressionMethod) {
      case "huffman":
        return this.huffmanCompress(bin.getData());
      case "brotli":
        return brotliCompress(data);
      case "zstd":
        let result;
        zstdCompress(data, (error, result2) => {
          if (error) {
            console.error("ZSTD compression error:", error);
            return new Uint8Array(0);
          } else {
            return result2;
          }
        });
      case "raw":
      default:
        return data;
    }
  }
  /**
   * Decompresses a bin using the configured compression method
   *
   * @param compressedData The compressed data
   * @returns Decompressed data as string
   */
  async decompressBin(compressedData) {
    switch (this.config.compressionMethod) {
      case "huffman":
        return this.huffmanDecompress(compressedData);
      case "brotli":
        return new TextDecoder().decode(await brotliDecompress(compressedData));
      case "zstd":
        zstdDecompress(compressedData, (error, result) => {
          return result;
        });
      case "raw":
      default:
        return new TextDecoder().decode(compressedData);
    }
  }
  /**
   * Compresses data using Huffman coding
   *
   * @param data The data to compress
   * @returns Compressed data as Uint8Array
   */
  huffmanCompress(data) {
    const frequencyMap = /* @__PURE__ */ new Map();
    for (const char of data) {
      const count = frequencyMap.get(char) || 0;
      frequencyMap.set(char, count + 1);
    }
    const tree = this.buildHuffmanTree(frequencyMap);
    const huffmanCodes = /* @__PURE__ */ new Map();
    this.generateHuffmanCodes(tree, "", huffmanCodes);
    let encodedBits = "";
    for (const char of data) {
      encodedBits += huffmanCodes.get(char);
    }
    const bytes = new Uint8Array(Math.ceil(encodedBits.length / 8));
    for (let i = 0; i < encodedBits.length; i += 8) {
      const byte = encodedBits.slice(i, i + 8).padEnd(8, "0");
      bytes[i / 8] = parseInt(byte, 2);
    }
    const treeData = JSON.stringify(Array.from(frequencyMap.entries()));
    const treeBytes = new TextEncoder().encode(treeData);
    const result = new Uint8Array(treeBytes.length + 4 + bytes.length);
    const treeLength = treeBytes.length;
    result[0] = treeLength >> 24 & 255;
    result[1] = treeLength >> 16 & 255;
    result[2] = treeLength >> 8 & 255;
    result[3] = treeLength & 255;
    result.set(treeBytes, 4);
    result.set(bytes, 4 + treeBytes.length);
    return result;
  }
  /**
   * Decompresses data using Huffman coding
   *
   * @param compressedData The compressed data
   * @returns Decompressed data as string
   */
  huffmanDecompress(compressedData) {
    const treeLength = compressedData[0] << 24 | compressedData[1] << 16 | compressedData[2] << 8 | compressedData[3];
    const treeBytes = compressedData.slice(4, 4 + treeLength);
    const treeData = new TextDecoder().decode(treeBytes);
    const frequencyMap = new Map(JSON.parse(treeData));
    const tree = this.buildHuffmanTree(frequencyMap);
    const encodedBytes = compressedData.slice(4 + treeLength);
    let encodedBits = "";
    for (const byte of encodedBytes) {
      encodedBits += byte.toString(2).padStart(8, "0");
    }
    let decodedData = "";
    let currentNode = tree;
    for (const bit of encodedBits) {
      if (bit === "0") {
        currentNode = currentNode.left;
      } else {
        currentNode = currentNode.right;
      }
      if (currentNode.isLeaf()) {
        decodedData += currentNode.char;
        currentNode = tree;
      }
    }
    return decodedData;
  }
};

// ../core/transports/ost/OSTPackWriter.ts
var OSTPackWriter = class {
  static async createPack(data, config2 = {}) {
    const compressor = new OSTCompression(config2);
    const { compressedBins, metadata } = compressor.encode(data);
    const binSequence = Array.from(compressedBins.keys());
    const headerJson = JSON.stringify({
      config: metadata.config,
      binSequence,
      bins: binSequence
    });
    const headerBytes = new TextEncoder().encode(headerJson);
    const headerLen = headerBytes.length;
    const headerBuf = new Uint8Array(8 + headerLen);
    headerBuf.set([79, 83, 84, 49]);
    headerBuf[4] = headerLen >> 24 & 255;
    headerBuf[5] = headerLen >> 16 & 255;
    headerBuf[6] = headerLen >> 8 & 255;
    headerBuf[7] = headerLen & 255;
    headerBuf.set(headerBytes, 8);
    const binParts = [headerBuf];
    for (const [label, data2] of compressedBins.entries()) {
      const labelBytes = new TextEncoder().encode(label);
      const labelLen = labelBytes.length;
      const lenBuf = new Uint8Array(2 + labelLen + 4 + data2.length);
      lenBuf[0] = labelLen >> 8 & 255;
      lenBuf[1] = labelLen & 255;
      lenBuf.set(labelBytes, 2);
      lenBuf[2 + labelLen + 0] = data2.length >> 24 & 255;
      lenBuf[2 + labelLen + 1] = data2.length >> 16 & 255;
      lenBuf[2 + labelLen + 2] = data2.length >> 8 & 255;
      lenBuf[2 + labelLen + 3] = data2.length & 255;
      lenBuf.set(data2, 2 + labelLen + 4);
      binParts.push(lenBuf);
    }
    const totalLen = binParts.reduce((s, b) => s + b.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const buf of binParts) {
      result.set(buf, offset);
      offset += buf.length;
    }
    return result;
  }
};

// ../core/transports/ost/OSTPackReader.ts
init_esm_shims();
var OSTPackReader = class {
  static async extractPack(pack) {
    const magic = new TextDecoder().decode(pack.slice(0, 4));
    if (magic !== "OST1") throw new Error("Invalid OST pack format");
    const headerLen = pack[4] << 24 | pack[5] << 16 | pack[6] << 8 | pack[7];
    const headerJson = new TextDecoder().decode(pack.slice(8, 8 + headerLen));
    const header = JSON.parse(headerJson);
    const compressedBins = /* @__PURE__ */ new Map();
    let offset = 8 + headerLen;
    while (offset < pack.length) {
      const labelLen = pack[offset] << 8 | pack[offset + 1];
      const label = new TextDecoder().decode(
        pack.slice(offset + 2, offset + 2 + labelLen)
      );
      const dataLenOffset = offset + 2 + labelLen;
      const dataLen = pack[dataLenOffset + 0] << 24 | pack[dataLenOffset + 1] << 16 | pack[dataLenOffset + 2] << 8 | pack[dataLenOffset + 3];
      const data = pack.slice(dataLenOffset + 4, dataLenOffset + 4 + dataLen);
      compressedBins.set(label, data);
      offset = dataLenOffset + 4 + dataLen;
    }
    const compressor = new OSTCompression(header.config);
    return compressor.decode({ compressedBins, metadata: { ...header } });
  }
};

// ../core/vfs/adapter/ost.ts
var OstVfsAdapter = class {
  constructor(base, config2 = {}) {
    this.base = base;
    this.config = config2;
  }
  prefix = "/";
  scheme = "ost";
  getscheme() {
    return this.base.scheme;
  }
  mount() {
    throw new Error("Method not implemented.");
  }
  unmount() {
    throw new Error("Method not implemented.");
  }
  readFile(path13) {
    throw new Error("Method not implemented.");
  }
  writeFile(path13, data) {
    throw new Error("Method not implemented.");
  }
  readdir(path13) {
    throw new Error("Method not implemented.");
  }
  stat(path13) {
    throw new Error("Method not implemented.");
  }
  /* ----------------------------------------------------------- */
  /* File operations                                             */
  /* ----------------------------------------------------------- */
  async open(path13, mode) {
    const file = await this.base.open(path13, mode);
    const self = this;
    return {
      async read(buffer, length) {
        const tmp = new Uint8Array(length);
        const readLen = await file.read(tmp, length);
        const packed = tmp.slice(0, readLen);
        if (packed.length === 0) return 0;
        const plain = await OSTPackReader.extractPack(packed);
        const bytes = new TextEncoder().encode(plain);
        buffer.set(bytes.subarray(0, buffer.length));
        return bytes.length;
      },
      async write(data) {
        const plain = new TextDecoder().decode(data);
        const packed = await OSTPackWriter.createPack(plain, self.config);
        return file.write(packed);
      },
      /* passthroughs */
      async seek(o, w) {
        await file.seek(o, w);
      },
      async flush() {
        await file.flush();
      },
      async close() {
        await file.close();
      },
      async getInfo() {
        return file.getInfo();
      }
    };
  }
  /* ----------------------------------------------------------- */
  /* Passthrough helpers                                         */
  /* ----------------------------------------------------------- */
  create = (p) => this.base.create(p);
  delete = (p) => this.base.delete(p);
  exists = (p) => this.base.exists(p);
  info = (p) => this.base.info(p);
  list = (p) => this.base.list(p);
  mkdir = (p) => this.base.mkdir(p);
  rmdir = (p, r) => this.base.rmdir(p, r);
};
var createOstVFS = (base, cfg = {}) => new OstVfsAdapter(base, cfg);

// ../core/vfs/adapter/disk-safe-vfs.ts
init_esm_shims();
import { promises as fs7 } from "node:fs";
import * as path8 from "node:path";
import { randomBytes } from "node:crypto";
import EventEmitter3 from "node:events";
import chokidar from "chokidar";
import bsdiff from "bsdiff-node";
function safeCwd() {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd();
  }
  return "/";
}
var ROOT_DEFAULT = path8.join(safeCwd(), "data", "vfs");
var VERS_DIR = ".vfs_versions";
var META_EXT = ".json";
var DELTA_EXT = ".bsdiff";
var safe = (root, p) => {
  const r = path8.resolve(root, p.replace(/^\/+/, ""));
  if (!r.startsWith(root)) throw new Error("Path escape");
  return r;
};
var syncClose = async (h) => {
  if (typeof h.sync === "function") await h.sync();
  await h.close();
};
var DiskSafeVFS = class extends EventEmitter3 {
  constructor(opts = {}) {
    super();
    this.opts = opts;
    this.root = path8.resolve(opts.root ?? ROOT_DEFAULT);
    this.crypto = opts.crypto;
    this.versionsEnabled = opts.versioning !== false;
    this.pruneCfg = {
      keepLatest: 5,
      maxVersions: 50,
      maxAgeDays: 90,
      maxTotalBytes: 50 * 1024 * 1024,
      ...opts.prune
    };
  }
  prefix = "/";
  scheme = "disk-safe";
  root;
  crypto;
  watcher;
  versionsEnabled;
  pruneCfg;
  /* ---------------- Lifecycle ---------------- */
  async mount() {
    await fs7.mkdir(this.root, { recursive: true });
    if (this.versionsEnabled) {
      await fs7.mkdir(path8.join(this.root, VERS_DIR), { recursive: true });
    }
    if (this.opts.watch) {
      this.watcher = chokidar.watch(this.root, { ignoreInitial: true, depth: Infinity });
      ["add", "change", "unlink", "addDir", "unlinkDir"].forEach((evt) => this.watcher.on(evt, (p) => this.emit(evt, path8.relative(this.root, p))));
    }
  }
  async unmount() {
    await this.watcher?.close();
  }
  /* ---------------- Encryption helpers ---------------- */
  async enc(data) {
    return this.crypto ? this.crypto.encrypt(data) : data;
  }
  async dec(data) {
    return this.crypto ? this.crypto.decrypt(data) : data;
  }
  /* ---------------- Atomic write ---------------- */
  async atomicWrite(full, data) {
    const dir = path8.dirname(full);
    await fs7.mkdir(dir, { recursive: true });
    const tmp = path8.join(dir, `.tmp-${randomBytes(4).toString("hex")}`);
    const fh = await fs7.open(tmp, "wx", 384);
    await fh.writeFile(data);
    await syncClose(fh);
    await fs7.rename(tmp, full);
  }
  /* ---------------- Version helpers ---------------- */
  versDir(rel) {
    return path8.join(this.root, VERS_DIR, path8.dirname(rel));
  }
  async latestMeta(rel) {
    const metas = await this.listMetas(rel);
    return metas[0] ?? null;
  }
  async listMetas(rel) {
    const dir = this.versDir(rel);
    try {
      const files = (await fs7.readdir(dir)).filter((f) => f.startsWith(path8.basename(rel)) && f.endsWith(META_EXT));
      const metas = await Promise.all(files.map(async (f) => JSON.parse((await fs7.readFile(path8.join(dir, f))).toString())));
      return metas.sort((a, b) => b.ctime - a.ctime);
    } catch {
      return [];
    }
  }
  async loadVersionData(rel, id) {
    const dir = this.versDir(rel);
    const base = path8.join(dir, `${path8.basename(rel)}.${id}`);
    const meta = JSON.parse((await fs7.readFile(base + META_EXT)).toString());
    const stored = await this.dec(await fs7.readFile(base + (meta.type === "delta" ? DELTA_EXT : ".full")));
    let plain;
    if (meta.type === "full") {
      plain = stored;
    } else {
      const parent = await this.loadVersionData(rel, meta.parent);
      plain = bsdiff.patch(parent, stored);
    }
    if (Blake3.from(plain).hex !== meta.hash) throw new Error("Version hash mismatch \u2013 data corrupted");
    return plain;
  }
  async saveVersion(rel, plain) {
    if (!this.versionsEnabled) return;
    const dir = this.versDir(rel);
    await fs7.mkdir(dir, { recursive: true });
    const ts = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const id = ts;
    const metaName = `${path8.basename(rel)}.${id}${META_EXT}`;
    const metaPath = path8.join(dir, metaName);
    let type = "full";
    let payload;
    let parentId;
    const prev = await this.latestMeta(rel);
    if (prev) {
      const prevPlain = await this.loadVersionData(rel, prev.id);
      const diffBuf = bsdiff.diff(prevPlain, plain);
      if (diffBuf.length < plain.length * 0.6) {
        type = "delta";
        payload = diffBuf;
        parentId = prev.id;
      } else {
        payload = plain;
      }
    } else {
      payload = plain;
    }
    const encrypted = await this.enc(payload);
    const dataPath = metaPath.replace(META_EXT, type === "delta" ? DELTA_EXT : ".full");
    await this.atomicWrite(dataPath, encrypted);
    const meta = {
      id,
      hash: Blake3.from(plain).hex,
      size: encrypted.length,
      type,
      parent: parentId,
      ctime: Date.now()
    };
    await this.atomicWrite(metaPath, Buffer.from(JSON.stringify(meta)));
    await this.pruneVersions(rel);
  }
  /* ---------------- Pruning ---------------- */
  async pruneVersions(rel) {
    const metas = await this.listMetas(rel);
    const { keepLatest, maxVersions, maxAgeDays, maxTotalBytes } = this.pruneCfg;
    let candidates = metas.slice(keepLatest);
    if (metas.length > maxVersions) candidates = metas.slice(maxVersions);
    const cutoff = Date.now() - maxAgeDays * 864e5;
    candidates.push(...metas.filter((m) => m.ctime < cutoff));
    let keptSize = metas.filter((m) => !candidates.includes(m)).reduce((s, m) => s + m.size, 0);
    for (const m of metas) {
      if (candidates.includes(m)) continue;
      if (keptSize <= maxTotalBytes) break;
      candidates.push(m);
      keptSize -= m.size;
    }
    const toDel = [...new Set(candidates)];
    for (const m of toDel) {
      const base = path8.join(this.versDir(rel), `${path8.basename(rel)}.${m.id}`);
      await fs7.rm(base + META_EXT, { force: true });
      await fs7.rm(base + (m.type === "delta" ? DELTA_EXT : ".full"), { force: true });
    }
  }
  /* ---------------- IVirtualFileSystem: open ---------------- */
  async open(rel, mode) {
    const full = safe(this.root, rel);
    if (mode === "r" /* READ */) {
      const raw = await fs7.readFile(full);
      const plain = await this.dec(raw);
      let cursor = 0;
      return {
        async read(buf, len) {
          const slice = plain.slice(cursor, cursor + len);
          buf.set(slice);
          cursor += slice.length;
          return slice.length;
        },
        write: async () => {
          throw new Error("read-only handle");
        },
        seek: async (off, whence) => {
          cursor = whence === "SET" ? off : whence === "CUR" ? cursor + off : plain.length + off;
        },
        flush: async () => {
        },
        close: async () => {
        },
        getInfo: async () => this.info(rel)
      };
    }
    const chunks = [];
    return {
      async read() {
        throw new Error("write-only handle");
      },
      async write(chunk) {
        chunks.push(chunk);
        return chunk.length;
      },
      async seek() {
      },
      async flush() {
      },
      close: async () => {
        const plain = Uint8Array.from(Buffer.concat(chunks));
        await this.saveVersion(rel, plain);
        await this.atomicWrite(full, await this.enc(plain));
      },
      getInfo: async () => this.info(rel)
    };
  }
  /* ---------------- Convenience & Metadata ---------------- */
  async exists(p) {
    try {
      await fs7.access(safe(this.root, p));
      return true;
    } catch {
      return false;
    }
  }
  async info(p) {
    const st = await fs7.stat(safe(this.root, p));
    return { path: p, size: st.size, mtime: st.mtimeMs, isDir: st.isDirectory() };
  }
  async readFile(p) {
    return this.dec(await fs7.readFile(safe(this.root, p)));
  }
  async writeFile(p, data) {
    await this.saveVersion(p, data);
    await this.atomicWrite(safe(this.root, p), await this.enc(data));
  }
  async delete(p) {
    if (await this.exists(p)) {
      const current = await this.readFile(p);
      await this.saveVersion(p, current);
      await fs7.rm(safe(this.root, p), { force: true });
    }
  }
  async mkdir(p) {
    await fs7.mkdir(safe(this.root, p), { recursive: true });
  }
  async rmdir(p, recursive = false) {
    await fs7.rm(safe(this.root, p), { recursive, force: true });
  }
  async list(rel = "/") {
    const out = [];
    const recurse = async (dirRel) => {
      const abs = safe(this.root, dirRel);
      for (const ent of await fs7.readdir(abs, { withFileTypes: true })) {
        const childRel = path8.join(dirRel, ent.name);
        out.push(await this.info(childRel));
        if (ent.isDirectory()) await recurse(childRel);
      }
    };
    await recurse(rel);
    return out;
  }
  async readdir(rel = "/") {
    return (await this.list(rel)).filter((f) => path8.dirname(f.path) === rel);
  }
  async stat(p) {
    return await this.exists(p) ? await this.info(p) : null;
  }
  async copy(src, dst) {
    await fs7.cp(safe(this.root, src), safe(this.root, dst), { recursive: true });
  }
  async rename(src, dst) {
    await fs7.rename(safe(this.root, src), safe(this.root, dst));
  }
  /* ---------------- Version public helpers ---------------- */
  async listVersions(p) {
    return this.listMetas(p);
  }
  async restoreVersion(p, id) {
    const data = await this.loadVersionData(p, id);
    await this.atomicWrite(safe(this.root, p), await this.enc(data));
  }
  // @ts-ignore
  async purgeVersions(p, keepLatest = this.pruneCfg.keepLatest) {
    const metas = await this.listMetas(p);
    for (const m of metas.slice(keepLatest)) {
      const base = path8.join(this.versDir(p), `${path8.basename(p)}.${m.id}`);
      await fs7.rm(base + META_EXT, { force: true });
      await fs7.rm(base + (m.type === "delta" ? DELTA_EXT : ".full"), { force: true });
    }
  }
  async create(p) {
    const full = safe(this.root, p);
    await fs7.mkdir(path8.dirname(full), { recursive: true });
    await fs7.writeFile(full, Buffer.alloc(0));
  }
};
var createDiskSafeVFS = (root, crypto2, opts = {}) => new DiskSafeVFS({ root, crypto: crypto2, ...opts });

// ../core/vfs/container/vfs-container-manager.ts
import path9 from "path";
var VFSContainerManager = class _VFSContainerManager {
  static containers = /* @__PURE__ */ new Map();
  static vault;
  static async create(uid) {
    const { publicKey, privateKey } = await new KyberKeyExchange().generateKeyPair();
    const signer = await falcon_default.FalconKeyPair();
    const id = Blake3.from(Buffer.from(publicKey).toString("hex")).hex;
    const transport = new SecureMemoryTransport({ isServer: true });
    const mem = createMemoryVFS();
    const ostVfs = createOstVFS(mem, { compressionMethod: "brotli" });
    const store = new SafeStorage(ostVfs, "/store");
    const stream = createStreamAdapter(this.vault);
    const dsRoot = path9.join(process.cwd(), "data", "vfs");
    const t = new SecureMemoryTransport({ isServer: true });
    await t.init();
    const diskSafe = createDiskSafeVFS(dsRoot, t.getContext().crypto.encryption);
    const storeRoot = path9.join(process.cwd(), "data", "store");
    const storage = new SafeStorage(diskSafe, storeRoot);
    const container = {
      id,
      publicKey,
      privateKey,
      signer,
      fs: diskSafe,
      store,
      mounts: /* @__PURE__ */ new Map([
        ["/memory", mem],
        ["/secure", diskSafe],
        ["/store", diskSafe],
        ["/vault", mem],
        ["/p2p", ostVfs],
        ["/packed", ostVfs],
        ["/stream", stream]
      ]),
      async destroy() {
        this.mounts.clear();
        _VFSContainerManager.containers.delete(id);
      },
      async snapshot() {
        const meta = JSON.stringify({
          id,
          createdAt: Date.now(),
          publicKey: Buffer.from(publicKey).toString("base64")
        });
        const hash = Blake3.from(meta).hash;
        const sig = await falcon_default.FalconSignDetached(hash, signer.privateKey);
        return new Uint8Array([...hash, ...sig]);
      }
    };
    this.containers.set(id, container);
    return container;
  }
  static get(id) {
    return this.containers.get(id);
  }
  static list() {
    return Array.from(this.containers.values());
  }
  static async destroy(id) {
    const container = this.containers.get(id);
    if (container) await container.destroy();
  }
};

// ../core/runtime/ArchipelagoRenderer.ts
var config = {
  autoHydrate: true,
  enableQuantumRendering: false,
  enablePriorityPrediction: true,
  enableEdgeMesh: false,
  debug: false
};
var initialized2 = false;
async function initializeArchipelago(userConfig = {}) {
  if (initialized2) return;
  config = { ...config, ...userConfig };
  initialized2 = true;
  await callLifecycle("onInitGlobal", { config });
  if (config.autoHydrate && typeof window !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", hydrateDomAutomatically);
    } else {
      hydrateDomAutomatically();
    }
  }
  if (config.debug) {
    console.debug("[Archipelago] Initialized with config:", config);
  }
}
var ArchipelagoRenderer = {
  initialize: initializeArchipelago,
  hydrateDom: hydrateDomAutomatically,
  registerComponent,
  registerModule,
  resolveComponent,
  listRegisteredComponents,
  async registerContainerSession(uid) {
    return await VFSContainerManager.create(uid);
  },
  get config() {
    return config;
  }
};
if (typeof window !== "undefined") {
  window.ArchipelagoRenderer = ArchipelagoRenderer;
}

// ../core/runtime/main.ts
async function startArchipelago(userConfig = {}) {
  if (typeof window !== "undefined") {
    window.ArchipelagoRenderer = ArchipelagoRenderer;
  }
  await ArchipelagoRenderer.initialize(userConfig);
  const controller = HydrationController.getInstance();
  await controller.initialize();
  const pool = RenderWorkerPool.getInstance();
  const manager = new HydratableElementManager();
  manager.scanAndQueueAll();
  if (ArchipelagoRenderer.config.debug) {
    console.debug("[Archipelago] Started with debug mode");
  }
}

// commands/hydrate.ts
async function runHydrate(opts) {
  await startArchipelago({ debug: !!opts.debug });
}

// commands/render.ts
init_esm_shims();
import * as fs9 from "fs";
import * as path11 from "path";

// ../core/cli/template-renderer.ts
init_esm_shims();

// ../core/renderer/template-parser.ts
init_esm_shims();
var TemplateParser = class {
  constructor() {
  }
  parse(template) {
    const errors = [];
    let componentName = "";
    let attributes = {};
    let slots = {};
    let expressions = [];
    let directives;
    try {
      componentName = this.extractComponentName(template) || "";
      attributes = this.parseAttributes(template);
      slots = this.parseSlots(template);
      expressions = this.parseExpressions(template);
      directives = this.parseDirectives(attributes);
    } catch (err) {
      errors.push(`Parsing failed: ${err.message}`);
    }
    return { componentName, attributes, slots, expressions, directives, errors };
  }
  extractComponentName(template) {
    const match = template.match(/<([A-Z][a-zA-Z0-9]*)[\s>]/);
    return match ? match[1] : null;
  }
  parseAttributes(template) {
    const attributes = {};
    const attributeRegex = /([a-zA-Z0-9_:@\-]+)="([^"]*)"/g;
    let match;
    while ((match = attributeRegex.exec(template)) !== null) {
      const [, name, value] = match;
      attributes[name] = value;
    }
    return attributes;
  }
  parseSlots(template) {
    const slots = {};
    const slotRegex = /<slot name="([^"]*)"[^>]*>([\s\S]*?)<\/slot>/g;
    let match;
    while ((match = slotRegex.exec(template)) !== null) {
      const [, name, content] = match;
      slots[name] = content.trim();
    }
    return slots;
  }
  parseExpressions(template) {
    const expressions = [];
    const expressionRegex = /\{\{\s*([^}]+?)\s*\}\}/g;
    let match;
    while ((match = expressionRegex.exec(template)) !== null) {
      const [, expr] = match;
      expressions.push(expr.trim());
    }
    return expressions;
  }
  /**
   * Extract directives like v-if, v-for, and :bindings from attributes
   */
  parseDirectives(attributes) {
    const directives = {
      bindings: {}
    };
    for (const [key, value] of Object.entries(attributes)) {
      if (key === "v-if") {
        directives.vIf = value;
      } else if (key === "v-for") {
        const match = value.match(/^([a-zA-Z0-9_$]+)\s+in\s+([a-zA-Z0-9_$.]+)$/);
        if (match) {
          const [, item, iterable] = match;
          directives.vFor = { item, iterable };
        }
      } else if (key.startsWith(":")) {
        const bindingName = key.slice(1);
        directives.bindings[bindingName] = value;
      }
    }
    return directives;
  }
};

// ../core/renderer/html-transformer.ts
init_esm_shims();
var HtmlTransformer = class _HtmlTransformer {
  constructor(context, options = {}) {
    this.context = context;
    this.options = options;
  }
  transform(template) {
    if (this.shouldSkip(template)) return "";
    if (template.directives?.vFor) {
      return this.renderLoop(template);
    }
    const tag = template.componentName;
    const attrs = {};
    const bindings = template.directives?.bindings || {};
    for (const [name, expr] of Object.entries(bindings)) {
      try {
        const value = this.evalInContext(expr);
        attrs[name] = String(value);
      } catch {
        attrs[name] = "";
      }
    }
    for (const [name, value] of Object.entries(template.attributes)) {
      if (!name.startsWith(":") && name !== "v-if" && name !== "v-for") {
        attrs[name] = this.interpolate(value);
      }
    }
    if (this.options.hydrate) {
      attrs["data-hydrate"] = "true";
      attrs["data-component"] = tag;
    }
    const attrString = Object.entries(attrs).map(([key, val]) => `${key}="${val}"`).join(" ");
    const innerHTML = Object.values(template.slots).map((content) => this.interpolate(content)).join("");
    if (this.options.clientOnly && !this.options.ssr) {
      return `<${tag} />`;
    }
    return `<${tag}${attrString ? " " + attrString : ""}>${innerHTML}</${tag}>`;
  }
  renderLoop(template) {
    const { item, iterable } = template.directives.vFor;
    const array = this.evalInContext(iterable);
    if (!Array.isArray(array)) return "";
    return array.map((value, index) => {
      const scopedContext = {
        ...this.context,
        [item]: value,
        index
      };
      const instance = new _HtmlTransformer(scopedContext, this.options);
      const clone = {
        ...template,
        directives: { ...template.directives, vFor: void 0 }
        // Prevent recursion
      };
      return instance.transform(clone);
    }).join("");
  }
  shouldSkip(template) {
    const expr = template.directives?.vIf;
    if (!expr) return false;
    try {
      const result = this.evalInContext(expr);
      return !result;
    } catch {
      return false;
    }
  }
  interpolate(content) {
    return content.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr) => {
      try {
        const result = this.evalInContext(expr);
        return result != null ? String(result) : "";
      } catch {
        return "";
      }
    });
  }
  evalInContext(expr) {
    return Function(...Object.keys(this.context), `return (${expr})`)(
      ...Object.values(this.context)
    );
  }
};

// ../core/cli/template-renderer.ts
import * as path10 from "path";
import * as fs8 from "fs";
var TemplateRenderer = class {
  parser;
  parserOptions;
  initialized = false;
  constructor(parserOptions = {}) {
    this.parser = new TemplateParser();
    this.parserOptions = parserOptions;
  }
  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
  }
  resolveArchipelagoDir(base) {
    if (base.endsWith("archipelago")) return base;
    if (fs8.existsSync(path10.join(base, "archipelago"))) return path10.join(base, "archipelago");
    if (path10.basename(base) === "Archipelago_Framework") return path10.join(base, "archipelago");
    return base;
  }
  async render(template, context = {}, options = {}) {
    if (!this.initialized) await this.initialize();
    return this.processTemplate(template, context, options);
  }
  renderSync(template, context = {}, options = {}) {
    return this.processTemplate(template, context, options);
  }
  async renderWithHydration(template, context = {}, options = {}) {
    return this.render(template, context, { ...options, hydrate: true });
  }
  renderWithHydrationSync(template, context = {}, options = {}) {
    return this.renderSync(template, context, { ...options, hydrate: true });
  }
  async renderClientOnly(template, context = {}, options = {}) {
    return this.render(template, context, { ...options, clientOnly: true, ssr: false });
  }
  renderClientOnlySync(template, context = {}, options = {}) {
    return this.renderSync(template, context, { ...options, clientOnly: true, ssr: false });
  }
  async renderFile(filePath, context = {}, options = {}) {
    try {
      const template = fs8.readFileSync(filePath, "utf-8");
      return this.render(template, context, options);
    } catch (error) {
      console.error(`Error rendering file: ${filePath}`, error);
      return `<!-- Error rendering file: ${filePath} -->`;
    }
  }
  preprocess(template) {
    return template;
  }
  processTemplate(template, context, options) {
    const preprocessed = this.preprocess(template);
    const ast = this.parser.parse(preprocessed);
    const transformer = new HtmlTransformer(context, options);
    return transformer.transform(ast);
  }
};

// commands/render.ts
import chokidar2 from "chokidar";
function loadContextForFile(filePath, defaultContextPath) {
  const dir = path11.dirname(filePath);
  const baseName = path11.basename(filePath, path11.extname(filePath));
  const fileContextPath = path11.join(dir, `${baseName}.context.json`);
  let globalCtx = {};
  let fileCtx = {};
  if (fs9.existsSync(defaultContextPath)) {
    try {
      globalCtx = JSON.parse(fs9.readFileSync(defaultContextPath, "utf-8"));
    } catch {
    }
  }
  if (fs9.existsSync(fileContextPath)) {
    try {
      fileCtx = JSON.parse(fs9.readFileSync(fileContextPath, "utf-8"));
    } catch {
    }
  }
  return { ...globalCtx, ...fileCtx };
}
async function renderFile(renderer, filePath, outputDir, defaultCtxPath) {
  try {
    const context = loadContextForFile(filePath, defaultCtxPath);
    const content = fs9.readFileSync(filePath, "utf-8");
    const html = await renderer.renderWithHydration(content, context);
    const outputFile = path11.join(outputDir, path11.basename(filePath).replace(/\.\w+$/, ".html"));
    fs9.writeFileSync(outputFile, html);
    console.log(`\u2705 Rendered ${filePath} \u2192 ${outputFile}`);
  } catch (err) {
    console.error(`\u26A0\uFE0F Error rendering ${filePath}:`, err);
  }
}
async function runRender(input, outputDir, watch = false) {
  const isDirectory = fs9.statSync(input).isDirectory();
  const defaultCtxPath = isDirectory ? path11.join(input, "context.default.json") : path11.join(path11.dirname(input), "context.default.json");
  const renderer = new TemplateRenderer();
  await renderer.initialize();
  const renderAll = async () => {
    const files = isDirectory ? fs9.readdirSync(input).filter((f) => f.endsWith(".archy")).map((f) => path11.join(input, f)) : [input];
    fs9.mkdirSync(outputDir, { recursive: true });
    console.clear();
    console.log(`\u{1F501} Rendering ${files.length} file(s)...`);
    for (const filePath of files) {
      await renderFile(renderer, filePath, outputDir, defaultCtxPath);
    }
    console.log(`\u2728 Done at ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}`);
  };
  await renderAll();
  if (watch) {
    const watchPaths = isDirectory ? [
      path11.join(input, "**/*.archy"),
      path11.join(input, "**/*.context.json"),
      defaultCtxPath
    ] : [input, input.replace(/\.archy$/, ".context.json"), defaultCtxPath];
    chokidar2.watch(watchPaths).on("change", async (changedPath) => {
      console.clear();
      console.log(`\u{1F504} File changed: ${changedPath}`);
      await renderAll();
    });
  }
}

// commands/serve.ts
init_esm_shims();
import { spawn } from "child_process";
import * as path12 from "path";
async function runServe() {
  const entry = path12.resolve("server/server.ts");
  const proc = spawn("ts-node", [entry], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "development"
    }
  });
  proc.on("close", (code) => {
    console.log(`\u{1F50C} Archipelago server exited with code ${code}`);
  });
}

// cli.ts
(async () => {
  const { isOutdated, current, latest } = await checkForCliUpdates();
  if (!isOutdated) {
    console.log(`\u26A0\uFE0F  Archipelago CLI update available: v${latest} (you have v${current})`);
    if (process.argv.includes("--update") || process.env.AUTO_UPDATE === "true") {
      await applyCliUpdate();
    } else {
      console.log(`\u{1F4A1} Run with --update or set AUTO_UPDATE=true to upgrade automatically.
`);
    }
  }
})();
var program = new Command();
program.name("archipelago").description("Archipelago CLI \u2013 Modular Edge App Framework").version("0.1.0");
program.command("create").description("Create a new app, component, page, plugin, module or store").argument("<type>", "Type to create").argument("<name>", "Name of the entity").option("--dir-path <path>", "Target directory").option("--interactive", "Prompt mode").option("--graphical", "Use browser-based graphical setup").action(async (type, name, options) => {
  const config2 = await loadConfig();
  await runCreate(type, name, options, config2);
  await logHistory(`create ${type} ${name}`);
});
program.command("render").description("Render a single .archy file or folder of .archy templates").argument("<input>", "File or directory to render").option("-o, --output <dir>", "Output directory", "dist/rendered").option("-w, --watch", "Watch for changes and re-render").action(async (input, opts) => {
  await runRender(input, opts.output);
  await logHistory(`render ${input}`);
});
program.command("hydrate").description("Run Archipelago JIT hydration with worker threads (browser mode)").option("--debug", "Enable devtool overlay").action(async (opts) => {
  await runHydrate(opts);
  await logHistory("hydrate");
});
program.command("serve").description("Start the backend server for VFS, stream, and API endpoints").action(async () => {
  await runServe();
  await logHistory("serve");
});
program.command("dev").description("Start dev server").action(async () => {
  await runDev();
  await logHistory("dev");
});
program.command("history").description("View recent CLI command history").option("-n, --limit <number>", "Number of entries", "20").action(async (opts) => {
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
