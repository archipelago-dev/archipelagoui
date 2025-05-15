import { datasetToProps, isVisible } from "./utils.js";
import { subscribe } from "./pubsub.js";

export async function LazyImportElement(el: HTMLElement) {
    const name = el.dataset.name;
    if (!name) return;

    const isRemote = name.startsWith("http://") || name.startsWith("https://");
    const props = datasetToProps(el);
    const container = document.createElement("div");

    el.replaceWith(container);

    const hydrate = async () => {
        try {
            const mod = await import(/* @vite-ignore */ name)


            const Component = mod?.default || mod;

            if (typeof Component === "function") {
                const output = Component(props);
                if (output instanceof HTMLElement) {
                    container.replaceChildren(output);
                } else if (typeof output === "string") {
                    container.innerHTML = output;
                }
            }
        } catch (err) {
            container.innerHTML = `<div style="color:red;">Error loading "${name}"</div>`;
            console.error("LazyImport error:", err);
        }
    };

    if (props.subscribe) {
        subscribe(name, () => hydrate());
    }

}

export function hydrateVisibleLazyImports() {
    const elements = document.querySelectorAll("lazy-import,LazyImport");
    elements.forEach(el => {
        if (isVisible(el)) {
            LazyImportElement(el as HTMLElement);
        } else {
            const io = new IntersectionObserver(([entry], obs) => {
                if (entry.isIntersecting) {
                    obs.unobserve(entry.target);
                    LazyImportElement(entry.target as HTMLElement);
                }
            });
            io.observe(el);
        }
    });
}

// Auto-run
if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", hydrateVisibleLazyImports);
    } else {
        hydrateVisibleLazyImports();
    }
}
