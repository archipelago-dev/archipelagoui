/// <reference types="node" />
/// <reference types="node" />
import { PQCipherSuite } from './PQCipherSuite';
import { DTLSVersion } from './lib/types';
export interface ClientHello {
    versions: string[];
    cipherSuites: (string | PQCipherSuite)[];
    random?: Buffer;
    sessionId?: Buffer;
    compressionMethods?: number[];
    extensions?: Record<string, any>;
}
export interface ServerHello {
    version: string;
    cipherSuite: string | PQCipherSuite;
    random: Buffer;
    sessionId: Buffer;
    compressionMethod: number;
    extensions?: Record<string, any>;
}
export interface NegotiatedParameters {
    version: DTLSVersion;
    cipherSuite: string | PQCipherSuite;
    compressionMethod: number;
    extensions: Record<string, any>;
    pqSupported: boolean;
}
export interface HandshakeMessage {
    type: HandshakeType;
    length: number;
    messageSeq: number;
    fragmentOffset: number;
    fragmentLength: number;
    body: Buffer;
}
export declare enum HandshakeType {
    HELLO_REQUEST = 0,
    CLIENT_HELLO = 1,
    SERVER_HELLO = 2,
    HELLO_VERIFY_REQUEST = 3,
    CERTIFICATE = 11,
    SERVER_KEY_EXCHANGE = 12,
    CERTIFICATE_REQUEST = 13,
    SERVER_HELLO_DONE = 14,
    CERTIFICATE_VERIFY = 15,
    CLIENT_KEY_EXCHANGE = 16,
    FINISHED = 20
}
export declare function parseHandshakeMessage(data: Buffer): HandshakeMessage;
export declare function createHandshakeMessage(type: HandshakeType, messageSeq: number, body: Buffer): Buffer;
