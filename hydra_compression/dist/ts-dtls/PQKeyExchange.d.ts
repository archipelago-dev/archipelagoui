/// <reference types="node" />
/// <reference types="node" />
export declare enum PQAlgorithm {
    KYBER512 = "kyber512",
    KYBER768 = "kyber768",
    KYBER1024 = "kyber1024"
}
export interface PQKeyPair {
    publicKey: Buffer;
    privateKey: Buffer;
}
/**
 * Post-Quantum Key Exchange implementation using MLKEM (Kyber)
 */
export declare class PQKeyExchange {
    private readonly algorithm;
    private mlkem;
    /**
     * Initialize the PQ Key Exchange with the specified algorithm
     * @param algorithm Which Kyber flavor to use (default: KYBER768)
     */
    constructor(algorithm?: PQAlgorithm);
    /**
     * Generate a Kyber public/private key pair
     * @returns Key pair with public and private keys
     */
    generateKeyPair(): Promise<PQKeyPair>;
    /**
     * Create a ciphertext + shared-secret for the peer's public key
     * This performs the KEM encapsulation operation
     * @param publicKey The peer's public key
     * @returns Object containing the ciphertext and shared secret
     */
    encapsulate(publicKey: Buffer): Promise<{
        ciphertext: Buffer;
        sharedSecret: Buffer;
    }>;
    /**
     * Decrypt a ciphertext to recover the shared secret
     * This performs the KEM decapsulation operation
     * @param ciphertext The ciphertext to decrypt
     * @param privateKey The private key to use for decryption
     * @returns The shared secret
     */
    decapsulate(ciphertext: Buffer, privateKey: Buffer): Promise<Buffer>;
    /**
     * Get the key size based on the algorithm
     * @returns The key size in bytes
     */
    private getKeySize;
}
