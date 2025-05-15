// src/shims/falcon-shim.js
export const keyPair = async () => ({ publicKey: new Uint8Array(), privateKey: new Uint8Array() });
export const sign = async () => new Uint8Array();
export const signDetached = async () => new Uint8Array();
export const verifyDetached = async () => true;
export class FalconSignature {
    async generateKeyPair() { return { publicKey: new Uint8Array(), privateKey: new Uint8Array() }; }
    async sign() { return new Uint8Array(); }
    async verify() { return true; }
}
export default { keyPair, sign, signDetached, verifyDetached };
