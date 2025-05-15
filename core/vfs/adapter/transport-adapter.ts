// core/vfs/transport-vfs-adapter.ts
// -----------------------------------------------------------------------------
// A **very simple VFS adapter** that tunnels every filesystem operation through
// a `SecureMemoryTransport`.  This lets one peer expose its local filesystem
// (the *server*) while the other peer mounts it transparently (the *client*).
//
// Protocol: JSON‑serialised request / response packets, one per transport
// message.  Each packet has `{ id, op, args }` and the response echoes the
// same `id` with `{ id, ok, result | error }`.
//
// Only the subset of IVirtualFileSystem methods required by Archipelago’s
// build tools are implemented (create, readFile, writeFile, exists, list).
// Feel free to extend.
// -----------------------------------------------------------------------------
import {
    IVirtualFileSystem,
    FileInfo,
    FileMode,
    VfsFileHandle
} from '../types';
import {SecureMemoryTransport} from '../../transports/secure-memory-transport';

/* ----------------------------- message types ------------------------------ */
interface RpcReq {
    id: string;
    op: string;
    args: any[];
}

interface RpcRes {
    id: string;
    ok: boolean;
    result?: any;
    error?: string;
}

function uuid() {
    return (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
}

/* ----------------------------- SERVER ADAPTER ----------------------------- */
export class VfsServer {
    constructor(private readonly fs: IVirtualFileSystem, private readonly transport: SecureMemoryTransport) {
        transport.on('message', (msg: Uint8Array) => this.handle(msg));
    }

    private async handle(raw: Uint8Array) {
        const {id, op, args} = JSON.parse(new TextDecoder().decode(raw)) as RpcReq;
        let res: RpcRes;
        try {
            // @ts-ignore – dynamic dispatch
            const result = await (this.fs[op] as any)(...args);
            res = {id, ok: true, result};
        } catch (e: any) {
            res = {id, ok: false, error: e.message};
        }
        await this.transport.send(new TextEncoder().encode(JSON.stringify(res)));
    }
}

/* ----------------------------- CLIENT ADAPTER ----------------------------- */
export class VfsClient implements IVirtualFileSystem {
    constructor(private readonly transport: SecureMemoryTransport) {
        transport.on('message', (msg: Uint8Array) => this.route(msg));
    }

    scheme: string = 'memory';
    mount(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    unmount(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    readdir?(path?: string): Promise<VfsFileHandle[]> {
        throw new Error('Method not implemented.');
    }
    stat?(path: string): Promise<VfsFileHandle | null> {
        throw new Error('Method not implemented.');
    }

    /* pending RPC promises */
    private inflight = new Map<string, { resolve: (v: any)=>void; reject:(e:any)=>void }>();

    private route(raw: Uint8Array) {
        const res = JSON.parse(new TextDecoder().decode(raw)) as RpcRes;
        const entry = this.inflight.get(res.id);
        if (!entry) return;
        this.inflight.delete(res.id);
        res.ok ? entry.resolve(res.result) : entry.reject(new Error(res.error));
    }

    private rpc<T = any>(op: string, ...args: any[]): Promise<T> {
        return new Promise<T>(async (resolve, reject) => {
            const id = uuid();
            this.inflight.set(id, { resolve, reject });
            const req: RpcReq = { id, op, args };
            await this.transport.send(new TextEncoder().encode(JSON.stringify(req)));
        });
    }

    /* ----------- IVirtualFileSystem methods (subset) ---------------- */
    async create(path: string) { await this.rpc('create', path); }
    async exists(path: string) { return this.rpc<boolean>('exists', path); }
    async delete(path: string) { await this.rpc('delete', path); }
    async mkdir(path: string)  { await this.rpc('mkdir', path); }
    async rmdir(path: string, recursive?: boolean) { await this.rpc('rmdir', path, recursive); }
    async list(path: string)   { return this.rpc<FileInfo[]>('list', path); }

    // Simple whole‑file helpers
    async readFile(path: string): Promise<Uint8Array>  { return this.rpc('readFile', path); }
    async writeFile(path: string, data: Uint8Array): Promise<void> { await this.rpc('writeFile', path, data); }

    /* unused methods (open/seek/flush…) could be added later */
    open = async () => { throw new Error('open not implemented in VfsClient'); };
    info   = async (p: string) => this.rpc<FileInfo>('info', p);
    prefix = '/';
}

/* --------------------------- convenience factory -------------------------- */
export function mountVfsOverTransport(baseFs: IVirtualFileSystem, transport: SecureMemoryTransport) {
    // server side exposes its fs
    new VfsServer(baseFs, transport);
    // client side returns a proxy instance
    return new VfsClient(transport);
}
