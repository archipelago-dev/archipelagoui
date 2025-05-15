import { Blake3 } from '../crypto/hash';
import Falcon from '../crypto/falcon';
import { IVirtualFileSystem, FileMode } from '../vfs/types';

export class QuantumEdgeSegmenter {
    private segments: Map<string, Uint8Array> = new Map();
    private maxSegments = 6;

    constructor(
        private vfs: IVirtualFileSystem,
        private topic: string,
        private signer: Awaited<ReturnType<typeof Falcon.FalconKeyPair>>,
        private cachePath = `/vault/hls_cache/${topic}`
    ) {}

    private estimateDuration(buf: Uint8Array): number {
        const kb = buf.length / 1024;
        return Math.max(1.5, Math.min(3.5, kb / 96));
    }

    private createMetadataTag(segmentId: string): Uint8Array {
        const hash = Blake3.from(segmentId).hex;
        return new TextEncoder().encode(`#Q-SEG:${segmentId}|${hash}|ARCHI\n`);
    }

    async sliceSegment(input: Uint8Array, id: string) {
        const metadata = this.createMetadataTag(id);
        const combined = new Uint8Array(metadata.length + input.length);
        combined.set(metadata);
        combined.set(input, metadata.length);

        this.segments.set(id, combined);
        if (this.segments.size > this.maxSegments) {
            const oldest = Array.from(this.segments.keys())[0];
            this.segments.delete(oldest);
        }

        const segPath = `${this.cachePath}/${id}.ts`;
        if (!(await this.vfs.exists(segPath))) await this.vfs.create(segPath);
        const file = await this.vfs.open(segPath, FileMode.WRITE);
        await file.write(combined);
        await file.close();
    }

    async getSegment(id: string): Promise<Uint8Array | null> {
        return this.segments.get(id) || null;
    }

    async getPlaylist(): Promise<string> {
        const ids = Array.from(this.segments.keys());
        const playlist = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            '#EXT-X-PLAYLIST-TYPE:EVENT',
            '#EXT-X-TARGETDURATION:4',
            `#EXT-X-MEDIA-SEQUENCE:${ids.length > 0 ? parseInt(ids[0].split('-')[1]) : 0}`,
        ];

        for (const id of ids) {
            const seg = this.segments.get(id)!;
            const dur = this.estimateDuration(seg).toFixed(1);
            playlist.push(`#EXTINF:${dur},`, `${id}.ts`);
        }

        const raw = playlist.join('\n');
        const sig = await Falcon.FalconSignDetached(
            new TextEncoder().encode(raw),
            this.signer.privateKey
        );

        playlist.push(`#EXT-X-SIGNATURE:${Buffer.from(sig).toString('base64')}`);

        return playlist.join('\n');
    }
}
