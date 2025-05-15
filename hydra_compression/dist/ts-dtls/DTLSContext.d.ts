/// <reference types="node" />
/// <reference types="node" />
import { PQCipherSuite } from './PQCipherSuite';
import { PQCertificateManager } from './PQCertificateManager';
/**
 * Verification modes for certificate verification
 */
export declare enum VerifyMode {
    NONE = 0,
    PEER = 1,
    FAIL_IF_NO_PEER_CERT = 2,
    CLIENT_ONCE = 4
}
/**
 * DTLS protocol versions
 */
export declare enum DTLSVersion {
    DTLS_1_0 = "DTLS 1.0",
    DTLS_1_2 = "DTLS 1.2",
    DTLS_1_3 = "DTLS 1.3"
}
/**
 * Options for creating a DTLS context
 */
export interface DTLSContextOptions {
    isServer: boolean;
    cert?: Buffer | string;
    key?: Buffer | string;
    cipherSuites?: string[];
    pqCipherSuites?: PQCipherSuite[];
    minVersion?: DTLSVersion;
    maxVersion?: DTLSVersion;
    verifyMode?: VerifyMode;
    enableCertTransparency?: boolean;
    ocspStapling?: boolean;
    crlDistributionPoints?: string[];
    certificatePolicies?: string[];
}
/**
 * Manages DTLS context settings and certificates
 * This is a TypeScript implementation of the functionality provided by SSL_CTX in OpenSSL
 */
export declare class DTLSContext {
    private static nextId;
    private static contexts;
    readonly id: number;
    private readonly isServer;
    private readonly certificateManager;
    private readonly cipherSuites;
    private readonly pqCipherSuites;
    private readonly minVersion;
    private readonly maxVersion;
    private readonly verifyMode;
    private readonly enableCertTransparency;
    private readonly ocspStapling;
    private readonly crlDistributionPoints;
    private readonly certificatePolicies;
    private certificate?;
    private privateKey?;
    /**
     * Create a new DTLS context
     * @param options Context options
     */
    constructor(options: DTLSContextOptions);
    /**
     * Get a context by ID
     * @param id Context ID
     * @returns The context or undefined if not found
     */
    static getContextById(id: number): DTLSContext | undefined;
    /**
     * Free a context by ID
     * @param id Context ID
     * @returns true if the context was found and freed, false otherwise
     */
    static freeContext(id: number): boolean;
    /**
     * Set certificate and private key
     * @param cert Certificate as Buffer or string
     * @param key Private key as Buffer or string
     */
    setCertificateAndKey(cert: Buffer | string, key: Buffer | string): void;
    /**
     * Get the certificate
     * @returns The certificate or undefined if not set
     */
    getCertificate(): Buffer | undefined;
    /**
     * Get the private key
     * @returns The private key or undefined if not set
     */
    getPrivateKey(): Buffer | undefined;
    /**
     * Check if this is a server context
     * @returns true if this is a server context, false otherwise
     */
    isServerContext(): boolean;
    /**
     * Get the cipher suites
     * @returns Array of cipher suite strings
     */
    getCipherSuites(): string[];
    /**
     * Get the post-quantum cipher suites
     * @returns Array of PQCipherSuite enums
     */
    getPQCipherSuites(): PQCipherSuite[];
    /**
     * Get the minimum DTLS version
     * @returns The minimum DTLS version
     */
    getMinVersion(): DTLSVersion;
    /**
     * Get the maximum DTLS version
     * @returns The maximum DTLS version
     */
    getMaxVersion(): DTLSVersion;
    /**
     * Get the verify mode
     * @returns The verify mode
     */
    getVerifyMode(): VerifyMode;
    /**
     * Check if certificate transparency is enabled
     * @returns true if certificate transparency is enabled, false otherwise
     */
    isCertTransparencyEnabled(): boolean;
    /**
     * Check if OCSP stapling is enabled
     * @returns true if OCSP stapling is enabled, false otherwise
     */
    isOCSPStaplingEnabled(): boolean;
    /**
     * Get the CRL distribution points
     * @returns Array of CRL distribution point URIs
     */
    getCRLDistributionPoints(): string[];
    /**
     * Get the certificate policies
     * @returns Array of certificate policy OIDs
     */
    getCertificatePolicies(): string[];
    /**
     * Get the certificate manager
     * @returns The certificate manager
     */
    getCertificateManager(): PQCertificateManager;
    /**
     * Free this context
     * This removes it from the static map
     */
    free(): void;
}
