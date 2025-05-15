/**
 * Post-Quantum Cipher Suites for DTLS
 */
export enum PQCipherSuite {
    // Kyber-based key exchange with AES-GCM and SHA-2
    KYBER512_AES_128_GCM_SHA256 = 'TLS_KYBER512_WITH_AES_128_GCM_SHA256',
    KYBER768_AES_256_GCM_SHA384 = 'TLS_KYBER768_WITH_AES_256_GCM_SHA384',
    KYBER_AES_GCM_SHA384 = 'TLS_KYBER768_WITH_AES_256_GCM_SHA384', // Alias for KYBER768_AES_256_GCM_SHA384
    KYBER1024_AES_256_GCM_SHA512 = 'TLS_KYBER1024_WITH_AES_256_GCM_SHA512',
    
    // Hybrid key exchange (X25519 + Kyber)
    X25519_KYBER768_AES_256_GCM_SHA384 = 'TLS_X25519_KYBER768_WITH_AES_256_GCM_SHA384',
    
    // Hybrid key exchange (ECDHE + Kyber)
    ECDHE_KYBER768_AES_256_GCM_SHA384 = 'TLS_ECDHE_KYBER768_WITH_AES_256_GCM_SHA384'
}

/**
 * Check if a cipher suite is post-quantum
 * @param cipherSuite The cipher suite to check
 * @returns True if the cipher suite is post-quantum
 */
export function isPQCipherSuite(cipherSuite: string): boolean {
    return Object.values(PQCipherSuite).includes(cipherSuite as PQCipherSuite);
}

/**
 * Get the key exchange algorithm from a PQ cipher suite
 * @param cipherSuite The PQ cipher suite
 * @returns The key exchange algorithm name
 */
export function getPQKeyExchangeAlgorithm(cipherSuite: PQCipherSuite): string {
    if (cipherSuite.includes('KYBER512')) {
        return 'KYBER512';
    } else if (cipherSuite.includes('KYBER768')) {
        return 'KYBER768';
    } else if (cipherSuite.includes('KYBER1024')) {
        return 'KYBER1024';
    } else if (cipherSuite.includes('X25519_KYBER768')) {
        return 'X25519_KYBER768';
    } else if (cipherSuite.includes('ECDHE_KYBER768')) {
        return 'ECDHE_KYBER768';
    }
    throw new Error(`Unknown PQ cipher suite: ${cipherSuite}`);
}

/**
 * Get the symmetric cipher from a PQ cipher suite
 * @param cipherSuite The PQ cipher suite
 * @returns The symmetric cipher name
 */
export function getSymmetricCipher(cipherSuite: PQCipherSuite): string {
    if (cipherSuite.includes('AES_128_GCM')) {
        return 'AES-128-GCM';
    } else if (cipherSuite.includes('AES_256_GCM')) {
        return 'AES-256-GCM';
    }
    throw new Error(`Unknown symmetric cipher in suite: ${cipherSuite}`);
}

/**
 * Get the hash algorithm from a PQ cipher suite
 * @param cipherSuite The PQ cipher suite
 * @returns The hash algorithm name
 */
export function getHashAlgorithm(cipherSuite: PQCipherSuite): string {
    if (cipherSuite.includes('SHA256')) {
        return 'SHA-256';
    } else if (cipherSuite.includes('SHA384')) {
        return 'SHA-384';
    } else if (cipherSuite.includes('SHA512')) {
        return 'SHA-512';
    }
    throw new Error(`Unknown hash algorithm in suite: ${cipherSuite}`);
}
