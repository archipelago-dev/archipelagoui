let componentCounter = 0;

export interface ParsedComponentMeta {
    el: HTMLElement;
    tag: string;
    props: Record<string, any>;
    priority: number;
    componentId: string;
}

export function parseComponentElement(el: HTMLElement): ParsedComponentMeta {
    const tag = el.dataset.tag;
    if (!tag) throw new Error(`Missing data-tag on element: ${el.outerHTML}`);

    const props: Record<string, any> = {};
    for (const [key, value] of Object.entries(el.dataset)) {
        if (key !== "tag") {
            try {
                props[key] = JSON.parse(<string>value);
            } catch {
                props[key] = value;
            }
        }
    }

    // Assign a unique component-id
    const id = el.dataset.componentId || `comp-${String(++componentCounter).padStart(3, "0")}`;
    el.dataset.componentId = id;

    // Assign a priority
    let priority = parseFloat(props.priority);
    if (Number.isNaN(priority)) {
        priority = autoAssignPriority(el, tag);
        props.priority = priority;
    }

    return { el, tag, props, priority, componentId: id };
}

function autoAssignPriority(el: Element, tag: string): number {
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Higher on the screen = higher priority
    const distanceFromTop = Math.max(rect.top, 0);
    const visibilityScore = Math.max(0, 1 - distanceFromTop / viewportHeight);

    // Static tag weight (Navbar > Card > Footer etc.)
    const tagWeights: Record<string, number> = {
        Navbar: 0,
        Hero: 0.5,
        Card: 1,
        LazyImport: 2,
        Footer: 3
    };

    const tagWeight = tagWeights[tag] ?? 1.5;
    return Math.round((tagWeight + (1 - visibilityScore)) * 100);
}
