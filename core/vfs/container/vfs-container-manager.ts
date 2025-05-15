import { Blake3 } from '../../crypto/hash';

import Falcon from '../../crypto/falcon';
import { IVirtualFileSystem } from '../types';
import { createMemoryVFS } from '../memory-vfs';

import { SafeStorage } from '../safe-storage';

import { createStreamAdapter } from '../stream/stream-adapter';

import {VfsRegistry} from "../registry";
import {SecureMemoryTransport} from "../../transports/secure-memory-transport";
import {KyberKeyExchange} from "../../crypto/kyber";
import {createOstVFS} from "../adapter/ost";
import {DiskSafeVFS} from "../adapter/disk-safe-vfs";
import { createDiskSafeVFS } from '../adapter/disk-safe-vfs';
import path from "path";






export interface VFSContainer {
    id: string;
    publicKey: Uint8Array;
    privateKey: Uint8Array;
    signer: any;
    fs: IVirtualFileSystem;
    mounts: Map<string, IVirtualFileSystem>;
    store: SafeStorage;
    destroy(): Promise<void>;
    snapshot(): Promise<Uint8Array>;
}


export class VFSContainerManager {
    private static containers = new Map<string, VFSContainer>();
    private static vault: IVirtualFileSystem;

    static async create(uid: string): Promise<VFSContainer> {
        const { publicKey, privateKey } = await new KyberKeyExchange().generateKeyPair();
        const signer = await Falcon.FalconKeyPair();

        const id = Blake3.from(Buffer.from(publicKey).toString("hex")).hex;
        const transport = new SecureMemoryTransport({ isServer: true });
        const mem   = createMemoryVFS();
        const ostVfs = createOstVFS(mem, {compressionMethod: "brotli"});



        const store = new SafeStorage(ostVfs, "/store");
        // ← factory, not class
        const stream = createStreamAdapter(this.vault as unknown as IVirtualFileSystem);
        const dsRoot = path.join(process.cwd(), 'data', 'vfs');
        const t = new SecureMemoryTransport({ isServer: true });
        await t.init();
        const diskSafe = createDiskSafeVFS(dsRoot, t.getContext()!.crypto.encryption);
        const storeRoot = path.join(process.cwd(), 'data', 'store');
        const storage = new SafeStorage(diskSafe, storeRoot);

        // Register DTLS adapter once per process (idempotent)
      //  VfsRegistry.register(new DtlsVfsAdapter("127.0.0.1", 4444));


        const container: VFSContainer = {
            id, publicKey, privateKey, signer,
            fs: diskSafe,
            store,
            mounts: new Map([
                ["/memory", mem],
                ["/secure", diskSafe],
                ["/store",  diskSafe],
                ["/vault",  mem],
                ["/p2p",    ostVfs],
                ["/packed", ostVfs],
                ["/stream", stream as unknown as IVirtualFileSystem],
            ]),
            async destroy() {
                this.mounts.clear();
                VFSContainerManager.containers.delete(id);
            },
            async snapshot() {
                const meta = JSON.stringify({
                    id,
                    createdAt: Date.now(),
                    publicKey: Buffer.from(publicKey).toString("base64"),
                });
                const hash = Blake3.from(meta).hash;
                const sig  = await Falcon.FalconSignDetached(hash, signer.privateKey);
                return new Uint8Array([...hash, ...sig]);
            },
        };

        this.containers.set(id, container);
        return container;
    }



    static get(id: string): VFSContainer | undefined {
        return this.containers.get(id);
    }

    static list(): VFSContainer[] {
        return Array.from(this.containers.values());
    }

    static async destroy(id: string): Promise<void> {
        const container = this.containers.get(id);
        if (container) await container.destroy();
    }
}
