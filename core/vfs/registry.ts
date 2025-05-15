// core/vfs/registry.ts
import type { IVirtualFileSystem } from "./types";

class Registry {
    private adapters = new Map<string, IVirtualFileSystem>();

    /** Register an adapter (e.g. new MemoryVFS() or DtlsVfsAdapter). */
    register(adapter: IVirtualFileSystem): void {
        if (this.adapters.has(adapter.scheme))
            throw new Error(`VFS adapter for scheme "${adapter.scheme}" already registered`);
        this.adapters.set(adapter.scheme, adapter);
        // Eager‑mount by default (async fire‑and‑forget)
        adapter.mount().catch(err => console.error(`[VFS] Mount error: ${err}`));
    }

    /** Fetch adapter by scheme (e.g. "dtls"). */
    get(scheme: string): IVirtualFileSystem {
        const a = this.adapters.get(scheme);
        if (!a) throw new Error(`No VFS adapter registered for scheme "${scheme}"`);
        return a;
    }

    /** Resolve a full path like "dtls://host/file.txt" into adapter + local path. */
    private resolve(full: string): { adapter: IVirtualFileSystem; path: string } {
        const [schemeRaw, rest] = full.split("://");
        const scheme = schemeRaw || "mem"; // default to memory VFS
        return {
            adapter: this.get(scheme),
            // ensure exactly one leading slash on the local path
            path: rest ? "/" + rest.replace(/^\/+/, "") : "/",
        };
    }

  async readFile(fullPath: string): Promise<Uint8Array> {
    const { adapter, path } = this.resolve(fullPath);
    return adapter.readFile(path);
  }

  async writeFile(fullPath: string, data: Uint8Array): Promise<void> {
    const { adapter, path } = this.resolve(fullPath);
    if (!adapter.writeFile) throw new Error(`${adapter.scheme} VFS is read‑only`);
    await adapter.writeFile(path, data);
  }

  listSchemes(): string[] {
    return Array.from(this.adapters.keys());
  }
}

/** Export a singleton instance */
export const VfsRegistry = new Registry();
