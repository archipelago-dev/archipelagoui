// core/crypto/aes.ts

import { EncryptionScheme } from '../interfaces/crypto';

export async function generateAesKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    );
}

export async function importAesKey(keyData: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
    );
}

export async function subtleEncrypt(data: Uint8Array, key: Uint8Array | CryptoKey, iv?: Uint8Array): Promise<Uint8Array> {
    const aesKey = key instanceof CryptoKey ? key : await importAesKey(key);
    const nonce = iv ?? crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, data);

    const result = new Uint8Array(nonce.length + encrypted.byteLength);
    result.set(nonce, 0);
    result.set(new Uint8Array(encrypted), nonce.length);
    return result;
}

export async function subtleDecrypt(encrypted: Uint8Array, key: Uint8Array | CryptoKey): Promise<Uint8Array> {
    const aesKey = key instanceof CryptoKey ? key : await importAesKey(key);
    const iv = encrypted.slice(0, 12);
    const ciphertext = encrypted.slice(12);

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertext);
    return new Uint8Array(decrypted);
}

export class AESGCM implements EncryptionScheme {
    constructor(private readonly key: CryptoKey) {}

    async encrypt(plaintext: Uint8Array): Promise<Uint8Array> {
        return subtleEncrypt(plaintext, this.key);
    }

    // @ts-ignore
    async decrypt(ciphertext: Uint8Array, iv: Uint8Array<ArrayBufferLike>): Promise<Uint8Array> {
        return subtleDecrypt(ciphertext, this.key);
    }
}
