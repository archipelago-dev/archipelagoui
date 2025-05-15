// core/transports/transport-factory.ts

import { Transport, TransportOptions } from '../interfaces/transport';
import { SecureMemoryTransport } from './secure-memory-transport';

export abstract class TransportFactory {
    abstract create(opts: TransportOptions): Promise<Transport>;
}

export class DefaultTransportFactory extends TransportFactory {
    async create(opts: TransportOptions): Promise<Transport> {
        const transport = new SecureMemoryTransport(opts);
        await transport.init?.();
        return transport;
    }
}
