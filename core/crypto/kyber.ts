// core/crypto/kyber.ts

import { KeyExchange } from '../interfaces/crypto';
import { MlKem768 } from 'mlkem';

/**
 * Thin wrapper around mlkem that caches its keypair and exposes
 * encapsulation / decapsulation helpers.
 */
export class KyberKeyExchange implements KeyExchange {
    public publicKey?: Uint8Array;
    public privateKey?: Uint8Array;

    async generateKeyPair() {
        const inst = new MlKem768();
        const [pk, sk] = await inst.generateKeyPair();
        this.publicKey = pk;
        this.privateKey = sk;
        return { publicKey: pk, privateKey: sk };
    }

    async encapsulate(publicKey: Uint8Array) {
        const inst = new MlKem768();
        const [ciphertext, sharedSecret] = await inst.encap(publicKey);
        return { ciphertext, sharedSecret };
    }

    async decapsulate(ciphertext: Uint8Array, privateKey: Uint8Array) {
        const inst = new MlKem768();
        return inst.decap(privateKey, ciphertext);
    }
}

export const createKyberExchange = async () => {
    const kex = new KyberKeyExchange();
    await kex.generateKeyPair();
    return kex;
};
