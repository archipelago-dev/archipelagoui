import { hydrateDomAutomatically } from "./hydrate.js";
import { registerComponent, resolveComponent, listRegisteredComponents } from "./registry.js";
import { registerModule, callLifecycle } from "./module-manager.js";
import { VFSContainerManager, VFSContainer } from '../vfs/container/vfs-container-manager';

// Advanced feature flags (controlled at runtime)
export interface ArchipelagoConfig {
    autoHydrate?: boolean;
    enableQuantumRendering?: boolean;
    enablePriorityPrediction?: boolean;
    enableEdgeMesh?: boolean;
    debug?: boolean;
}

// Default config
let config: Required<ArchipelagoConfig> = {
    autoHydrate: true,
    enableQuantumRendering: false,
    enablePriorityPrediction: true,
    enableEdgeMesh: false,
    debug: false,
};

// Initialize once only
let initialized = false;

export async function initializeArchipelago(userConfig: Partial<ArchipelagoConfig> = {}) {
    if (initialized) return;

    config = { ...config, ...userConfig };
    initialized = true;

    await callLifecycle("onInitGlobal", { config });

    if (config.autoHydrate && typeof window !== "undefined") {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", hydrateDomAutomatically);
        } else {
            hydrateDomAutomatically();
        }
    }

    if (config.debug) {
        console.debug("[Archipelago] Initialized with config:", config);
    }
}

// Exported facade API
export const ArchipelagoRenderer = {
    initialize: initializeArchipelago,
    hydrateDom: hydrateDomAutomatically,
    registerComponent,
    registerModule,
    resolveComponent,
    listRegisteredComponents,
    async registerContainerSession(uid: string): Promise<VFSContainer> {
        return await VFSContainerManager.create(uid);
    },
    get config() {
        return config;
    }
};

if (typeof window !== 'undefined') {
    (window as any).ArchipelagoRenderer = ArchipelagoRenderer;
}
