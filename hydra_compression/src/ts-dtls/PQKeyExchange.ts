// src/ts-dtls/PQKeyExchange.ts
import * as crypto from 'crypto';
import { MlKem512, MlKem768, MlKem1024 } from 'mlkem';

export enum PQAlgorithm {
    KYBER512 = 'kyber512',
    KYBER768 = 'kyber768',
    KYBER1024 = 'kyber1024'
}

export interface PQKeyPair {
    publicKey: Buffer;
    privateKey: Buffer;
}

/**
 * Post-Quantum Key Exchange implementation using MLKEM (Kyber)
 */
export class PQKeyExchange {
    private mlkem: MlKem512 | MlKem768 | MlKem1024;

    /** 
     * Initialize the PQ Key Exchange with the specified algorithm
     * @param algorithm Which Kyber flavor to use (default: KYBER768)
     */
    constructor(private readonly algorithm: PQAlgorithm = PQAlgorithm.KYBER768) {
        // Create the appropriate MLKEM instance based on the algorithm
        switch (algorithm) {
            case PQAlgorithm.KYBER512:
                this.mlkem = new MlKem512();
                break;
            case PQAlgorithm.KYBER768:
                this.mlkem = new MlKem768();
                break;
            case PQAlgorithm.KYBER1024:
                this.mlkem = new MlKem1024();
                break;
            default:
                this.mlkem = new MlKem768(); // Default to MLKEM-768
        }
    }

    /** 
     * Generate a Kyber public/private key pair
     * @returns Key pair with public and private keys
     */
    public async generateKeyPair(): Promise<PQKeyPair> {
        try {
            // Generate key pair using the mlkem library
            // The API returns [publicKey, privateKey] as Uint8Array[]
            const keyPair = await (this.mlkem as any).generateKeyPair();
            
            return {
                publicKey: Buffer.from(keyPair[0]),
                privateKey: Buffer.from(keyPair[1])
            };
        } catch (error) {
            console.error('Error generating MLKEM key pair:', error);
            throw new Error(`Failed to generate MLKEM key pair: ${error}`);
        }
    }

    /** 
     * Create a ciphertext + shared-secret for the peer's public key 
     * This performs the KEM encapsulation operation
     * @param publicKey The peer's public key
     * @returns Object containing the ciphertext and shared secret
     */
    public async encapsulate(publicKey: Buffer): Promise<{ ciphertext: Buffer; sharedSecret: Buffer }> {
        try {
            // Perform encapsulation using the mlkem library
            // The API uses encap method which returns [ciphertext, sharedSecret]
            const result = await (this.mlkem as any).encap(publicKey);
            
            return {
                ciphertext: Buffer.from(result[0]),
                sharedSecret: Buffer.from(result[1])
            };
        } catch (error) {
            console.error('Error during MLKEM encapsulation:', error);
            throw new Error(`Failed to perform MLKEM encapsulation: ${error}`);
        }
    }

    /**
     * Decrypt a ciphertext to recover the shared secret
     * This performs the KEM decapsulation operation
     * @param ciphertext The ciphertext to decrypt
     * @param privateKey The private key to use for decryption
     * @returns The shared secret
     */
    public async decapsulate(ciphertext: Buffer, privateKey: Buffer): Promise<Buffer> {
        try {
            // Perform decapsulation using the mlkem library
            // The API uses decap method which returns the shared secret
            const sharedSecret = await (this.mlkem as any).decap(ciphertext, privateKey);
            
            return Buffer.from(sharedSecret);
        } catch (error) {
            console.error('Error during MLKEM decapsulation:', error);
            throw new Error(`Failed to perform MLKEM decapsulation: ${error}`);
        }
    }

    /**
     * Get the key size based on the algorithm
     * @returns The key size in bytes
     */
    private getKeySize(): number {
        switch (this.algorithm) {
            case PQAlgorithm.KYBER512:
                return 800; // Approximate size for Kyber-512
            case PQAlgorithm.KYBER768:
                return 1184; // Approximate size for Kyber-768
            case PQAlgorithm.KYBER1024:
                return 1568; // Approximate size for Kyber-1024
            default:
                return 1184; // Default to Kyber-768
        }
    }
}
