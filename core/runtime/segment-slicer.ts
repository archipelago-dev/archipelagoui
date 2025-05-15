import { IVirtualFileSystem, FileMode } from '../vfs/types';

type Segment = {
    id: string;
    buffer: Uint8Array;
    duration: number;
};

export class SegmentSlicer {
    private readonly segments: Segment[] = [];
    private readonly maxSegments = 5; // rolling window
    private counter = 0;

    constructor(private vfs: IVirtualFileSystem, private topic: string) {}

    async slice(): Promise<void> {
        const path = `/p2p/pub/${this.topic}.live`;
        if (!(await this.vfs.exists(path))) return;

        const file = await this.vfs.open(path, FileMode.READ);
        const buffer = new Uint8Array(256 * 1024); // 256KB
        const len = await file.read(buffer, buffer.length);
        if (len === 0) return;

        const chunk = buffer.slice(0, len);
        const segment: Segment = {
            id: `seg-${this.counter++}`,
            buffer: chunk,
            duration: 3.5, // estimated in seconds
        };

        this.segments.push(segment);
        if (this.segments.length > this.maxSegments) this.segments.shift();

        await file.close();
    }

    getPlaylist(): string {
        return [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            '#EXT-X-TARGETDURATION:4',
            '#EXT-X-MEDIA-SEQUENCE:' + Math.max(0, this.counter - this.segments.length),
            ...this.segments.map(s => `#EXTINF:${s.duration.toFixed(1)},\n${s.id}.ts`)
        ].join('\n');
    }

    getSegment(id: string): Uint8Array | undefined {
        return this.segments.find(s => s.id === id)?.buffer;
    }
}
