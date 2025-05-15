import { nativeBindings } from './lib/bindings';
import {
    ClassicalKeyType,
    PQAlgorithm,
    CertificateOptions,
    HybridKeyPair
} from './lib/types';

/**
 * Support for hybrid certificates combining classical and post-quantum signatures.
 */
export class PQCertificateManager {
    /**
     * Generate a hybrid X.509 certificate with both classical and PQ key signatures.
     * @param options Certificate parameters
     * @returns { cert: Buffer, key: Buffer }
     */
    public generateHybridCertificate(options: CertificateOptions): { cert: Buffer; key: Buffer } {
        // 1. Generate classical key pair (e.g., ECDSA P-256)
        const classical = this.generateClassicalKeys(options.keyType);

        // 2. Generate PQ key pair (e.g., Dilithium2)
        const pq = this.generatePQKeys(options.pqAlgorithm);

        // 3. Create CSR embedding both public keys
        const csr = nativeBindings.createHybridCSR({
            classicalPublicKey: classical.publicKey,
            pqPublicKey: pq.publicKey,
            subject: options.subject
        });

        // 4. Self-sign or sign with issuer to produce certificate
        // noinspection TypeScriptValidateTypes

        const cert = nativeBindings.signHybridCertificate(
            csr,
            classical.privateKey,
            pq.privateKey,
            // @ts-ignore
            options.issuerCert
        );

        return { cert, key: classical.privateKey };
    }

    /** Generate classical asymmetric key pair */
    private generateClassicalKeys(type: ClassicalKeyType): HybridKeyPair {
        switch (type) {
            case ClassicalKeyType.ECDSA_P256:
                return nativeBindings.generateECDSAKeyPair();
            case ClassicalKeyType.RSA_2048:
                return nativeBindings.generateRSAKeyPair(2048);
            default:
                throw new Error(`Unsupported classical key type: ${type}`);
        }
    }

    /** Generate post-quantum key pair */
    private generatePQKeys(alg: PQAlgorithm): HybridKeyPair {
        switch (alg) {
            case PQAlgorithm.DILITHIUM2:
                return nativeBindings.generateDilithiumKeyPair();
            case PQAlgorithm.DILITHIUM3:
                return nativeBindings.generateDilithiumKeyPair();
            default:
                throw new Error(`Unsupported PQ algorithm: ${alg}`);
        }
    }
}
