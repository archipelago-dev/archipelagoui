import { HydrationDevOverlay } from '../devtools/hydration-dev-overlay';


type RenderJob = {
    id: string;
    template: string;
    context: any;
    options: any;
    resolve: (html: string) => void;
    reject: (err: any) => void;
};

export class RenderWorkerPool {
    private static instance: RenderWorkerPool;
    private workers: Worker[] = [];
    private queue: RenderJob[] = [];
    private busy: Set<Worker> = new Set();

    private constructor(private poolSize: number = navigator.hardwareConcurrency || 4) {
        for (let i = 0; i < this.poolSize; i++) {
            // @ts-ignore
            const worker = new Worker(new URL('../workers/render.worker.ts', import.meta.url), {
                type: 'module'
            });

            worker.onmessage = (e) => {
                const { id, html, error } = e.data;
                const job = this.queue.find(j => j.id === id);
                if (!job) return;

                if (error) job.reject(error);
                else job.resolve(html);

                this.busy.delete(worker);
                HydrationDevOverlay.updateWorkerCount(this.busy.size);
                this.dequeue();
            };

            this.workers.push(worker);
        }
    }

    public static getInstance(): RenderWorkerPool {
        if (!RenderWorkerPool.instance) {
            RenderWorkerPool.instance = new RenderWorkerPool();
        }
        return RenderWorkerPool.instance;
    }

    public async render(template: string, context: any, options: any = {}): Promise<string> {
        const id = `job-${Math.random().toString(36).substring(2, 8)}`;
        return new Promise((resolve, reject) => {
            this.queue.push({ id, template, context, options, resolve, reject });
            this.dequeue();
        });
    }

    private dequeue() {
        if (this.queue.length === 0) return;

        const idleWorker = this.workers.find(w => !this.busy.has(w));
        if (!idleWorker) return;

        const job = this.queue.shift();
        if (!job) return;

        this.busy.add(idleWorker);
        HydrationDevOverlay.updateWorkerCount(this.busy.size);
        idleWorker.postMessage({
            id: job.id,
            template: job.template,
            context: job.context,
            options: job.options,
        });
    }
}
