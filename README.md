![Archipelago Logo](main/logo.svg)


# 🏝 Archipelago CLI


> Modular, edge-optimized frontend framework with secure VFS, post-quantum cryptography, and real-time hydration.

![npm](https://img.shields.io/npm/v/@archipelagoui/archipelago)
![license](https://img.shields.io/npm/l/@archipelagoui/archipelago)
![CI](https://github.com/hydradevorg/archipelagoui/actions/workflows/ci-publish.yml/badge.svg)

---

## 🚀 What is Archipelago?

**Archipelago** is a next-gen frontend framework designed for the edge.  
It features JIT hydration, secure VFS layers, native post-quantum cryptography support, and a blazing fast CLI.

> Think: Astro + Vite + Web Workers + Quantum Security — all in one.

---

## ✅ Completed Features

- ⚡ JIT Island Hydration (1 per frame)
- 🧠 Priority-based component queue
- 📦 Memory-safe virtual file system (VFS)
- 🔐 Encrypted VFS adapter
- 🌐 DTLS adapter with Kyber & Falcon (PQ crypto)
- 🧬 QuantumStream endpoint & HLS-ready streaming
- 🧩 JSX parser with template rendering
- 🧪 Fully automated CLI + CI + publish pipeline
- 💡 Devtools overlay for hydration insights

---

## 📦 Installation

```bash
pnpm add -D @archipelagoui/archipelago
```

Or run it globally:
```bash
npx archy-cli
```

---

## 🧩 CLI Usage

```bash
npx archy-cli create app my-app
npx archy-cli dev
npx archy-cli render src/pages/
```

---

## 🧪 Usage Examples

### 🔹 Render a single `.archy` file:
```bash
npx archy-cli render src/pages/about.archy
```

### 🔹 Hydrate all islands with debug mode:
```bash
npx archy-cli hydrate --debug
```

### 🔹 Serve VFS-backed site:
```bash
npx archy-cli serve
```

### 🔹 Start dev server:
```bash
npx archy-cli dev
```

---

## 🛠 CLI Commands

| Command                       | Description                                    |
|------------------------------|------------------------------------------------|
| `create <type> <name>`       | Scaffold app, page, component, plugin, store  |
| `render <input>`             | Render a `.archy` file or folder               |
| `hydrate`                    | Start hydration engine in the browser          |
| `serve`                      | Launch VFS + Stream + API server               |
| `dev`                        | Start dev server                               |
| `build`                      | Compile for production                         |
| `start`                      | Preview built project                          |
| `verify`                     | Validate project integrity                     |
| `pre-compile`                | Run JSX stub + import map generation           |
| `history`                    | View CLI command history                       |

---

## 🔄 Version Management

This project uses a `.version` file and `sync-versions.mjs` script to:

- Bump the patch version
- Sync all `package.json` files
- Trigger auto-publish via GitHub Actions

```bash
node sync-versions.mjs
pnpm publish
```

---

## 🧪 Roadmap

- [x] CLI scaffolding and VFS integration
- [x] DTLS + PQ crypto adapters (Kyber, Falcon)
- [x] Priority queue hydration system
- [x] Devtools overlay and diagnostics
- [x] Stream + verify endpoints
- [ ] Component graph visualization
- [ ] IPFS & LoRa-compatible VFS layer

---

## 📁 Project Structure

```
.
├── components/            # Archipelago .archy UI islands
├── core/                  # Hydration runtime, registry, crypto, VFS
├── scripts/               # Utilities (e.g., sync-versions.mjs)
├── .version               # Global version anchor
├── dist/                  # Compiled CLI and runtime output
└── package.json
```

---

## 🛡 License

MIT © 2025 [@archipelagoui](https://npmjs.com/org/archipelagoui)
