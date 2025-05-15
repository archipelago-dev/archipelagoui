// core/vfs/adapter/ost.ts

/*
 * OST‑Packed VFS Adapter
 * ----------------------
 * A drop‑in IVirtualFileSystem implementation that wraps **any** base VFS and
 * transparently compresses / decompresses file payloads using the Okaily‑
 * Srivastava‑Tbakhi (OST) algorithm.
 *
 *  - All data written via `.write()` is first serialised (raw bytes → string),
 *    compressed with **OSTPackWriter**, and then persisted in the underlying
 *    VFS.
 *  - On `.read()` the opposite happens: the adapter fetches the packed bytes
 *    from the base VFS, runs **OSTPackReader** to get back the original string,
 *    then re‑encodes to `Uint8Array` for the caller.
 *
 * The adapter is *stateless* – it stores the OST blob as a single file next to
 * an optional detached Falcon signature ( “<file>.sig” – left to the caller ).
 */

import {
    IVirtualFileSystem,
    IVirtualFile,
    FileMode,
    FileInfo,
    VfsFileHandle
} from '../types';
import {OSTPackWriter} from '../../transports/ost/OSTPackWriter';
import {OSTPackReader} from '../../transports/ost/OSTPackReader';
import {OSTConfig} from '../../transports/ost/types';

export class OstVfsAdapter implements IVirtualFileSystem {
    readonly prefix: string = '/';
    scheme: string = 'ost';

    constructor(
        private readonly base: IVirtualFileSystem,
        private readonly config: Partial<OSTConfig> = {}
    ) {
    }



    getscheme(): string | undefined {
        return this.base.scheme;
    }
    mount(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    unmount(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    readFile(path: string): Promise<Uint8Array> {
        throw new Error('Method not implemented.');
    }
    writeFile?(path: string, data: Uint8Array): Promise<void> {
        throw new Error('Method not implemented.');
    }
    readdir?(path?: string): Promise<VfsFileHandle[]> {
        throw new Error('Method not implemented.');
    }
    stat?(path: string): Promise<VfsFileHandle | null> {
        throw new Error('Method not implemented.');
    }

    /* ----------------------------------------------------------- */
    /* File operations                                             */
    /* ----------------------------------------------------------- */

    async open(path: string, mode: FileMode): Promise<IVirtualFile> {
        // We only wrap READ / WRITE – everything else is delegated.
        const file = await this.base.open(path, mode);

        const self = this;

        return {
            async read(buffer: Uint8Array, length: number): Promise<number> {
                // Read packed blob from base file first
                const tmp = new Uint8Array(length);
                const readLen = await file.read(tmp, length);
                const packed = tmp.slice(0, readLen);

                // If file is empty, just return 0
                if (packed.length === 0) return 0;

                // Unpack via OST
                const plain = await OSTPackReader.extractPack(packed);
                const bytes = new TextEncoder().encode(plain);
                buffer.set(bytes.subarray(0, buffer.length));
                return bytes.length;
            },

            async write(data: Uint8Array): Promise<number> {
                // Compress using OST
                const plain = new TextDecoder().decode(data);
                const packed = await OSTPackWriter.createPack(plain, self.config);
                return file.write(packed);
            },

            /* passthroughs */
            async seek(o, w) { await file.seek(o, w); },
            async flush() { await file.flush(); },
            async close() { await file.close(); },
            async getInfo() { return file.getInfo(); }
        } as IVirtualFile;
    }

    /* ----------------------------------------------------------- */
    /* Passthrough helpers                                         */
    /* ----------------------------------------------------------- */

    create  = (p: string)                         => this.base.create(p);
    delete  = (p: string)                         => this.base.delete(p);
    exists  = (p: string)                         => this.base.exists(p);
    info    = (p: string)                         => this.base.info(p);
    list    = (p: string)                         => this.base.list(p);
    mkdir   = (p: string)                         => this.base.mkdir(p);
    rmdir   = (p: string, r?: boolean | undefined) => this.base.rmdir(p, r);
}

/* ------------------------------------------------------------------ */
/* Factory helper – sugar for one‑liners                               */
/* ------------------------------------------------------------------ */
export const createOstVFS = (
    base: IVirtualFileSystem,
    cfg: Partial<OSTConfig> = {}
): IVirtualFileSystem => new OstVfsAdapter(base, cfg);
