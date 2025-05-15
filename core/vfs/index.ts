// core/vfs/index.ts
export const getSafeVFS = async () => {
    if (typeof window === 'undefined') {
        const { createDiskSafeVFS } = await import('./adapter/disk-safe-vfs');
        return createDiskSafeVFS("archipelago");
    } else {
        const { createMemoryVFS } = await import('./memory-vfs');
        return createMemoryVFS();
    }
};
