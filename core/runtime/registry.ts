type ComponentEntry = {
    name: string;
    resolver: () => Promise<any>;  // async-loaded module or function
    source?: "local" | "ipfs" | "p2p" | string;
};

const registry = new Map<string, ComponentEntry>();

export function registerComponent(name: string, resolver: () => Promise<any>, source = "local") {
    registry.set(name, { name, resolver, source });
}

export function getComponentEntry(name: string): ComponentEntry | undefined {
    return registry.get(name);
}

export async function resolveComponent(name: string): Promise<any | undefined> {
    const entry = registry.get(name);
    if (!entry) {
        console.warn(`[Archipelago] Component "${name}" not found in registry.`);
        return undefined;
    }

    try {
        return await entry.resolver();
    } catch (err) {
        console.error(`[Archipelago] Failed to resolve "${name}":`, err);
        return undefined;
    }
}

export function listRegisteredComponents(): string[] {
    return Array.from(registry.keys());
}
