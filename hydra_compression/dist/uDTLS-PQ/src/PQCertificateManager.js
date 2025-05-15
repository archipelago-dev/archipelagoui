"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PQCertificateManager = void 0;
const bindings_1 = require("./lib/bindings");
const types_1 = require("./lib/types");
/**
 * Support for hybrid certificates combining classical and post-quantum signatures.
 */
class PQCertificateManager {
    /**
     * Generate a hybrid X.509 certificate with both classical and PQ key signatures.
     * @param options Certificate parameters
     * @returns { cert: Buffer, key: Buffer }
     */
    generateHybridCertificate(options) {
        // 1. Generate classical key pair (e.g., ECDSA P-256)
        const classical = this.generateClassicalKeys(options.keyType);
        // 2. Generate PQ key pair (e.g., Dilithium2)
        const pq = this.generatePQKeys(options.pqAlgorithm);
        // 3. Create CSR embedding both public keys
        const csr = bindings_1.nativeBindings.createHybridCSR({
            classicalPublicKey: classical.publicKey,
            pqPublicKey: pq.publicKey,
            subject: options.subject
        });
        // 4. Self-sign or sign with issuer to produce certificate
        // noinspection TypeScriptValidateTypes
        const cert = bindings_1.nativeBindings.signHybridCertificate(csr, classical.privateKey, pq.privateKey, 
        // @ts-ignore
        options.issuerCert);
        return { cert, key: classical.privateKey };
    }
    /** Generate classical asymmetric key pair */
    generateClassicalKeys(type) {
        switch (type) {
            case types_1.ClassicalKeyType.ECDSA_P256:
                return bindings_1.nativeBindings.generateECDSAKeyPair();
            case types_1.ClassicalKeyType.RSA_2048:
                return bindings_1.nativeBindings.generateRSAKeyPair(2048);
            default:
                throw new Error(`Unsupported classical key type: ${type}`);
        }
    }
    /** Generate post-quantum key pair */
    generatePQKeys(alg) {
        switch (alg) {
            case types_1.PQAlgorithm.DILITHIUM2:
                return bindings_1.nativeBindings.generateDilithiumKeyPair();
            case types_1.PQAlgorithm.DILITHIUM3:
                return bindings_1.nativeBindings.generateDilithiumKeyPair();
            default:
                throw new Error(`Unsupported PQ algorithm: ${alg}`);
        }
    }
}
exports.PQCertificateManager = PQCertificateManager;
//# sourceMappingURL=PQCertificateManager.js.map