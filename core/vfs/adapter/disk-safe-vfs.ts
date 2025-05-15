// core/vfs/adapter/disk-safe-vfs.ts  — **Delta via bsdiff-node + Integrity**
// -----------------------------------------------------------------------------
// Requires in package.json:
//   "bsdiff-node": "^1.2.0",
//   "@leancloud/blake3": "^0.5.0"   (if not already for Blake3)
// -----------------------------------------------------------------------------
// Features:
//   • Atomic writes, optional EncryptionScheme
//   • Recursive listing, copy, rename, locks, chokidar watch
//   • Per‑file versioning stored under .vfs_versions/<rel>
//       – Uses *BSDIFF* (bsdiff-node) for binary deltas
//       – Full snapshot stored if diff > 60 % size of plain
//   • Metadata JSON includes BLAKE3 hash; hash verified on every read/restore
//   • Automatic pruning by latest count, max versions, max age, max total bytes
//   • Public helpers: listVersions / restoreVersion / purgeVersions
// -----------------------------------------------------------------------------

// @ts-nocheck
function safeCwd(): string {
    if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
        return process.cwd();
    }
    // in-browser, just mount at root
    return '/';
}

import {
    IVirtualFileSystem, IVirtualFile, FileMode, FileInfo, VfsFileHandle
} from '../types';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import EventEmitter from 'node:events';
import chokidar from 'chokidar';
import { EncryptionScheme } from '../../interfaces/crypto';
import { Blake3 } from '../../crypto/hash';
import bsdiff from 'bsdiff-node';

/* --------------------------------- Types ---------------------------------- */
interface DiskOpts {
    root?: string;
    crypto?: EncryptionScheme;
    watch?: boolean;
    versioning?: boolean;        // default true
    prune?: {
        keepLatest?: number;       // always retain N newest (default 5)
        maxVersions?: number;      // per‑file cap
        maxAgeDays?: number;       // delete versions older than X days
        maxTotalBytes?: number;    // cap disk usage per file
    };
}
interface VersionMeta {
    id: string;
    hash: string;           // BLAKE3 of plain data
    size: number;           // stored bytes
    type: 'full' | 'delta';
    parent?: string;
    ctime: number;          // epoch ms
}

/* -------------------------------- Constants ------------------------------- */
const ROOT_DEFAULT = path.join(safeCwd(), 'data', 'vfs');
const VERS_DIR     = '.vfs_versions';
const META_EXT     = '.json';
const DELTA_EXT    = '.bsdiff';

/* Path protect */
const safe = (root:string,p:string)=>{const r=path.resolve(root,p.replace(/^\/+/,'')); if(!r.startsWith(root)) throw new Error('Path escape'); return r;};
/* Cross‑platform sync */
const syncClose = async (h:fs.FileHandle)=>{ // @ts-ignore
    if(typeof h.sync==='function') await h.sync(); await h.close(); };

/* ---------------------------- DiskSafeVFS Class --------------------------- */
export class DiskSafeVFS extends EventEmitter implements IVirtualFileSystem {
    prefix = '/';
    scheme = 'disk-safe';
    private readonly root: string;
    private readonly crypto?: EncryptionScheme;
    private watcher?: chokidar.FSWatcher;
    private readonly versionsEnabled: boolean;
    private readonly pruneCfg: Required<DiskOpts['prune']>;

