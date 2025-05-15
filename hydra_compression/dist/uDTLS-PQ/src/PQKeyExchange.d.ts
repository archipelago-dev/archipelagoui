/// <reference types="node" />
/// <reference types="node" />
import { PQAlgorithm, PQKeyPair } from './lib/types';
export declare class PQKeyExchange {
    private readonly algorithm;
    /** Which Kyber flavour to use (default: KYBER768) */
    constructor(algorithm?: PQAlgorithm);
    /** Generate a Kyber public / secret key pair */
    generateKeyPair(): PQKeyPair;
    /** Create a ciphertext + shared‑secret for the peer’s public key */
    encapsulate(publicKey: Buffer): {
        ciphertext: Buffer;
        sharedSecret: Buffer;
    };
    /** Recover the shared secret from our private key and the peer’s ciphertext */
    decapsulate(privateKey: Buffer, ciphertext: Buffer): Buffer;
}
