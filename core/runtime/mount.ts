import type { ParsedComponentMeta } from "./parse.js";
import { callLifecycle } from "./module-manager.js";
import { recordHydration } from "./dev-overlay.js";

const TAILWIND_PATH = "/assets/global.css";

function renderFallback(tag: string) {
    const fallback = document.createElement("div");
    fallback.className =
        "w-full p-4 text-center bg-blue-50 border border-blue-200 text-blue-800 animate-pulse rounded shadow";
    fallback.innerHTML = `
    <strong class="block mb-1 text-blue-900">🌪️ Island "${tag}" under severe weather conditions</strong>
    <span class="text-sm">It will come back shortly.</span>
  `;
    return fallback;
}

function injectTailwindCSS(shadowRoot: ShadowRoot) {
    if (shadowRoot.querySelector('link[data-tailwind]')) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = TAILWIND_PATH;
    link.setAttribute("data-tailwind", "true");

    shadowRoot.prepend(link);
}

export async function mountComponent(
    Component: any,
    meta: ParsedComponentMeta
): Promise<void> {
    const { el, tag, props, componentId, priority } = meta;

    try {
        await callLifecycle("onBeforeRender", { tag, props, el, componentId });

        const useShadow = props.shadow === true || props.shadow === "true";
        const mountTarget = useShadow
            ? el.shadowRoot || el.attachShadow({ mode: "open" })
            : el;

        if (useShadow) injectTailwindCSS(mountTarget as ShadowRoot);

        let result: string | HTMLElement | HTMLElement[] | DocumentFragment | undefined;

        try {
            result = await Component(props);
        } catch (e) {
            await callLifecycle("onError", { tag, error: e, phase: "render", componentId });
            throw e;
        }

        if (typeof result === "string") {
            mountTarget.innerHTML = result;
        } else if (Array.isArray(result)) {
            mountTarget.replaceChildren(...result);
        } else if (result instanceof DocumentFragment) {
            mountTarget.replaceChildren(result);
        } else if (result instanceof HTMLElement) {
            mountTarget.replaceChildren(result);
        } else {
            console.warn(`[Archipelago] "${tag}" returned nothing or unsupported output.`);
        }

        await callLifecycle("onAfterRender", { tag, props, el, componentId });
        recordHydration(tag, componentId, priority);
    } catch (e) {
        const fallback = renderFallback(tag);
        el.replaceChildren(fallback);
        console.error(`[Archipelago] Mount failed: ${tag}`, e);
    }
}
