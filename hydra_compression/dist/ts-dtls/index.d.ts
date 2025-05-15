/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'events';
export declare enum SecurityLevel {
    STANDARD = "standard",
    POST_QUANTUM_MEDIUM = "pq-medium",
    POST_QUANTUM_HIGH = "pq-high",
    HYBRID = "hybrid"
}
export declare enum ConnectionState {
    CLOSED = "closed",
    HANDSHAKE = "handshake",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    DISCONNECTED = "disconnected",
    ERROR = "error"
}
export interface DTLSOptions {
    isServer?: boolean;
    cert?: string | Buffer;
    key?: string | Buffer;
    securityLevel?: SecurityLevel;
    minVersion?: '1.0' | '1.2' | '1.3';
    maxVersion?: '1.2' | '1.3';
    cipherSuites?: string[];
    verifyPeer?: boolean;
    debug?: boolean;
    timeout?: number;
    mtu?: number;
    autoFallback?: boolean;
}
export declare class DTLS extends EventEmitter {
    private readonly opts;
    private state;
    private socket?;
    private remoteAddress?;
    private remotePort?;
    private pqKeyExchange;
    private localKeyPair?;
    private remotePublicKey?;
    private sharedSecret?;
    constructor(options: DTLSOptions);
    private getPQAlgorithmForSecurityLevel;
    private validateOptions;
    connect(port: number, host: string, cb?: () => void): Promise<void>;
    listen(port: number, host?: string, cb?: () => void): void;
    private startHandshake;
    private createClientHello;
    send(data: Buffer | string): boolean;
    close(): void;
    private setupSocketEvents;
    private handleIncomingMessage;
    private handleServerHello;
    private handleApplicationData;
    private handleAlert;
    private encrypt;
    private decrypt;
    private handleError;
}
