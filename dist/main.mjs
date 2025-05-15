import {
  HydrationDevOverlay
} from "./chunk-SMK2HJJW.mjs";

// core/vfs/memory-vfs.ts
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
  info(path3) {
    throw new Error("Method not implemented.");
  }
  list(path3) {
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
  async readFile(path3) {
    const entry = this.files.get(path3);
    if (!entry) throw new Error(`File not found: ${path3}`);
    return entry.data;
  }
  async writeFile(path3, data) {
    if (!await this.exists(path3)) {
      await this.create(path3);
    }
    const entry = this.files.get(path3);
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
  async stat(path3) {
    if (this.files.has(path3)) return { mtime: 0, ...this.files.get(path3).info };
    if (this.directories.has(path3)) {
      return {
        mtime: 0,
        path: path3,
        size: 0
      };
    }
    return null;
  }
  /* ------------------------------------------------------------------ */
  /*  Random‑access file API                                            */
  /* ------------------------------------------------------------------ */
  async open(path3, mode) {
    if (!await this.exists(path3)) {
      if (mode === "r" /* READ */) {
        throw new Error(`File not found: ${path3}`);
      }
      await this.create(path3);
    }
    const file = this.files.get(path3);
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
  async create(path3) {
    const now = Date.now();
    this.files.set(path3, {
      data: new Uint8Array(0),
      info: {
        name: path3.split("/").pop() || path3,
        path: path3,
        size: 0,
        createdAt: now,
        updatedAt: now,
        isDirectory: false
      }
    });
  }
  async delete(path3) {
    if (!this.files.delete(path3)) {
      throw new Error(`File not found: ${path3}`);
    }
  }
  async exists(path3) {
    return this.files.has(path3) || this.directories.has(path3);
  }
  async mkdir(path3) {
    this.directories.add(path3.endsWith("/") ? path3.slice(0, -1) : path3);
  }
  async rmdir(path3, recursive = false) {
    if (!this.directories.has(path3)) throw new Error(`Directory not found: ${path3}`);
    this.directories.delete(path3);
    if (recursive) {
      for (const filePath of [...this.files.keys()]) {
        if (filePath.startsWith(`${path3}/`)) this.files.delete(filePath);
      }
    }
  }
};
function createMemoryVFS() {
  const vfs = new MemoryVFS();
  return vfs;
}

// core/vfs/registry.ts
var Registry = class {
  adapters = /* @__PURE__ */ new Map();
  /** Register an adapter (e.g. new MemoryVFS() or DtlsVfsAdapter). */
  register(adapter) {
    if (this.adapters.has(adapter.scheme))
      throw new Error(`VFS adapter for scheme "${adapter.scheme}" already registered`);
    this.adapters.set(adapter.scheme, adapter);
    adapter.mount().catch((err) => console.error(`[VFS] Mount error: ${err}`));
  }
  /** Fetch adapter by scheme (e.g. "dtls"). */
  get(scheme) {
    const a = this.adapters.get(scheme);
    if (!a) throw new Error(`No VFS adapter registered for scheme "${scheme}"`);
    return a;
  }
  /** Resolve a full path like "dtls://host/file.txt" into adapter + local path. */
  resolve(full) {
    const [schemeRaw, rest] = full.split("://");
    const scheme = schemeRaw || "mem";
    return {
      adapter: this.get(scheme),
      // ensure exactly one leading slash on the local path
      path: rest ? "/" + rest.replace(/^\/+/, "") : "/"
    };
  }
  async readFile(fullPath) {
    const { adapter, path: path3 } = this.resolve(fullPath);
    return adapter.readFile(path3);
  }
  async writeFile(fullPath, data) {
    const { adapter, path: path3 } = this.resolve(fullPath);
    if (!adapter.writeFile) throw new Error(`${adapter.scheme} VFS is read\u2011only`);
    await adapter.writeFile(path3, data);
  }
  listSchemes() {
    return Array.from(this.adapters.keys());
  }
};
var VfsRegistry = new Registry();

// core/runtime/utils.ts
function datasetToProps(el) {
  const props = {};
  for (const [key2, value] of Object.entries(el.dataset)) {
    try {
      props[key2] = JSON.parse(value);
    } catch {
      props[key2] = value;
    }
  }
  return props;
}
function isVisible(el) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

// core/runtime/pubsub.ts
var subs = {};
function subscribe(topic, fn) {
  if (!subs[topic]) subs[topic] = /* @__PURE__ */ new Set();
  subs[topic].add(fn);
  return () => subs[topic].delete(fn);
}

// core/runtime/lazy-import.ts
async function LazyImportElement(el) {
  const name = el.dataset.name;
  if (!name) return;
  const isRemote = name.startsWith("http://") || name.startsWith("https://");
  const props = datasetToProps(el);
  const container = document.createElement("div");
  el.replaceWith(container);
  const hydrate = async () => {
    try {
      const mod = await import(
        /* @vite-ignore */
        name
      );
      const Component = mod?.default || mod;
      if (typeof Component === "function") {
        const output = Component(props);
        if (output instanceof HTMLElement) {
          container.replaceChildren(output);
        } else if (typeof output === "string") {
          container.innerHTML = output;
        }
      }
    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error loading "${name}"</div>`;
      console.error("LazyImport error:", err);
    }
  };
  if (props.subscribe) {
    subscribe(name, () => hydrate());
  }
}
function hydrateVisibleLazyImports() {
  const elements = document.querySelectorAll("lazy-import,LazyImport");
  elements.forEach((el) => {
    if (isVisible(el)) {
      LazyImportElement(el);
    } else {
      const io = new IntersectionObserver(([entry], obs) => {
        if (entry.isIntersecting) {
          obs.unobserve(entry.target);
          LazyImportElement(entry.target);
        }
      });
      io.observe(el);
    }
  });
}
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hydrateVisibleLazyImports);
  } else {
    hydrateVisibleLazyImports();
  }
}

// core/runtime/render-worker-pool.ts
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

// core/runtime/hydration-controller.ts
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
        const { HydrationDevOverlay: HydrationDevOverlay2 } = await import("./hydration-dev-overlay-JAFSHJ4W.mjs");
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

// core/runtime/index.ts
if (typeof window !== "undefined") {
  window.__archipelago__ = {
    version: "0.1.0",
    name: "Archipelago",
    description: "A framework for building distributed applications."
  };
}

// core/renderer/template-parser.ts
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
    for (const [key2, value] of Object.entries(attributes)) {
      if (key2 === "v-if") {
        directives.vIf = value;
      } else if (key2 === "v-for") {
        const match = value.match(/^([a-zA-Z0-9_$]+)\s+in\s+([a-zA-Z0-9_$.]+)$/);
        if (match) {
          const [, item, iterable] = match;
          directives.vFor = { item, iterable };
        }
      } else if (key2.startsWith(":")) {
        const bindingName = key2.slice(1);
        directives.bindings[bindingName] = value;
      }
    }
    return directives;
  }
};

// main.ts
import * as path2 from "path";
import * as fs2 from "fs";

// core/vfs/adapter/disk-safe-vfs.ts
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { randomBytes } from "node:crypto";
import EventEmitter from "node:events";
import chokidar from "chokidar";

// core/crypto/hash.ts
import { blake3 } from "@noble/hashes/blake3";
var Blake3 = class _Blake3 {
  hash;
  mac;
  key;
  ctx;
  hex;
  base64;
  constructor(input, context, key2) {
    const inputBytes = new TextEncoder().encode(input);
    this.hash = blake3(inputBytes);
    this.hex = Buffer.from(this.hash).toString("hex");
    this.base64 = Buffer.from(this.hash).toString("base64");
    if (key2) {
      this.key = blake3(this.hash, { key: key2 });
    }
    if (context) {
      this.ctx = blake3(this.hash, { context });
    }
    this.mac = blake3(this.hash, { key: new Uint8Array(32) });
  }
  /**
   * Creates a new Blake3 instance and returns only the result
   */
  static from(input, context, key2) {
    return new _Blake3(input, context, key2);
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

// core/vfs/adapter/disk-safe-vfs.ts
import bsdiff from "bsdiff-node";
function safeCwd() {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd();
  }
  return "/";
}
var ROOT_DEFAULT = path.join(safeCwd(), "data", "vfs");
var VERS_DIR = ".vfs_versions";
var META_EXT = ".json";
var DELTA_EXT = ".bsdiff";
var safe = (root, p) => {
  const r = path.resolve(root, p.replace(/^\/+/, ""));
  if (!r.startsWith(root)) throw new Error("Path escape");
  return r;
};
var syncClose = async (h) => {
  if (typeof h.sync === "function") await h.sync();
  await h.close();
};
var DiskSafeVFS = class extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.opts = opts;
    this.root = path.resolve(opts.root ?? ROOT_DEFAULT);
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
    await fs.mkdir(this.root, { recursive: true });
    if (this.versionsEnabled) {
      await fs.mkdir(path.join(this.root, VERS_DIR), { recursive: true });
    }
    if (this.opts.watch) {
      this.watcher = chokidar.watch(this.root, { ignoreInitial: true, depth: Infinity });
      ["add", "change", "unlink", "addDir", "unlinkDir"].forEach((evt) => this.watcher.on(evt, (p) => this.emit(evt, path.relative(this.root, p))));
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
    const dir = path.dirname(full);
    await fs.mkdir(dir, { recursive: true });
    const tmp = path.join(dir, `.tmp-${randomBytes(4).toString("hex")}`);
    const fh = await fs.open(tmp, "wx", 384);
    await fh.writeFile(data);
    await syncClose(fh);
    await fs.rename(tmp, full);
  }
  /* ---------------- Version helpers ---------------- */
  versDir(rel) {
    return path.join(this.root, VERS_DIR, path.dirname(rel));
  }
  async latestMeta(rel) {
    const metas = await this.listMetas(rel);
    return metas[0] ?? null;
  }
  async listMetas(rel) {
    const dir = this.versDir(rel);
    try {
      const files = (await fs.readdir(dir)).filter((f) => f.startsWith(path.basename(rel)) && f.endsWith(META_EXT));
      const metas = await Promise.all(files.map(async (f) => JSON.parse((await fs.readFile(path.join(dir, f))).toString())));
      return metas.sort((a, b) => b.ctime - a.ctime);
    } catch {
      return [];
    }
  }
  async loadVersionData(rel, id) {
    const dir = this.versDir(rel);
    const base = path.join(dir, `${path.basename(rel)}.${id}`);
    const meta = JSON.parse((await fs.readFile(base + META_EXT)).toString());
    const stored = await this.dec(await fs.readFile(base + (meta.type === "delta" ? DELTA_EXT : ".full")));
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
    await fs.mkdir(dir, { recursive: true });
    const ts = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const id = ts;
    const metaName = `${path.basename(rel)}.${id}${META_EXT}`;
    const metaPath = path.join(dir, metaName);
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
      const base = path.join(this.versDir(rel), `${path.basename(rel)}.${m.id}`);
      await fs.rm(base + META_EXT, { force: true });
      await fs.rm(base + (m.type === "delta" ? DELTA_EXT : ".full"), { force: true });
    }
  }
  /* ---------------- IVirtualFileSystem: open ---------------- */
  async open(rel, mode) {
    const full = safe(this.root, rel);
    if (mode === "r" /* READ */) {
      const raw = await fs.readFile(full);
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
      await fs.access(safe(this.root, p));
      return true;
    } catch {
      return false;
    }
  }
  async info(p) {
    const st = await fs.stat(safe(this.root, p));
    return { path: p, size: st.size, mtime: st.mtimeMs, isDir: st.isDirectory() };
  }
  async readFile(p) {
    return this.dec(await fs.readFile(safe(this.root, p)));
  }
  async writeFile(p, data) {
    await this.saveVersion(p, data);
    await this.atomicWrite(safe(this.root, p), await this.enc(data));
  }
  async delete(p) {
    if (await this.exists(p)) {
      const current = await this.readFile(p);
      await this.saveVersion(p, current);
      await fs.rm(safe(this.root, p), { force: true });
    }
  }
  async mkdir(p) {
    await fs.mkdir(safe(this.root, p), { recursive: true });
  }
  async rmdir(p, recursive = false) {
    await fs.rm(safe(this.root, p), { recursive, force: true });
  }
  async list(rel = "/") {
    const out = [];
    const recurse = async (dirRel) => {
      const abs = safe(this.root, dirRel);
      for (const ent of await fs.readdir(abs, { withFileTypes: true })) {
        const childRel = path.join(dirRel, ent.name);
        out.push(await this.info(childRel));
        if (ent.isDirectory()) await recurse(childRel);
      }
    };
    await recurse(rel);
    return out;
  }
  async readdir(rel = "/") {
    return (await this.list(rel)).filter((f) => path.dirname(f.path) === rel);
  }
  async stat(p) {
    return await this.exists(p) ? await this.info(p) : null;
  }
  async copy(src, dst) {
    await fs.cp(safe(this.root, src), safe(this.root, dst), { recursive: true });
  }
  async rename(src, dst) {
    await fs.rename(safe(this.root, src), safe(this.root, dst));
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
      const base = path.join(this.versDir(p), `${path.basename(p)}.${m.id}`);
      await fs.rm(base + META_EXT, { force: true });
      await fs.rm(base + (m.type === "delta" ? DELTA_EXT : ".full"), { force: true });
    }
  }
  async create(p) {
    const full = safe(this.root, p);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, Buffer.alloc(0));
  }
};
var createDiskSafeVFS = (root, crypto, opts = {}) => new DiskSafeVFS({ root, crypto, ...opts });

// main.ts
var cert = fs2.readFileSync(
  // @ts-ignore
  path2.resolve(import.meta.dirname, "./certs/client.crt")
);
var key = fs2.readFileSync(
  // @ts-ignore
  path2.resolve(import.meta.dirname, "./certs/client.key")
);
(async () => {
  VfsRegistry.register(createMemoryVFS());
  VfsRegistry.register(
    createDiskSafeVFS("./data")
    // scheme: disk-safe://
  );
  const data = await VfsRegistry.readFile("disk-safe://hello.json");
  const message = new TextDecoder().decode(data);
  const tplString = `<Island>Hello over DTLS: ${message}</Island>`;
  const parsed = new TemplateParser().parse(tplString);
  const h = HydrationController.getInstance();
  await h.hydrateIsland(
    document.getElementById("root"),
    parsed.toString()
  );
})();
//# sourceMappingURL=main.mjs.map