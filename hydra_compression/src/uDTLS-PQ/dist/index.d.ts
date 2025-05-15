import { EventEmitter } from 'node:events';

declare enum SecurityLevel {
    STANDARD = "standard",
    POST_QUANTUM_MEDIUM = "pq-medium",
    POST_QUANTUM_HIGH = "pq-high",
    HYBRID = "hybrid"
}
interface DTLSOptions {
    isServer?: boolean;
    cert?: string | Buffer;
    key?: string | Buffer;
    securityLevel?: SecurityLevel;
    minVersion?: "1.0" | "1.2" | "1.3";
    maxVersion?: "1.2" | "1.3";
    cipherSuites?: string[];
    verifyPeer?: boolean;
    debug?: boolean;
    timeout?: number;
    mtu?: number;
    autoFallback?: boolean;
}
declare class DTLS extends EventEmitter {
    private context;
    private session;
    private readonly opts;
    private state;
    private socket?;
    constructor(options: DTLSOptions);
    private initContext;
    private pickPqSuites;
    private mapVersion;
    private compareVer;
    connect(port: number, host: string, cb?: () => void): void;
    private setupSocketEvents;
    private onUdpData;
    send(data: Buffer | string): void;
    close(): void;
    private handleError;
}

declare const dtls: DTLS;

export { dtls };
