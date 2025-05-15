import { IController } from "../types/controller.interface";
import { RenderWorkerPool } from './render-worker-pool';
import {HydrationDevOverlay}  from "../devtools/hydration-dev-overlay";

export class HydrationController implements IController {
    private static instance: HydrationController;

    private hydrationMap: Map<string, boolean> = new Map();
    private hydrationQueue: { el: HTMLElement; role: string; priority: number }[] = [];
    private isProcessing = false;

    private constructor() {}

    public static getInstance(): HydrationController {
        if (!HydrationController.instance) {
            HydrationController.instance = new HydrationController();
        }
        return HydrationController.instance;
    }

    public async initialize(): Promise<void> {
        console.log('HydrationController initialized');

        if (typeof window !== 'undefined') {
            const globalConfig = (window as any).ArchipelagoRenderer?.config;
            if (globalConfig?.debug) {
                const { HydrationDevOverlay } = await import('../devtools/hydration-dev-overlay');
                HydrationDevOverlay.init();
            }
        }

        this.setupIntersectionObserver();
    }

    public async destroy(): Promise<void> {
        this.hydrationMap.clear();
        this.hydrationQueue = [];
        this.isProcessing = false;
        console.log('HydrationController destroyed');
    }

    /**
     * Public method to queue any hydratable component
     */
    public queueIslandHydration(el: HTMLElement, role: string): void {
        const id = el.id || `island-${Math.random().toString(36).substring(2, 9)}`;

        if (this.hydrationMap.has(id) || el.dataset.hydrated === 'true') return;

        const priority = this.getPriority(el);
        this.hydrationQueue.push({ el, role, priority });
        this.hydrationQueue.sort((a, b) => a.priority - b.priority);

        this.processQueue();
    }

    /**
     * Hydration logic (de-duplicate, decorate, emit)
     */
    public async hydrateIsland(el: HTMLElement, role: string): Promise<void> {
        const id = el.id || `island-${Math.random().toString(36).substring(2, 9)}`;
        if (this.hydrationMap.has(id)) return;

        this.hydrationMap.set(id, true);
        el.dataset.hydrated = 'true';
        el.classList.add('hydrated');

        const template = el.outerHTML;
        const context = {}; // Fill in actual data context
        const options = { hydrate: true };

        try {
            const html = await RenderWorkerPool.getInstance().render(template, context, options);
            el.outerHTML = html;

            const event = new CustomEvent('archipelago:hydrated', {
                bubbles: true,
                detail: { id, role }
            });
            el.dispatchEvent(event);
        } catch (err) {
            console.error(`Failed to hydrate component ${id}:`, err);
        }
        HydrationDevOverlay.log(`Hydrated <${el.tagName.toLowerCase()}> (${role}) as ${id}`);
        HydrationDevOverlay.updateQueueCount(this.hydrationQueue.length);
    }

    /**
     * Hydrate 1 element per frame
     */
    private processQueue(): void {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const loop = () => {
            const next = this.hydrationQueue.shift();
            if (next) {
                this.hydrateIsland(next.el, next.role);
                requestAnimationFrame(loop);
            } else {
                this.isProcessing = false;
            }
        };

        requestAnimationFrame(loop);
    }

    /**
     * Convert priority string or number to normalized priority level
     */
    private getPriority(el: HTMLElement): number {
        const raw = el.getAttribute('data-priority') || 'medium';
        if (!isNaN(Number(raw))) return Number(raw);

        return {
            high: 1,
            medium: 5,
            low: 10,
        }[raw] ?? 5;
    }

    /**
     * IO observer for data-preload="onVisible"
     */
    private setupIntersectionObserver(): void {
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const el = entry.target as HTMLElement;
                    const role = el.getAttribute('data-role') || 'component';
                    const preload = el.getAttribute('data-preload');

                    if (preload === 'onVisible') {
                        this.queueIslandHydration(el, role);
                    }

                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '100px',
            threshold: 0.1,
        });

        // Observe any matching element in DOM
        document.querySelectorAll('[data-hydrate="true"][data-preload="onVisible"]').forEach(el => {
            observer.observe(el);
        });
    }
}
