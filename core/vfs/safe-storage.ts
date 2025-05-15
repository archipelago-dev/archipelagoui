import { IVirtualFileSystem, FileMode } from './types';

export class SafeStorage {
    constructor(private fs: IVirtualFileSystem, private root: string = '/store') {}

    private resolvePath(key: string): string {
        return `${this.root}/${key}`;
    }

    async setItem(key: string, value: string): Promise<void> {
        const path = this.resolvePath(key);
        if (!(await this.fs.exists(path))) await this.fs.create(path);
        const file = await this.fs.open(path, FileMode.WRITE);
        await file.write(new TextEncoder().encode(value));
        await file.flush();
        await file.close();
    }

    async getItem(key: string): Promise<string | null> {
        const path = this.resolvePath(key);
        if (!(await this.fs.exists(path))) return null;
        const file = await this.fs.open(path, FileMode.READ);
        const buffer = new Uint8Array(2048);
        const len = await file.read(buffer, buffer.length);
        await file.close();
        return new TextDecoder().decode(buffer.slice(0, len));
    }

    async removeItem(key: string): Promise<void> {
        const path = this.resolvePath(key);
        if (await this.fs.exists(path)) {
            await this.fs.delete(path);
        }
    }

    async clear(): Promise<void> {
        await this.fs.rmdir(this.root, true);
        await this.fs.mkdir(this.root);
    }

    async keys(): Promise<string[]> {
        const files = await this.fs.list(this.root);
        // @ts-ignore
        return files.map(f => f.name);
    }
}
