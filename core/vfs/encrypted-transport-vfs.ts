// core/vfs/encrypted-transport-vfs.ts
//---------------------------------------------------------------------
// A *very thin* encrypted VFS wrapper that reuses the AES-GCM instance
// already negotiated by a `SecureMemoryTransport`.  Each file is stored
// on disk (or the underlying VFS) as:
//   [MAGIC "EV1"] [12‑byte IV] [ciphertext]
// The ciphertext is `AES‑GCM(key_from_transport, iv)` of the plaintext.
// No per‑file session key or Kyber encapsulation: we assume all peers that
// share the transport key may access the files.
//---------------------------------------------------------------------

import {
    IVirtualFileSystem,
    IVirtualFile,
    FileMode,
    FileInfo,
    VfsFileHandle
} from './types';

import {AESGCM} from '../crypto/aes';
import {SecureMemoryTransport} from '../transports/secure-memory-transport';

const MAGIC = new TextEncoder().encode('EV1'); // 3‑byte magic

function concat(a: Uint8Array, b: Uint8Array) {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
}

export class EncryptedTransportVFS implements IVirtualFileSystem {
    prefix = '/';

    private readonly aes: AESGCM;

    constructor(private readonly base: IVirtualFileSystem, transport: SecureMemoryTransport) {
        const ctx = transport.getContext();
        if (!ctx?.crypto) throw new Error('Transport missing crypto bundle');
        // replace with a safe runtime check:
        const encImpl = ctx.crypto.encryption as unknown;
        if (!(encImpl instanceof AESGCM)) {
            throw new Error('Crypto bundle does not provide AES-GCM implementation');
        }
        this.aes = encImpl;
    }

    scheme: string;
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

    /* ----------------- basic helpers ----------------- */
    private async encrypt(buf: Uint8Array): Promise<Uint8Array> {
        const iv  = crypto.getRandomValues(new Uint8Array(12));
        const ct  = await this.aes.encrypt(buf);
        return concat(concat(MAGIC, iv), ct);
    }
    private async decrypt(buf: Uint8Array): Promise<Uint8Array> {
        const magic = buf.slice(0, 3);
        if (magic.toString() !== MAGIC.toString()) throw new Error('Not EV1');
        const iv = buf.slice(3, 15);
        const ct = buf.slice(15);
        return this.aes.decrypt(ct, iv);
    }

    /* ----------------- single‑shot helpers ----------------- */
    async readFile(path: string): Promise<Uint8Array> {
        const plain = await this.base.readFile(path);
        return this.decrypt(plain);
    }
    async writeFile(path: string, data: Uint8Array): Promise<void> {
        return this.base.writeFile(path, await this.encrypt(data));
    }

    /* ----------------- open wrapper ----------------- */
    async open(path: string, mode: FileMode): Promise<IVirtualFile> {
        const fh = await this.base.open(path, mode);
        const self = this;

        return {
            async read(buf: Uint8Array, len: number) {
                const tmp = new Uint8Array(len);
                const n   = await fh.read(tmp, len);
                const plain = await self.decrypt(tmp.slice(0, n));
                buf.set(plain);
                return plain.length;
            },
            async write(data: Uint8Array) {
                return fh.write(await self.encrypt(data));
            },
            seek:  (o,w)=>fh.seek(o,w),
            flush: ()=>fh.flush(),
            close: ()=>fh.close(),
            getInfo: ()=>fh.getInfo()
        } as unknown as IVirtualFile;
    }

    /* -------- passthrough for metadata ops -------- */
    create  = (p:string)=>this.base.create(p);
    delete  = (p:string)=>this.base.delete(p);
    exists  = (p:string)=>this.base.exists(p);
    info    = (p:string)=>this.base.info(p);
    list    = (p:string)=>this.base.list(p);
    mkdir   = (p:string)=>this.base.mkdir(p);
    rmdir   = (p:string,r?:boolean)=>this.base.rmdir(p,r);
}

export function wrapEncrypted(fs: IVirtualFileSystem, t: SecureMemoryTransport) {
    return new EncryptedTransportVFS(fs, t);
}
