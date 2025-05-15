/// <reference types="node" />
/// <reference types="node" />
import { CertificateOptions } from './lib/types';
/**
 * Support for hybrid certificates combining classical and post-quantum signatures.
 */
export declare class PQCertificateManager {
    /**
     * Generate a hybrid X.509 certificate with both classical and PQ key signatures.
     * @param options Certificate parameters
     * @returns { cert: Buffer, key: Buffer }
     */
    generateHybridCertificate(options: CertificateOptions): {
        cert: Buffer;
        key: Buffer;
    };
    /** Generate classical asymmetric key pair */
    private generateClassicalKeys;
    /** Generate post-quantum key pair */
    private generatePQKeys;
}
