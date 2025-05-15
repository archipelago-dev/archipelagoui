import { PQCipherSuite } from './PQCipherSuite';

export enum DTLSVersion {
    DTLS_1_0 = 'DTLS 1.0',
    DTLS_1_2 = 'DTLS 1.2',
    DTLS_1_3 = 'DTLS 1.3',
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

/**
 * Create a DTLS handshake message
 * @param type Handshake message type
 * @param messageSeq Message sequence number
 * @param body Message body
 * @returns Buffer containing the handshake message
 */
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

/**
 * Create a ClientHello message
 * @param clientHello Client hello parameters
 * @param messageSeq Message sequence number
 * @returns Buffer containing the ClientHello message
 */
export function createClientHelloMessage(clientHello: ClientHello, messageSeq: number): Buffer {
    // Generate random data if not provided
    const random = clientHello.random || crypto.getRandomValues(Buffer.alloc(32));
    
    // Generate session ID if not provided
    const sessionId = clientHello.sessionId || crypto.getRandomValues(Buffer.alloc(32));
    
    // Default compression methods
    const compressionMethods = clientHello.compressionMethods || [0]; // 0 = no compression
    
    // Build client hello body
    const body = Buffer.alloc(2 + 32 + 1 + sessionId.length + 2 + clientHello.cipherSuites.length * 2 + 1 + compressionMethods.length);
    
    // Protocol version (DTLS 1.2 = 0xfefd)
    body[0] = 0xfe;
    body[1] = 0xfd;
    
    // Random data
    random.copy(body, 2, 0, 32);
    
    // Session ID
    body[34] = sessionId.length;
    sessionId.copy(body, 35, 0, sessionId.length);
    
    // Cipher suites
    const cipherSuitesOffset = 35 + sessionId.length;
    body.writeUInt16BE(clientHello.cipherSuites.length * 2, cipherSuitesOffset);
    
    let offset = cipherSuitesOffset + 2;
    for (const suite of clientHello.cipherSuites) {
        // In a real implementation, we would convert the cipher suite string to its numeric code
        // For this demo, we'll just use a placeholder value
        body.writeUInt16BE(0x1301, offset); // TLS_AES_128_GCM_SHA256
        offset += 2;
    }
    
    // Compression methods
    body[offset++] = compressionMethods.length;
    for (const method of compressionMethods) {
        body[offset++] = method;
    }
    
    // Extensions would go here in a full implementation
    
    return createHandshakeMessage(HandshakeType.CLIENT_HELLO, messageSeq, body);
}

/**
 * Create a ServerHello message
 * @param serverHello Server hello parameters
 * @param messageSeq Message sequence number
 * @returns Buffer containing the ServerHello message
 */
export function createServerHelloMessage(serverHello: ServerHello, messageSeq: number): Buffer {
    // Build server hello body
    const body = Buffer.alloc(2 + 32 + 1 + serverHello.sessionId.length + 2 + 1);
    
    // Protocol version (DTLS 1.2 = 0xfefd)
    body[0] = 0xfe;
    body[1] = 0xfd;
    
    // Random data
    serverHello.random.copy(body, 2, 0, 32);
    
    // Session ID
    body[34] = serverHello.sessionId.length;
    serverHello.sessionId.copy(body, 35, 0, serverHello.sessionId.length);
    
    // Cipher suite
    const cipherSuiteOffset = 35 + serverHello.sessionId.length;
    // In a real implementation, we would convert the cipher suite string to its numeric code
    // For this demo, we'll just use a placeholder value
    body.writeUInt16BE(0x1301, cipherSuiteOffset); // TLS_AES_128_GCM_SHA256
    
    // Compression method
    body[cipherSuiteOffset + 2] = serverHello.compressionMethod;
    
    // Extensions would go here in a full implementation
    
    return createHandshakeMessage(HandshakeType.SERVER_HELLO, messageSeq, body);
}
