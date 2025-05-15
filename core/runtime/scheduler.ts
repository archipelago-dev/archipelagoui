export interface ScheduledTask {
    id: string;
    priority: number;
    run: () => Promise<void>;
}

const queue: ScheduledTask[] = [];
let running = false;

export function scheduleHydration(task: ScheduledTask) {
    queue.push(task);
    queue.sort((a, b) => a.priority - b.priority);
    startQueue();
}

function startQueue() {
    if (!running) {
        running = true;
        requestAnimationFrame(executeNext);
    }
}

async function executeNext() {
    const next = queue.shift();
    if (next) {
        try {
            await next.run();
        } catch (err) {
            console.error(`[Archipelago] Failed to hydrate ${next.id}:`, err);
        }
        requestAnimationFrame(executeNext); // throttle to 1 per frame
    } else {
        running = false;
    }
}
