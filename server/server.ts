import Fastify from 'fastify';
import { getSessionContainer } from './session';
import { verifyVaultSignature } from '../core/vfs/container/verify-vault';
import {SegmentSlicer} from "../core/runtime/segment-slicer";
import {FileMode} from "../core/vfs/types";

const fastify = Fastify({ logger: true });

// GET /stream/verify/:path+
fastify.get('/stream/verify/*', async (req, reply) => {
    const filePath = '/' + (req.params['*'] as string);
    const container = await getSessionContainer(req);
    const vault = container.mounts.get('/vault');
    if (!vault) return reply.status(500).send({ error: 'Vault not mounted' });

    try {
        const verified = await verifyVaultSignature(vault, filePath);
        return { path: filePath, verified };
    } catch (err: any) {
        return reply.status(500).send({ error: err.message });
    }
});

fastify.get('/stream/live/:topic.m3u8', async (req, reply) => {
    // @ts-ignore
    const topic = req.params.topic;
    const container = await getSessionContainer(req);
    const p2p = container.mounts.get('/p2p');

    const slicer = new SegmentSlicer(p2p!, topic);
    await slicer.slice(); // In production, this would run continuously

    const playlist = slicer.getPlaylist();
    reply.type('application/vnd.apple.mpegurl').send(playlist);
});

fastify.get('/stream/live/:topic/:segment.ts', async (req, reply) => {
    // @ts-ignore
    const { topic, segment } = req.params;
    const container = await getSessionContainer(req);
    const p2p = container.mounts.get('/p2p');

    const slicer = new SegmentSlicer(p2p!, topic);
    const segmentData = slicer.getSegment(segment);

    if (!segmentData) return reply.status(404).send('Segment not found');
    reply.type('video/MP2T').send(segmentData);
});


// GET /stream/live/:topic
fastify.get('/stream/live/:topic', async (req, reply) => {
    // @ts-ignore
    const topic = req.params.topic;
    const container = await getSessionContainer(req);
    const p2p = container.mounts.get('/p2p');

    if (!p2p) return reply.status(500).send({ error: 'P2P not mounted' });

    const livePath = `/p2p/pub/${topic}.live`;
    if (!(await p2p.exists(livePath))) return reply.status(404).send({ error: 'Not found' });

    const file = await p2p.open(livePath, <FileMode>'r');
    reply.raw.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'no-store',
    });

    const buffer = new Uint8Array(64 * 1024);
    while (true) {
        const len = await file.read(buffer, buffer.length);
        if (len === 0) break;
        reply.raw.write(buffer.slice(0, len));
    }

    await file.close();
    reply.raw.end();
});

fastify.listen({ port: 7070 }, err => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
});
