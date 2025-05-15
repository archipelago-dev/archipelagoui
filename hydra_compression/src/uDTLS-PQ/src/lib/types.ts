// src/lib/types.ts
import { EventEmitter } from 'events';

export enum DTLSVersion {
    DTLS_1_0 = 'DTLS 1.0',
    DTLS_1_2 = 'DTLS 1.2',
    DTLS_1_3 = 'DTLS 1.3',
}

export enum VerifyMode {
    NONE = 0,
    PEER = 1,
    FAIL_IF_NO_PEER_CERT = 2,
    CLIENT_ONCE = 4,
}

export enum ConnectionState {
    HANDSHAKE = 'handshake',
    CONNECTED = 'connected',
    CLOSING = 'closing',
    CLOSED = 'closed',
    ERROR = 'error'
}

export interface DTLSSocketOptions {
    address: string;
    port: number;
    cert?: string | Buffer;
    key?: string | Buffer;
    ca?: string | Buffer | Array<string | Buffer>;
    ciphers?: string[];
    pqCiphers?: string[];
    minVersion?: DTLSVersion;
    maxVersion?: DTLSVersion;
    verifyMode?: VerifyMode;
    requestCert?: boolean;
    rejectUnauthorized?: boolean;
    timeout?: number;
    retransmits?: number;
    mtu?: number;
}

export interface EnhancedDTLSOptions extends DTLSSocketOptions {
    autoRekey?: boolean;
    rekeyInterval?: number;
    rekeyDataLimit?: number;
    earlyData?: boolean;
    earlyDataSize?: number;
}

export class DTLSSocket extends EventEmitter {
    constructor(options: DTLSSocketOptions) {
        super();
    }

    connect(options?: any): Promise<void> {
        return Promise.resolve();
    }

    send(data: Buffer): Promise<void> {
        return Promise.resolve();
    }

    close(): Promise<void> {
        return Promise.resolve();
    }

    sendClientHello(clientHello: any): Promise<any> {
        return Promise.resolve({});
    }

    hasValidSessionTicket(): boolean {
        return false;
    }

    useBufferPool(param: { initialSize: number; packetSizes: number[] }) {
        
    }

    enableCryptoPrecomputation(param: { dhParamsCache: boolean; staticKeyCache: boolean }) {
        
    }

    enablePacketBatching(param: {maxDelay: number; maxSize: number}) {
        
    }
}

export enum PQAlgorithm {
    KYBER512 = 'kyber512',
    KYBER768 = 'kyber768',
    KYBER1024 = 'kyber1024',
    DILITHIUM2 = 'dilithium2',
    DILITHIUM3 = 'dilithium3',
    DILITHIUM5 = 'dilithium5',
}

/** Opaque handle coming back from native `createContext(...)` */
export class DTLSContext { constructor(public id: number) {} }
/** Opaque handle coming back from native `createSession(...)` */
export class DTLSSession { constructor(public id: number) {} }

export enum PQCipherSuite {
    KYBER512_AES_128_GCM_SHA256 = 'TLS_KYBER512_WITH_AES_128_GCM_SHA256',
    KYBER768_AES_256_GCM_SHA384 = 'TLS_KYBER768_WITH_AES_256_GCM_SHA384',
    KYBER1024_AES_256_GCM_SHA512 = 'TLS_KYBER1024_WITH_AES_256_GCM_SHA512',
}

/**
 * Schedule an automatic rekey on a DTLS session.
 * @param sessionId   the numeric handle for your session
 * @param intervalMs  how often to rekey, in milliseconds
 */


declare function setupAutomaticRekey<T>(sessionId: number, intervalMs: number): void;

export interface DTLSContextOptions {
    cert?: string | Buffer;
    key?: string | Buffer;
    ca?: string | Buffer | Array<string | Buffer>;
    crl?: string | Buffer | Array<string | Buffer>;
    ciphers?: string[];
    pqCiphers?: PQCipherSuite[];
    minVersion?: DTLSVersion;
    maxVersion?: DTLSVersion;
    verifyMode?: VerifyMode;
    requestCert?: boolean;
    rejectUnauthorized?: boolean;
    enableCertTransparency?: boolean;
    pskIdentityHint?: string;
    pskKey?: Buffer;
    isServer: boolean;
}

export interface DTLSConnectionOptions {
    socket: any; // dgram.Socket
    context: DTLSContext;
    peerAddress: string;
    peerPort: number;
    mtu?: number;
    timeout?: number;
    retransmits?: number;
}



export type PQKeyPair = {
    publicKey: any;
    privateKey: any;
};

/**
 * Types and interfaces for hybrid PQ certificates and DTLS-PQ.
 */

/** Classical asymmetric key types */
export enum ClassicalKeyType {
    ECDSA_P256 = 'ECDSA_P256',
    RSA_2048 = 'RSA_2048'
}



/** Distinguished Name for certificate subject or issuer */
export interface SubjectDN {
    commonName: string;
    organization?: string;
    organizationalUnit?: string;
    country?: string;
    state?: string;
    locality?: string;
}

/** Certificate generation options */
export interface CertificateOptions {
    keyType: ClassicalKeyType;
    pqAlgorithm: PQAlgorithm;
    subject: SubjectDN;
    issuerCert?: Buffer;
    issuerKey?: Buffer;
    validityDays: number;
    isCA?: boolean;
    keyUsage?: string[];
    extendedKeyUsage?: string[];
    altNames?: string[];
    policies?: string[];
    pqPublicKeyOID: string;
    classicalPublicKeyOID: string;
    crlDistributionPoints?: string[];
    ocspURLs?: string[];
}

/** Public and private key pair */
export interface HybridKeyPair {
    publicKey: Buffer;
    privateKey: Buffer;
}

/** X.509 extension structure */
export interface X509Extension {
    oid: string;
    critical: boolean;
    value: Buffer;
}
