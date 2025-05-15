/**
 * Post-Quantum Cipher Suites for DTLS
 */
export declare enum PQCipherSuite {
    KYBER512_AES_128_GCM_SHA256 = "TLS_KYBER512_WITH_AES_128_GCM_SHA256",
    KYBER768_AES_256_GCM_SHA384 = "TLS_KYBER768_WITH_AES_256_GCM_SHA384",
    KYBER_AES_GCM_SHA384 = "TLS_KYBER768_WITH_AES_256_GCM_SHA384",
    KYBER1024_AES_256_GCM_SHA512 = "TLS_KYBER1024_WITH_AES_256_GCM_SHA512",
    X25519_KYBER768_AES_256_GCM_SHA384 = "TLS_X25519_KYBER768_WITH_AES_256_GCM_SHA384",
    ECDHE_KYBER768_AES_256_GCM_SHA384 = "TLS_ECDHE_KYBER768_WITH_AES_256_GCM_SHA384"
}
/**
 * Check if a cipher suite is post-quantum
 * @param cipherSuite The cipher suite to check
 * @returns True if the cipher suite is post-quantum
 */
export declare function isPQCipherSuite(cipherSuite: string): boolean;
/**
 * Get the key exchange algorithm from a PQ cipher suite
 * @param cipherSuite The PQ cipher suite
 * @returns The key exchange algorithm name
 */
export declare function getPQKeyExchangeAlgorithm(cipherSuite: PQCipherSuite): string;
/**
 * Get the symmetric cipher from a PQ cipher suite
 * @param cipherSuite The PQ cipher suite
 * @returns The symmetric cipher name
 */
export declare function getSymmetricCipher(cipherSuite: PQCipherSuite): string;
/**
 * Get the hash algorithm from a PQ cipher suite
 * @param cipherSuite The PQ cipher suite
 * @returns The hash algorithm name
 */
export declare function getHashAlgorithm(cipherSuite: PQCipherSuite): string;
