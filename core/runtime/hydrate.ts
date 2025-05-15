import { HydrationController } from './hydration-controller';
import { HydratableElementManager } from './hydratable-element-manager';

let initialized = false;

export async function hydrateDomAutomatically(): Promise<void> {
    if (initialized) return;
    initialized = true;

    const controller = HydrationController.getInstance();
    await controller.initialize();

    const manager = new HydratableElementManager();
    manager.scanAndQueueAll();
}