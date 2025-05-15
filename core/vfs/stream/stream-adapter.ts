
import { IVirtualFileSystem, FileMode } from '../types';
import { verifyVaultSignature } from '../container/verify-vault';
import { Blake3 } from '../../crypto/hash';
import { SecureSocket } from "../../net/secure-sockets";


export class StreamAdapter {

    private recordTo?: IVirtualFileSystem;
    private url: any;
    private transport: SecureSocket | undefined;

    constructor(
        private fs: IVirtualFileSystem,
        private enableVerification = true,
        recordTo?: IVirtualFileSystem // optional vault
    ) {
        if (this.url.protocol.startsWith("dtls")) {
            this.transport = new SecureSocket({
                host: this.url.hostname,
                port: parseInt(this.url.port, 10) || 4444,
            });
            (async () =>await this.transport?.connect())();
            this.transport.on("message", (chunk) => this.onChunk(chunk));
        } else {
            /* existing UDP/TCP fallback … */
        }

    }

    async openStream(path: string): Promise<ReadableStream<Uint8Array>> {
        if (this.enableVerification) {
            const verified = await verifyVaultSignature(this.fs, path);
            if (!verified) throw new Error(`Signature failed: ${path}`);
        }

        const file = await this.fs.open(path, FileMode.READ);
        const chunkSize = 64 * 1024; // 64KB

        return new ReadableStream<Uint8Array>({
            pull: async function (controller) {
                const buffer = new Uint8Array(chunkSize);
                const len = await file.read(buffer, chunkSize);
                if (len === 0) {
                    controller.close();
                    await file.close();
                    return;
                }

                controller.enqueue(buffer.slice(0, len));

                // @ts-ignore
                if (this.recordTo) {
                    const hash = Blake3.from(path).hex;
                    const recPath = `/recordings/${hash}.chunk`;
                    // @ts-ignore
                    if (!(await this.recordTo.exists(recPath))) await this.recordTo.create(recPath);
                    // @ts-ignore
                    const recFile = await this.recordTo.open(recPath, FileMode.APPEND);
                    await recFile.write(buffer.slice(0, len));
                    await recFile.close();
                }
            }
        });
    }

    async getMetadata(path: string): Promise<{ mime: string; size: number; verified: boolean }> {
        const info = await this.fs.info(path);
        const verified = this.enableVerification
            ? await verifyVaultSignature(this.fs, path).catch(() => false)
            : true;

        const ext = path.split('.').pop() || '';
        const mime = {
            mp4: 'video/mp4',
            webm: 'video/webm',
            ogg: 'video/ogg',
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
        }[ext] || 'application/octet-stream';

        return { mime, size: info.size, verified };
    }

    /**
     * Link real-time pubsub stream as virtual feed
     */
    async pipeFromFeed(topic: string, getFeed: () => AsyncGenerator<Uint8Array>) {
        const recPath = `/p2p/pub/${topic}.live`;

        if (!(await this.fs.exists(recPath))) await this.fs.create(recPath);
        const writer = await this.fs.open(recPath, FileMode.APPEND);

        for await (const chunk of getFeed()) {
            await writer.write(chunk);
        }

        await writer.flush();
        await writer.close();
    }

    private onChunk(chunk: any) {

    }
}

export function createStreamAdapter(
    source: IVirtualFileSystem,
    verify = true,
    vault?: IVirtualFileSystem
): StreamAdapter {
    return new StreamAdapter(source, verify, vault);
}