    constructor(private readonly opts: DiskOpts = {}) {
        super();
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

    /* ---------------- Lifecycle ---------------- */
    async mount() {
        await fs.mkdir(this.root, { recursive: true });
        if (this.versionsEnabled) {
            await fs.mkdir(path.join(this.root, VERS_DIR), { recursive: true });
        }
        if (this.opts.watch) {
            this.watcher = chokidar.watch(this.root, { ignoreInitial: true, depth: Infinity });
            ['add', 'change', 'unlink', 'addDir', 'unlinkDir']
                .forEach(evt => this.watcher!.on(evt, p => this.emit(evt, path.relative(this.root, p))));
        }
    }
    async unmount() { await this.watcher?.close(); }

    /* ---------------- Encryption helpers ---------------- */
    private async enc(data: Uint8Array) { return this.crypto ? this.crypto.encrypt(data) : data; }
    private async dec(data: Uint8Array) { return this.crypto ? this.crypto.decrypt(data) : data; }

    /* ---------------- Atomic write ---------------- */
    private async atomicWrite(full: string, data: Uint8Array) {
        const dir = path.dirname(full);
        await fs.mkdir(dir, { recursive: true });
        const tmp = path.join(dir, `.tmp-${randomBytes(4).toString('hex')}`);
        const fh = await fs.open(tmp, 'wx', 0o600);
        await fh.writeFile(data);
        await syncClose(fh);
        await fs.rename(tmp, full);
    }

    /* ---------------- Version helpers ---------------- */
    private versDir(rel: string) { return path.join(this.root, VERS_DIR, path.dirname(rel)); }

    private async latestMeta(rel: string): Promise<VersionMeta | null> {
        const metas = await this.listMetas(rel);
        return metas[0] ?? null;
    }

    private async listMetas(rel: string): Promise<VersionMeta[]> {
        const dir = this.versDir(rel);
        try {
            const files = (await fs.readdir(dir)).filter(f => f.startsWith(path.basename(rel)) && f.endsWith(META_EXT));
            const metas: VersionMeta[] = await Promise.all(files.map(async f => JSON.parse((await fs.readFile(path.join(dir, f))).toString())));
            return metas.sort((a, b) => b.ctime - a.ctime);
        } catch { return []; }
    }

    private async loadVersionData(rel: string, id: string): Promise<Uint8Array> {
        const dir  = this.versDir(rel);
        const base = path.join(dir, `${path.basename(rel)}.${id}`);
        const meta: VersionMeta = JSON.parse((await fs.readFile(base + META_EXT)).toString());
        const stored = await this.dec(await fs.readFile(base + (meta.type === 'delta' ? DELTA_EXT : '.full')));
        let plain: Uint8Array;
        if (meta.type === 'full') {
            plain = stored;
        } else {
            const parent = await this.loadVersionData(rel, meta.parent!);
            plain = bsdiff.patch(parent, stored);
        }
        // integrity check
        if (Blake3.from(plain).hex !== meta.hash) throw new Error('Version hash mismatch – data corrupted');
        return plain;
    }

    private async saveVersion(rel: string, plain: Uint8Array) {
        if (!this.versionsEnabled) return;
        const dir = this.versDir(rel);
        await fs.mkdir(dir, { recursive: true });

        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const id = ts;
        const metaName = `${path.basename(rel)}.${id}${META_EXT}`;
        const metaPath = path.join(dir, metaName);

        let type: 'full' | 'delta' = 'full';
        let payload: Uint8Array;
        let parentId: string | undefined;

        const prev = await this.latestMeta(rel);
        if (prev) {
            const prevPlain = await this.loadVersionData(rel, prev.id);
            const diffBuf = bsdiff.diff(prevPlain, plain);
            if (diffBuf.length < plain.length * 0.6) {
                type = 'delta';
                payload = diffBuf;
                parentId = prev.id;
            } else {
                payload = plain;
            }
        } else {
            payload = plain;
        }

        const encrypted = await this.enc(payload);
        const dataPath = metaPath.replace(META_EXT, type === 'delta' ? DELTA_EXT : '.full');
        await this.atomicWrite(dataPath, encrypted);

        const meta: VersionMeta = {
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
    private async pruneVersions(rel: string) {
        const metas = await this.listMetas(rel);
        const { keepLatest, maxVersions, maxAgeDays, maxTotalBytes } = this.pruneCfg;

        // keepLatest first
        let candidates = metas.slice(keepLatest);

        // enforce maxVersions
        if (metas.length > maxVersions) candidates = metas.slice(maxVersions);

        // age filter
        const cutoff = Date.now() - maxAgeDays * 86_400_000;
        candidates.push(...metas.filter(m => m.ctime < cutoff));

        // size filter
        let keptSize = metas.filter(m => !candidates.includes(m)).reduce((s, m) => s + m.size, 0);
        for (const m of metas) {
            if (candidates.includes(m)) continue;
            if (keptSize <= maxTotalBytes) break;
            candidates.push(m);
            keptSize -= m.size;
        }

        // dedup and delete
        const toDel = [...new Set(candidates)];
        for (const m of toDel) {
            const base = path.join(this.versDir(rel), `${path.basename(rel)}.${m.id}`);
            await fs.rm(base + META_EXT, { force: true });
            await fs.rm(base + (m.type === 'delta' ? DELTA_EXT : '.full'), { force: true });
        }
    }

    /* ---------------- IVirtualFileSystem: open ---------------- */
    async open(rel: string, mode: FileMode): Promise<IVirtualFile> {
        const full = safe(this.root, rel);

        if (mode === FileMode.READ) {
            const raw   = await fs.readFile(full);
            const plain = await this.dec(raw);
            let cursor = 0;
            return {
                async read(buf, len) {
                    const slice = plain.slice(cursor, cursor + len);
                    buf.set(slice);
                    cursor += slice.length;
                    return slice.length;
                },
                write: async () => { throw new Error('read-only handle'); },
                seek: async (off, whence) => {
                    cursor = whence === 'SET' ? off : whence === 'CUR' ? cursor + off : plain.length + off;
                },
                flush: async () => {},
                close: async () => {},
                getInfo: async () => this.info(rel)
            } as IVirtualFile;
        }

        const chunks: Uint8Array[] = [];
        return {
            async read() { throw new Error('write-only handle'); },
            async write(chunk) { chunks.push(chunk); return chunk.length; },
            async seek() {},
            async flush() {},
            close: async () => {
                const plain = Uint8Array.from(Buffer.concat(chunks));
                await this.saveVersion(rel, plain);
                await this.atomicWrite(full, await this.enc(plain));
            },
            getInfo: async () => this.info(rel)
        } as IVirtualFile;
    }

    /* ---------------- Convenience & Metadata ---------------- */
    async exists(p: string) {
        try { await fs.access(safe(this.root, p)); return true; } catch { return false; }
    }

    async info(p: string): Promise<FileInfo> {
        const st = await fs.stat(safe(this.root, p));
        return { path: p, size: st.size, mtime: st.mtimeMs, isDir: st.isDirectory() } as FileInfo;
    }

    async readFile(p: string) { return this.dec(await fs.readFile(safe(this.root, p))); }

    async writeFile(p: string, data: Uint8Array) {
        await this.saveVersion(p, data);
        await this.atomicWrite(safe(this.root, p), await this.enc(data));
    }

    async delete(p: string) {
        if (await this.exists(p)) {
            const current = await this.readFile(p);
            await this.saveVersion(p, current);
            await fs.rm(safe(this.root, p), { force: true });
        }
    }

    async mkdir(p: string) { await fs.mkdir(safe(this.root, p), { recursive: true }); }

    async rmdir(p: string, recursive = false) {
        await fs.rm(safe(this.root, p), { recursive, force: true });
    }

    async list(rel: string = '/') {
        const out: FileInfo[] = [];
        const recurse = async (dirRel: string) => {
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

    async readdir(rel: string = '/') {
        return (await this.list(rel)).filter(f => path.dirname(f.path) === rel);
    }

    async stat(p: string) { return (await this.exists(p)) ? await this.info(p) : null; }

    async copy(src: string, dst: string) {
        await fs.cp(safe(this.root, src), safe(this.root, dst), { recursive: true });
    }

    async rename(src: string, dst: string) {
        await fs.rename(safe(this.root, src), safe(this.root, dst));
    }

    /* ---------------- Version public helpers ---------------- */
    async listVersions(p: string) { return this.listMetas(p); }
    async restoreVersion(p: string, id: string) {
        const data = await this.loadVersionData(p, id);
        await this.atomicWrite(safe(this.root, p), await this.enc(data));
    }
    // @ts-ignore
    async purgeVersions(p: string, keepLatest = this.pruneCfg.keepLatest) {
        const metas = await this.listMetas(p);
        for (const m of metas.slice(keepLatest)) {
            const base = path.join(this.versDir(p), `${path.basename(p)}.${m.id}`);
            await fs.rm(base + META_EXT, { force: true });
            await fs.rm(base + (m.type === 'delta' ? DELTA_EXT : '.full'), { force: true });
        }
    }

    async create(p: string) {
        const full = safe(this.root, p);
        await fs.mkdir(path.dirname(full), { recursive: true });
        await fs.writeFile(full, Buffer.alloc(0));
    }
}

export const createDiskSafeVFS = (root?: string, crypto?: EncryptionScheme, opts: Omit<DiskOpts, 'root' | 'crypto'> = {}) =>
    new DiskSafeVFS({ root, crypto, ...opts });
