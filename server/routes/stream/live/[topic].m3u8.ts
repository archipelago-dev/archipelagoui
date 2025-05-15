// server/routes/stream/live/[topic].m3u8.ts


import {QuantumEdgeSegmenter} from "../../../../core/stream/quantum-segmenter";
import {getSessionContainer} from "../../../session";
import {FileMode} from "../../../../core/vfs/types";

const activeSegmenters = new Map<string, QuantumEdgeSegmenter>();

export async function GET(req, reply) {
    const topic = req.params.topic;
    const container = await getSessionContainer(req);
    const vault = container.mounts.get('/vault');
    const pub = container.mounts.get('/p2p');

    if (!vault || !pub) return reply.status(500).send('Missing VFS mounts');

    let segmenter = activeSegmenters.get(topic);
    if (!segmenter) {
        segmenter = new QuantumEdgeSegmenter(pub, topic, container.signer);
        activeSegmenters.set(topic, segmenter);
    }

    const livePath = `/p2p/pub/${topic}.live`;
    const feedFile = await pub.open(livePath, <FileMode>'r');
    const chunk = new Uint8Array(256 * 1024);
    const len = await feedFile.read(chunk, chunk.length);
    await feedFile.close();

    if (len > 0) {
        const id = `seg-${Date.now()}`;
        await segmenter.sliceSegment(chunk.slice(0, len), id);
    }

    const playlist = await segmenter.getPlaylist();
    reply.type('application/vnd.apple.mpegurl').send(playlist);
}
