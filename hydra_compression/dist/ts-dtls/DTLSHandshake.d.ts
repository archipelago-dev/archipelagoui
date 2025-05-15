/// <reference types="node" />
/// <reference types="node" />
import { PQCipherSuite } from './PQCipherSuite';
export declare enum DTLSVersion {
    DTLS_1_0 = "DTLS 1.0",
    DTLS_1_2 = "DTLS 1.2",
    DTLS_1_3 = "DTLS 1.3"
}
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
export interface HandshakeMessage {
    type: HandshakeType;
    length: number;
    messageSeq: number;
    fragmentOffset: number;
    fragmentLength: number;
    body: Buffer;
}
/**
 * Parse a DTLS handshake message from a buffer
 * @param data Buffer containing the handshake message
 * @returns Parsed handshake message
 */
export declare function parseHandshakeMessage(data: Buffer): HandshakeMessage;
/**
 * Create a DTLS handshake message
 * @param type Handshake message type
 * @param messageSeq Message sequence number
 * @param body Message body
 * @returns Buffer containing the handshake message
 */
export declare function createHandshakeMessage(type: HandshakeType, messageSeq: number, body: Buffer): Buffer;
/**
 * Create a ClientHello message
 * @param clientHello Client hello parameters
 * @param messageSeq Message sequence number
 * @returns Buffer containing the ClientHello message
 */
export declare function createClientHelloMessage(clientHello: ClientHello, messageSeq: number): Buffer;
/**
 * Create a ServerHello message
 * @param serverHello Server hello parameters
 * @param messageSeq Message sequence number
 * @returns Buffer containing the ServerHello message
 */
export declare function createServerHelloMessage(serverHello: ServerHello, messageSeq: number): Buffer;
