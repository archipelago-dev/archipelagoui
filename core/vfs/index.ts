// core/vfs/index.ts
import {IVirtualFileSystem} from "./types";

export const getSafeVFS = async ():Promise<IVirtualFileSystem> => {
    if (typeof window === 'undefined') {
        const { createDiskSafeVFS } = await import('./adapter/disk-safe-vfs');
        return createDiskSafeVFS("archipelago");
    } else {
        const { createMemoryVFS } = await import('./memory-vfs');
        return createMemoryVFS();
    }
};
