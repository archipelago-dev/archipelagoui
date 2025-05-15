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

export enum HandshakeType {
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

export function parseHandshakeMessage(data: Buffer): HandshakeMessage {
    const type = data[0] as HandshakeType;
    const length = (data[1] << 16) | (data[2] << 8) | data[3];
    const messageSeq = (data[4] << 8) | data[5];
    const fragmentOffset = (data[6] << 16) | (data[7] << 8) | data[8];
    const fragmentLength = (data[9] << 16) | (data[10] << 8) | data[11];
    const body = data.slice(12, 12 + fragmentLength);
    
    return {
        type,
        length,
        messageSeq,
        fragmentOffset,
        fragmentLength,
        body
    };
}

export function createHandshakeMessage(type: HandshakeType, messageSeq: number, body: Buffer): Buffer {
    const header = Buffer.alloc(12);
    header[0] = type;
    header[1] = (body.length >> 16) & 0xFF;
    header[2] = (body.length >> 8) & 0xFF;
    header[3] = body.length & 0xFF;
    header[4] = (messageSeq >> 8) & 0xFF;
    header[5] = messageSeq & 0xFF;
    header[6] = 0; // fragmentOffset
    header[7] = 0;
    header[8] = 0;
    header[9] = (body.length >> 16) & 0xFF;
    header[10] = (body.length >> 8) & 0xFF;
    header[11] = body.length & 0xFF;
    
    return Buffer.concat([header, body]);
}