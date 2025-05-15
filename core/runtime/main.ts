import { ArchipelagoRenderer } from './ArchipelagoRenderer';
import { HydrationController } from './hydration-controller';
import { HydratableElementManager } from './hydratable-element-manager';
import { RenderWorkerPool } from './render-worker-pool';

export async function startArchipelago(userConfig = {}) {
    // Expose renderer API globally
    if (typeof window !== 'undefined') {
        (window as any).ArchipelagoRenderer = ArchipelagoRenderer;
    }

    // Initialize renderer config
    await ArchipelagoRenderer.initialize(userConfig);

    // Initialize hydration + worker pool
    const controller = HydrationController.getInstance();
    await controller.initialize();

    const pool = RenderWorkerPool.getInstance(); // Warm-up for multithreaded hydration

    const manager = new HydratableElementManager();
    manager.scanAndQueueAll();

    if (ArchipelagoRenderer.config.debug) {
        console.debug('[Archipelago] Started with debug mode');
    }
}
