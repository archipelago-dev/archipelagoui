export function datasetToProps(el: HTMLElement): Record<string, any> {
    const props: Record<string, any> = {};
    for (const [key, value] of Object.entries(el.dataset)) {
        try {
            props[key] = JSON.parse(<string>value);
        } catch {
            props[key] = value;
        }
    }
    return props;
}

export function isVisible(el: Element): boolean {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
}
