// core/crypto/falcon.ts
// 🌐 Universal Falcon wrapper: Node.js + Browser stub

import { DigitalSignature } from '../interfaces/crypto';

// Dynamically load native SuperFalcon in Node, stub in browsers
let superFalcon: any;
if (typeof window === 'undefined') {
    // Node.js environment
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    superFalcon = require('superfalcon').superFalcon;
} else {
    // Browser stub: no-op implementation
    superFalcon = {
        keyPair:       async () => ({ publicKey: new Uint8Array(), privateKey: new Uint8Array() }),
        sign:          async (_msg: Uint8Array, _priv: Uint8Array) => new Uint8Array(),
        open:          async (_sig: Uint8Array, _pub: Uint8Array) => new Uint8Array(),
        signDetached:  async (_msg: Uint8Array, _priv: Uint8Array) => new Uint8Array(),
        verifyDetached:async (_sig: Uint8Array, _msg: Uint8Array, _pub: Uint8Array) => true,
        importKeys:    async (_keys: any, _pwd?: string) => ({ publicKey: new Uint8Array(), privateKey: new Uint8Array() }),
        exportKeys:    async (_kp: any, _pwd?: string) => ({ private: { combined: '' }, public: { combined: '' } }),
        signFile:      async (_data: Uint8Array, _priv: Uint8Array) => new Uint8Array(),
        verifyFile:    async (_sig: Uint8Array, _data: Uint8Array, _pub: Uint8Array) => true
    };
}

export const keyPair = async (): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> => {
    return await superFalcon.keyPair();
};

export const sign = async (
    message: Uint8Array,
    privateKey: Uint8Array,
    additionalData?: Uint8Array
): Promise<Uint8Array> => {
    return await superFalcon.sign(message, privateKey, additionalData);
};

export const open = async (
    signedMessage: Uint8Array,
    publicKey: Uint8Array,
    additionalData?: Uint8Array
): Promise<Uint8Array> => {
    return await superFalcon.open(signedMessage, publicKey, additionalData);
};

export const signDetached = async (
    message: Uint8Array,
    privateKey: Uint8Array,
    additionalData?: Uint8Array
): Promise<Uint8Array> => {
    return await superFalcon.signDetached(message, privateKey, additionalData);
};

export const verifyDetached = async (
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array,
    additionalData?: Uint8Array
): Promise<boolean> => {
    return await superFalcon.verifyDetached(signature, message, publicKey, additionalData);
};

export interface KeyData {
    private: { classical: string; postQuantum: string } | { combined: string };
    public:  { classical: string; postQuantum: string } | { combined: string };
}

export interface KeyPassword {
    classical?: string;
    postQuantum?: string;
}

export const importKeys = async (
    keyData: KeyData,
    password?: string | KeyPassword
): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> => {
    return superFalcon.importKeys(keyData, typeof password === 'string' ? password : password?.postQuantum || password?.classical || '');
};

export const exportKeys = async (
    keyPairObj: { publicKey: Uint8Array; privateKey: Uint8Array },
    password?: string | KeyPassword
): Promise<KeyData> => {
    return superFalcon.exportKeys(keyPairObj, typeof password === 'string' ? password : password?.postQuantum || password?.classical || '');
};

export const signFile = async (
    fileData: Uint8Array,
    privateKey: Uint8Array,
    additionalData?: Uint8Array
): Promise<Uint8Array> => {
    return await signDetached(fileData, privateKey, additionalData);
};

export const verifyFile = async (
    signature: Uint8Array,
    fileData: Uint8Array,
    publicKey: Uint8Array,
    additionalData?: Uint8Array
): Promise<boolean> => {
    return await verifyDetached(signature, fileData, publicKey, additionalData);
};

export default {
    keyPair,
    sign,
    open,
    signDetached,
    verifyDetached,
    importKeys,
    exportKeys,
    signFile,
    verifyFile
};

export class FalconSignature implements DigitalSignature {
    publicKey?: Uint8Array;
    privateKey?: Uint8Array;

    constructor() {}

    async generateKeyPair() {
        const { publicKey, privateKey } = await keyPair();
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        return { publicKey, privateKey };
    }

    async sign(message: Uint8Array, privateKey: Uint8Array = this.privateKey!) {
        return await signDetached(message, privateKey);
    }

    async verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array = this.publicKey!) {
        return await verifyDetached(signature, message, publicKey);
    }
}