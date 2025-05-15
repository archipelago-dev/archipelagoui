

import { QuantumEdgeSegmenter } from '../../../../../core/stream/quantum-segmenter';
import {getSessionContainer} from "../../../../session";
import {FileMode} from "../../../../../core/vfs/types";

export async function GET(req, reply) {
    const { topic, segment } = req.params;
    const container = await getSessionContainer(req);
    const vault = container.mounts.get('/vault');

    if (!vault) return reply.status(500).send('Vault not available');

    const segPath = `/vault/hls_cache/${topic}/${segment}`;
    if (!(await vault.exists(segPath))) return reply.status(404).send('Segment not found');

    const file = await vault.open(segPath, <FileMode>'r');
    const buffer = new Uint8Array(128 * 1024);
    const len = await file.read(buffer, buffer.length);
    await file.close();

    reply.type('video/MP2T').send(buffer.slice(0, len));
}

export const segmenterPool = new Map<string, QuantumEdgeSegmenter>();

