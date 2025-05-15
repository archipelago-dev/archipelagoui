"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHashAlgorithm = exports.getSymmetricCipher = exports.getPQKeyExchangeAlgorithm = exports.isPQCipherSuite = exports.PQCipherSuite = void 0;
/**
 * Post-Quantum Cipher Suites for DTLS
 */
var PQCipherSuite;
(function (PQCipherSuite) {
    // Kyber-based key exchange with AES-GCM and SHA-2
    PQCipherSuite["KYBER512_AES_128_GCM_SHA256"] = "TLS_KYBER512_WITH_AES_128_GCM_SHA256";
    PQCipherSuite["KYBER768_AES_256_GCM_SHA384"] = "TLS_KYBER768_WITH_AES_256_GCM_SHA384";
    PQCipherSuite["KYBER_AES_GCM_SHA384"] = "TLS_KYBER768_WITH_AES_256_GCM_SHA384";
    PQCipherSuite["KYBER1024_AES_256_GCM_SHA512"] = "TLS_KYBER1024_WITH_AES_256_GCM_SHA512";
    // Hybrid key exchange (X25519 + Kyber)
    PQCipherSuite["X25519_KYBER768_AES_256_GCM_SHA384"] = "TLS_X25519_KYBER768_WITH_AES_256_GCM_SHA384";
    // Hybrid key exchange (ECDHE + Kyber)
    PQCipherSuite["ECDHE_KYBER768_AES_256_GCM_SHA384"] = "TLS_ECDHE_KYBER768_WITH_AES_256_GCM_SHA384";
})(PQCipherSuite = exports.PQCipherSuite || (exports.PQCipherSuite = {}));
/**
 * Check if a cipher suite is post-quantum
 * @param cipherSuite The cipher suite to check
 * @returns True if the cipher suite is post-quantum
 */
function isPQCipherSuite(cipherSuite) {
    return Object.values(PQCipherSuite).includes(cipherSuite);
}
exports.isPQCipherSuite = isPQCipherSuite;
/**
 * Get the key exchange algorithm from a PQ cipher suite
 * @param cipherSuite The PQ cipher suite
 * @returns The key exchange algorithm name
 */
function getPQKeyExchangeAlgorithm(cipherSuite) {
    if (cipherSuite.includes('KYBER512')) {
        return 'KYBER512';
    }
    else if (cipherSuite.includes('KYBER768')) {
        return 'KYBER768';
    }
    else if (cipherSuite.includes('KYBER1024')) {
        return 'KYBER1024';
    }
    else if (cipherSuite.includes('X25519_KYBER768')) {
        return 'X25519_KYBER768';
    }
    else if (cipherSuite.includes('ECDHE_KYBER768')) {
        return 'ECDHE_KYBER768';
    }
    throw new Error(`Unknown PQ cipher suite: ${cipherSuite}`);
}
exports.getPQKeyExchangeAlgorithm = getPQKeyExchangeAlgorithm;
/**
 * Get the symmetric cipher from a PQ cipher suite
 * @param cipherSuite The PQ cipher suite
 * @returns The symmetric cipher name
 */
function getSymmetricCipher(cipherSuite) {
    if (cipherSuite.includes('AES_128_GCM')) {
        return 'AES-128-GCM';
    }
    else if (cipherSuite.includes('AES_256_GCM')) {
        return 'AES-256-GCM';
    }
    throw new Error(`Unknown symmetric cipher in suite: ${cipherSuite}`);
}
exports.getSymmetricCipher = getSymmetricCipher;
/**
 * Get the hash algorithm from a PQ cipher suite
 * @param cipherSuite The PQ cipher suite
 * @returns The hash algorithm name
 */
function getHashAlgorithm(cipherSuite) {
    if (cipherSuite.includes('SHA256')) {
        return 'SHA-256';
    }
    else if (cipherSuite.includes('SHA384')) {
        return 'SHA-384';
    }
    else if (cipherSuite.includes('SHA512')) {
        return 'SHA-512';
    }
    throw new Error(`Unknown hash algorithm in suite: ${cipherSuite}`);
}
exports.getHashAlgorithm = getHashAlgorithm;
//# sourceMappingURL=PQCipherSuite.js.map