/// <reference types="node" />
/// <reference types="node" />
interface DTLSConfig {
    host: string;
    port: number;
    pskIdentity: string;
    pskKey: Buffer;
}
export interface SendOptions {
    strategy?: 'lz4' | 'zstd' | 'snappy';
    aesKey: Buffer;
    aesIV: Buffer;
    dtls: DTLSConfig;
}
export declare function compressAndSend(payload: Buffer, opts: SendOptions): Promise<void>;
export {};
