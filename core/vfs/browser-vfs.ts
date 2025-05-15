import { IVirtualFileSystem, FileInfo, IVirtualFile, FileMode, VfsFileHandle} from './types';
import {createMemoryVFS} from './memory-vfs';
import {get, set, del, keys} from 'idb-keyval';

export class BrowserVFS implements IVirtualFileSystem {
    scheme: string = 'browser';
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
    private memory = createMemoryVFS();
    private prefix = 'archipelago-vfs:';

    async open(path: string, mode: FileMode): Promise<IVirtualFile> {
        if (!(await this.exists(path)) && (mode === FileMode.READ || mode === FileMode.READ_WRITE)) {
            throw new Error(`File not found: ${path}`);
        }

        const buffer = (await get(this.prefix + path)) || new Uint8Array();
        let cursor = 0;

        return {
            async read(buf: Uint8Array, length: number) {
                const slice = buffer.slice(cursor, cursor + length);
                buf.set(slice, 0);
                cursor += slice.length;
                return slice.length;
            },

            async write(buf: Uint8Array) {
                const newBuf = new Uint8Array(cursor + buf.length);
                newBuf.set(buffer.slice(0, cursor));
                newBuf.set(buf, cursor);
                // @ts-ignore
                await set(this.prefix + path, newBuf);
                cursor += buf.length;
                return buf.length;
            },

            async seek(offset: number, whence: 'SET' | 'CUR' | 'END') {
                if (whence === 'SET') cursor = offset;
                else if (whence === 'CUR') cursor += offset;
                else if (whence === 'END') cursor = buffer.length + offset;
            },

            async flush() {},
            async close() {},
            async getInfo(): Promise<FileInfo> {
                return {
                    name: path.split('/').pop() || path,
                    path,
                    size: buffer.length,
                    isDirectory: false,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
            }
        };
    }

    async create(path: string): Promise<void> {
        await set(this.prefix + path, new Uint8Array());
    }

    async delete(path: string): Promise<void> {
        await del(this.prefix + path);
    }

    async exists(path: string): Promise<boolean> {
        return (await get(this.prefix + path)) != null;
    }

    async info(path: string): Promise<FileInfo> {
        const data = await get(this.prefix + path);
        if (!data) throw new Error(`Not found: ${path}`);
        return {
            name: path.split('/').pop() || path,
            path,
            size: data.byteLength || 0,
            isDirectory: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    async list(path: string): Promise<FileInfo[]> {
        const allKeys = await keys();
        return allKeys
            .filter(k => typeof k === 'string' && k.startsWith(this.prefix + path))
            .map(k => ({
                //@ts-ignore
                name: k.replace(this.prefix, '').split('/').pop() || '',
                //@ts-ignore
                path: k.replace(this.prefix, ''),
                size: 0,
                isDirectory: false,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }));
    }

    async mkdir(path: string): Promise<void> {
        // IndexedDB is flat — simulate directory structure in key
    }

    async rmdir(path: string, recursive?: boolean): Promise<void> {
        const allKeys = await keys();
        for (const k of allKeys) {
            if (typeof k === 'string' && k.startsWith(this.prefix + path)) {
                await del(k);
            }
        }
    }
}

export function createBrowserVFS(): IVirtualFileSystem {
    return new BrowserVFS();
}
