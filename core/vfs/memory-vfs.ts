import {
    IVirtualFileSystem,
    IVirtualFile,
    FileMode,
    FileInfo,
    VfsFileHandle,
} from "./types";
import path from "path";

/* Internal representation */
interface InMemoryEntry {
    data: Uint8Array;
    info: FileInfo;
}

export class MemoryVFS implements IVirtualFileSystem {
    /* ------------------------------------------------------------------ */
    /*  Interface props + constructor                                     */
    /* ------------------------------------------------------------------ */
    readonly scheme = "mem";

    /* maps path → InMemoryEntry */
    private files = new Map<string, InMemoryEntry>();
    /* set of directory paths (always stored with a leading /) */
    private directories = new Set<string>(["/"]);

    constructor() {}

    info(path: string): Promise<FileInfo> {
        throw new Error("Method not implemented.");
    }
    list(path: string): Promise<FileInfo[]> {
        throw new Error("Method not implemented.");
    }

    /* ------------------------------------------------------------------ */
    /*  Lifecycle                                                         */
    /* ------------------------------------------------------------------ */
    async mount(): Promise<void> {
        /* nothing to do for pure in‑mem, but keeps interface symmetrical  */
    }

    async unmount(): Promise<void> {
        this.files.clear();
        this.directories.clear();
        this.directories.add("/"); // keep root
    }

    /* ------------------------------------------------------------------ */
    /*  File operations                                                   */
    /* ------------------------------------------------------------------ */
    async readFile(path: string): Promise<Uint8Array> {
        const entry = this.files.get(path);
        if (!entry) throw new Error(`File not found: ${path}`);
        return entry.data;
    }

    async writeFile(path: string, data: Uint8Array): Promise<void> {
        if (!(await this.exists(path))) {
            await this.create(path);
        }
        const entry = this.files.get(path)!;
        entry.data = data;
        entry.info.size = data.length;
        entry.info.updatedAt = Date.now();
    }

    async readdir(dir = "/"): Promise<VfsFileHandle[]> {
        const handles: VfsFileHandle[] = [];

        // Files directly under dir (non‑recursive)
        for (const [filePath, entry] of this.files) {
            if (filePath !== dir && filePath.startsWith(dir) && !filePath
                .slice(dir.length)
                .includes("/")) {
                handles.push({
                    ...entry.info,
                    mtime: 0
                });
            }
        }

        // Child directories
        for (const sub of this.directories) {
            if (sub !== dir && sub.startsWith(dir) && !sub.slice(dir.length).includes("/")) {
                handles.push({

                    path: sub,
                    size: 0,

                    mtime: 0,
                });
            }
        }

        return handles;
    }

    async stat(path: string): Promise<VfsFileHandle | null> {
        if (this.files.has(path)) return {mtime: 0, ...this.files.get(path)!.info };
        if (this.directories.has(path)) {
            return {
                mtime: 0,

                path,
                size: 0,

            };
        }
        return null;
    }

    /* ------------------------------------------------------------------ */
    /*  Random‑access file API                                            */
    /* ------------------------------------------------------------------ */
    async open(path: string, mode: FileMode): Promise<IVirtualFile> {
        if (!(await this.exists(path))) {
            if (mode === FileMode.READ) {
                throw new Error(`File not found: ${path}`);
            }
            await this.create(path);
        }

        const file = this.files.get(path)!;
        let cursor = 0;

        return {
            async read(buffer: Uint8Array, length: number): Promise<number> {
                const slice = file.data.slice(cursor, cursor + length);
                buffer.set(slice, 0);
                cursor += slice.length;
                return slice.length;
            },

            async write(buffer: Uint8Array): Promise<number> {
                // Expand buffer if we write past end
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

            async seek(offset: number, whence: "SET" | "CUR" | "END") {
                if (whence === "SET") cursor = offset;
                else if (whence === "CUR") cursor += offset;
                else cursor = file.data.length + offset;
            },

            async flush() {/* no‑op for mem */},
            async close() {/* no‑op for mem */},
            async getInfo() { return { ...file.info }; },
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                           */
    /* ------------------------------------------------------------------ */
    async create(path: string): Promise<void> {
        const now = Date.now();
        this.files.set(path, {
            data: new Uint8Array(0),
            info: {
                name: path.split("/").pop() || path,
                path,
                size: 0,
                createdAt: now,
                updatedAt: now,
                isDirectory: false,
            },
        });
    }

    async delete(path: string): Promise<void> {
        if (!this.files.delete(path)) {
            throw new Error(`File not found: ${path}`);
        }
    }

    async exists(path: string): Promise<boolean> {
        return this.files.has(path) || this.directories.has(path);
    }

    async mkdir(path: string): Promise<void> {
        this.directories.add(path.endsWith("/") ? path.slice(0, -1) : path);
    }

    async rmdir(path: string, recursive = false): Promise<void> {
        if (!this.directories.has(path)) throw new Error(`Directory not found: ${path}`);
        this.directories.delete(path);
        if (recursive) {
            for (const filePath of [...this.files.keys()]) {
                if (filePath.startsWith(`${path}/`)) this.files.delete(filePath);
            }
        }
    }
}

/* Convenience factory */
export function createMemoryVFS(): IVirtualFileSystem {
    const vfs = new MemoryVFS();
    // optional: await vfs.mount(); (if you ever make mount asynchronous)
    return vfs;
}
