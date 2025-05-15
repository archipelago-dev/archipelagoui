const subs: Record<string, Set<(data: any) => void>> = {};

export function publish(topic: string, data: any) {
    subs[topic]?.forEach(fn => fn(data));
}

export function subscribe(topic: string, fn: (data: any) => void): () => void {
    if (!subs[topic]) subs[topic] = new Set();
    subs[topic].add(fn);
    return () => subs[topic].delete(fn);
}
