import { PQAlgorithm, PQKeyPair } from './lib/types.js';
import { MlKemAdapter } from './mlkem-adapter.js';

/**
 * PQKeyExchange class that handles key pair generation, encapsulation, and decapsulation
 * using post-quantum algorithms with MLKEM implementation
 */
export class PQKeyExchange {
    private algorithm: PQAlgorithm;
    private nativeBindings: any;

    /**
     * Create a new PQKeyExchange instance
     * @param algorithm The post-quantum algorithm to use
     */
    constructor(algorithm: PQAlgorithm) {
        this.algorithm = algorithm;
        
        // Try to load native bindings, but don't fail if they're not available
        try {
            this.nativeBindings = null; // ESM doesn't support dynamic requires
        } catch (error) {
            console.warn('Failed to load native module – falling back to MLKEM implementation:', error);
            this.nativeBindings = null;
        }
    }

    /**
     * Generate a key pair using the specified algorithm
     * @returns A key pair containing public and private keys
     */
    public async generateKeyPair(): Promise<PQKeyPair> {
        try {
            // Use MLKEM implementation
            return await MlKemAdapter.generateKyberKeyPair(this.algorithm);
        } catch (error) {
            console.error('MLKEM key generation failed:', error);
            throw new Error('Failed to generate key pair: MLKEM implementation failed');
        }
    }

    /**
     * Encapsulate a shared secret using the peer's public key
     * @param publicKey The peer's public key
     * @returns Ciphertext and shared secret
     */
    public async encapsulate(publicKey: Buffer): Promise<{ ciphertext: Buffer; sharedSecret: Buffer }> {
        try {
            // Use MLKEM implementation
            return await MlKemAdapter.kyberEncapsulate(publicKey, this.algorithm);
        } catch (error) {
            console.error('MLKEM encapsulation failed:', error);
            throw new Error('Failed to encapsulate shared secret: MLKEM implementation failed');
        }
    }

    /**
     * Decapsulate a shared secret using our private key and the peer's ciphertext
     * @param privateKey Our private key
     * @param ciphertext The peer's ciphertext
     * @returns Shared secret
     */
    public async decapsulate(ciphertext: Buffer, privateKey: Buffer): Promise<Buffer> {
        try {
            // Use MLKEM implementation
            return await MlKemAdapter.kyberDecapsulate(privateKey, ciphertext, this.algorithm);
        } catch (error) {
            console.error('MLKEM decapsulation failed:', error);
            throw new Error('Failed to decapsulate shared secret: MLKEM implementation failed');
        }
    }
}
