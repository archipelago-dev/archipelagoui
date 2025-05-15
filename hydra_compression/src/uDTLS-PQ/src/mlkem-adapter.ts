// mlkem-adapter.ts
// This adapter integrates the MLKEM implementation with the uDTLS-PQ API

import { PQAlgorithm, PQKeyPair } from './lib/types.js';
import { kyberKeyPair, kyberEncrypt, kyberDecrypt } from '../../../../core/crypto/kyber.js';

/**
 * Maps uDTLS-PQ PQAlgorithm to MLKEM implementation
 */
function getAlgorithmStrength(algorithm: PQAlgorithm): string {
    switch (algorithm) {
        case PQAlgorithm.KYBER512:
            return '512';
        case PQAlgorithm.KYBER768:
            return '768';
        case PQAlgorithm.KYBER1024:
            return '1024';
        default:
            // Default to KYBER768 for compatibility
            return '768';
    }
}

/**
 * Adapter class that provides the same API as the native Kyber implementation
 * but uses the TypeScript MLKEM implementation
 */
export class MlKemAdapter {
    /**
     * Generate a key pair using the MLKEM implementation
     * @param algorithm The PQ algorithm to use
     * @returns A key pair compatible with the uDTLS-PQ API
     */
    static async generateKyberKeyPair(algorithm: PQAlgorithm): Promise<PQKeyPair> {
        try {
            // Use the existing kyberKeyPair implementation
            const keyPair = await kyberKeyPair();
            
            return {
                publicKey: Buffer.from(keyPair.publicKey),
                privateKey: Buffer.from(keyPair.privateKey)
            };
        } catch (error) {
            console.error('Error in generateKyberKeyPair:', error);
            throw error;
        }
    }

    /**
     * Encapsulate a shared secret using the MLKEM implementation
     * @param publicKey The peer's public key
     * @param algorithm The PQ algorithm to use
     * @returns Ciphertext and shared secret compatible with the uDTLS-PQ API
     */
    static async kyberEncapsulate(publicKey: Buffer, algorithm: PQAlgorithm): Promise<{ ciphertext: Buffer; sharedSecret: Buffer }> {
        try {
            // Generate a random shared secret
            const sharedSecret = crypto.getRandomValues 
                ? Buffer.from(crypto.getRandomValues(new Uint8Array(32))) 
                : Buffer.from(require('crypto').randomBytes(32));
            
            // Use the existing kyberEncrypt implementation to encrypt the shared secret
            const [ciphertext] = await kyberEncrypt(
                new Uint8Array(publicKey), 
                new Uint8Array(sharedSecret)
            );
            
            return {
                ciphertext: Buffer.from(ciphertext),
                sharedSecret: sharedSecret
            };
        } catch (error) {
            console.error('Error in kyberEncapsulate:', error);
            throw error;
        }
    }

    /**
     * Decapsulate a shared secret using the MLKEM implementation
     * @param privateKey Our private key
     * @param ciphertext The peer's ciphertext
     * @param algorithm The PQ algorithm to use
     * @returns Shared secret compatible with the uDTLS-PQ API
     */
    static async kyberDecapsulate(privateKey: Buffer, ciphertext: Buffer, algorithm: PQAlgorithm): Promise<Buffer> {
        try {
            // Use the existing kyberDecrypt implementation
            const sharedSecret = await kyberDecrypt(
                new Uint8Array(privateKey),
                new Uint8Array(ciphertext)
            );
            
            return Buffer.from(sharedSecret);
        } catch (error) {
            console.error('Error in kyberDecapsulate:', error);
            throw error;
        }
    }
}
