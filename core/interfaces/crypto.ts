// core/interfaces/crypto.ts

export interface EncryptionScheme {
    encrypt(plaintext: Uint8Array): Promise<Uint8Array>;
    decrypt(ciphertext: Uint8Array): Promise<Uint8Array>;
}

export interface KeyExchange {
    generateKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }>;
    encapsulate(publicKey: Uint8Array): Promise<{ ciphertext: Uint8Array; sharedSecret: Uint8Array }>;
    decapsulate(ciphertext: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array>;
}

export interface DigitalSignature {
    generateKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }>;
    sign(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array>;
    verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): Promise<boolean>;
}
