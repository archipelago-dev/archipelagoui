/// <reference types="node" />
/// <reference types="node" />
import { PQAlgorithm } from './PQKeyExchange';
/**
 * Types for certificate management
 */
export declare enum ClassicalKeyType {
    ECDSA_P256 = "ECDSA_P256",
    RSA_2048 = "RSA_2048"
}
export interface SubjectDN {
    commonName: string;
    organization?: string;
    organizationalUnit?: string;
    country?: string;
    state?: string;
    locality?: string;
}
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
export interface HybridKeyPair {
    publicKey: Buffer;
    privateKey: Buffer;
}
/**
 * Support for hybrid certificates combining classical and post-quantum signatures.
 */
export declare class PQCertificateManager {
    /**
     * Generate a hybrid X.509 certificate with both classical and PQ key signatures.
     *
     * @param options Certificate parameters
     * @returns { cert: Buffer, key: Buffer }
     */
    generateHybridCertificate(options: CertificateOptions): {
        cert: Buffer;
        key: Buffer;
    };
    /**
     * Generate classical asymmetric key pair
     * @param type Key type (ECDSA_P256 or RSA_2048)
     * @returns Key pair with public and private keys
     */
    private generateClassicalKeys;
    /**
     * Create a certificate using node-forge
     * @param keyPair Key pair to use for the certificate
     * @param options Certificate options
     * @returns Certificate as a Buffer
     */
    private createCertificate;
    /**
     * Create subject attributes for a certificate
     * @param subject Subject DN
     * @returns Array of subject attributes
     */
    private createSubjectAttributes;
    /**
     * Add extensions to a certificate
     * @param cert Certificate to add extensions to
     * @param options Certificate options
     */
    private addExtensions;
    /**
     * Check if a string is an IP address
     * @param str String to check
     * @returns True if the string is an IP address
     */
    private isIP;
    /**
     * Convert DER format to PEM format
     * @param der DER data
     * @param type PEM type (e.g., 'CERTIFICATE', 'PRIVATE KEY', etc.)
     * @returns PEM string
     */
    private derToPem;
    /**
     * Verify a certificate chain
     * @param cert Certificate to verify
     * @param ca CA certificate(s)
     * @returns True if the certificate is valid
     */
    verifyCertificate(cert: Buffer, ca?: Buffer | Buffer[]): boolean;
    /**
     * Extract the public key from a certificate
     * @param cert Certificate
     * @returns Public key
     */
    extractPublicKey(cert: Buffer): Buffer;
}
