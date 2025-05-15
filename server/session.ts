import { VFSContainerManager } from '../core/vfs/container/vfs-container-manager';
import type { FastifyRequest } from 'fastify';

export async function getSessionContainer(req: FastifyRequest) {
    const uid = req.headers['x-user-id']?.toString() || 'default-user';
    const existing = VFSContainerManager.get(uid);
    return existing ?? await VFSContainerManager.create(uid);
}
