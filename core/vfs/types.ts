export enum FileMode {
    READ = 'r',
    WRITE = 'w',
    APPEND = 'a',
    READ_WRITE = 'rw',
    CREATE = 'c',
    CREATE_NEW = 'cn',
}

export interface FileInfo {
    name: string;
    path: string;
    size: number;
    createdAt: number;
    updatedAt: number;
    isDirectory: boolean;
    mtime: number;
}

interface StreamAdapter {
    openStream(path: string): ReadableStream<Uint8Array>;
    getMetadata(path: string): Promise<{
        mime: string;
        size: number;
        verified: boolean;
    }>;
}


export interface IVirtualFile {
    read(buffer: Uint8Array, length: number): Promise<number>;
    write(buffer: Uint8Array): Promise<number>;
    seek(offset: number, whence: 'SET' | 'CUR' | 'END'): Promise<void>;
    flush(): Promise<void>;
    close(): Promise<void>;
    getInfo(): Promise<FileInfo>;
}

// core/vfs/types.ts
/** Minimal file‐handle descriptor used by VFS adapters. */
export interface VfsFileHandle {
    /** Full virtual path (e.g. /remote/hello.json) */
    path: string;
    /** Byte length, ‑1 when unknown (e.g. streaming) */
    size: number;
    /** Last‑modified in epoch ms, or 0 if N/A */
    mtime: number;
}

/** Contract every VFS adapter must implement. */
export interface IVirtualFileSystem {
    /** Scheme prefix this adapter serves (e.g. “dtls”). */
    readonly scheme: string;
    mount(): Promise<void>;
    unmount(): Promise<void>;

    // Basic file ops
    readFile(path: string): Promise<Uint8Array>;
    writeFile?(path: string, data: Uint8Array): Promise<void>;
    readdir?(path?: string): Promise<VfsFileHandle[]>;
    stat?(path: string): Promise<VfsFileHandle | null>;
    open(path: string, mode: FileMode): Promise<IVirtualFile>;
    create(path: string): Promise<void>;
    delete(path: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    info(path: string): Promise<FileInfo>;
    list(path: string): Promise<FileInfo[]>;
    mkdir(path: string): Promise<void>;
    rmdir(path: string, recursive?: boolean): Promise<void>;
}

