import { HydrationController } from './hydration-controller';

/**
 * HydratableElementManager
 * Scans the DOM and registers all hydratable elements (islands + components)
 * Handles JIT hydration priority queuing.
 */
export class HydratableElementManager {
    private controller = HydrationController.getInstance();

    /**
     * Scan and queue all hydratable elements (both islands and global components)
     */
    public scanAndQueueAll(): void {
        const selector = '[data-hydrate="true"]:not([data-hydrated])';
        this.observeDynamicComponents(); // watch for lazy-imported or JS-rendered components

        document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
            const role = el.getAttribute('data-role') || 'component';
            const preload = el.getAttribute('data-preload') || 'onVisible';
            this.observeDynamicComponents(); // watch for lazy-imported or JS-rendered components

            // If preload strategy is immediate, hydrate now
            if (preload === 'eager') {
                this.controller.queueIslandHydration(el, role);
            }

            // If preload is onVisible, wait for IO
            if (preload === 'onVisible') {
                this.observeForVisibility(el, role);
            }
        });
    }

    /**
     * Observe an element using IntersectionObserver
     */
    private observeForVisibility(el: HTMLElement, role: string): void {
        if (!('IntersectionObserver' in window)) {
            this.controller.queueIslandHydration(el, role);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.controller.queueIslandHydration(el, role);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '100px',
            threshold: 0.1,
        });

        observer.observe(el);
    }

    public observeDynamicComponents(): void {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node instanceof HTMLElement && node.dataset.hydrate === 'true' && !node.dataset.hydrated) {
                        const role = node.getAttribute('data-role') || 'component';
                        const preload = node.getAttribute('data-preload') || 'onVisible';

                        if (preload === 'eager') {
                            this.controller.queueIslandHydration(node, role);
                        } else if (preload === 'onVisible') {
                            this.observeForVisibility(node, role);
                        }
                    }
                });
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

}
