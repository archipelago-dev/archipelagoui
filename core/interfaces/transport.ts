// core/interfaces/transport.ts

export interface Transport {
    /** Connect to a remote peer (no-op for memory transport) */
    connect(port: number, host: string): Promise<void>;

    /** Start listening for incoming connections */
    listen(port: number): Promise<void>;

    /** Send encrypted data to the peer */
    send(data: Uint8Array): Promise<void>;

    /** Close the transport and clean up resources */
    close(): void;

    /** Register event handlers */
    on(event: 'message', handler: (data: Uint8Array) => void): void;
    on(event: 'error', handler: (err: Error) => void): void;
}

/** Optional security levels for different implementations */
export enum SecurityLevel {
    STANDARD = 'standard',
    POST_QUANTUM_MEDIUM = 'pq-medium',
    POST_QUANTUM_HIGH = 'pq-high',
    HYBRID = 'hybrid'
}

/** Supported encryption algorithms */
export enum TransportAlgorithm {
    NONE = 'none',
    AES_GCM = 'aes-gcm',
    KYBER_AES_GCM = 'kyber+aes-gcm'
}

/** Supported signature algorithms */
export enum SignatureAlgorithm {
    NONE = 'none',
    FALCON = 'falcon'
}

export interface TransportOptions {
    isServer: boolean;
    cert?: Buffer;
    key?: Buffer;
    securityLevel?: SecurityLevel;
    algorithm?: TransportAlgorithm;
    signature?: SignatureAlgorithm;
    peerPublicKey?: Uint8Array;
}
