/// <reference types="node" />
/// <reference types="node" />
import { Buffer } from "buffer";
import type { HybridKeyPair, SubjectDN } from "./types";
export interface NativeBindings {
    createContext(opts: {
        isServer: boolean;
        cert?: string;
        key?: string;
    }): {
        id: number;
    };
    freeContext(h: {
        id: number;
    }): void;
    createSession(ctx: {
        id: number;
    }): {
        id: number;
    };
    freeSession(sess: {
        id: number;
    }): void;
    dtlsConnect(sess: {
        id: number;
    }, host: string, port: number): number;
    dtlsAccept(sess: {
        id: number;
    }, host: string, port: number): number;
    dtlsReceive(sess: {
        id: number;
    }, len: number): Buffer;
    dtlsSend(sess: {
        id: number;
    }, data: Buffer, host: string, port: number): number;
    dtlsShutdown(sess: {
        id: number;
    }): void;
    setCipherSuites(ctx: {
        id: number;
    }, suites: string[]): boolean;
    setPQCipherSuites(ctx: {
        id: number;
    }, algo: string): boolean;
    setVerifyMode(ctx: {
        id: number;
    }, mode: number): void;
    setMinMaxVersion(ctx: {
        id: number;
    }, min: number, max: number): void;
    getError(sess: {
        id: number;
    }): string;
    getVersion(): string;
    setupAutomaticRekey(id: number, intervalMs: number): void;
    aesGcmSeal(key: Buffer, iv: Buffer, pt: Buffer, aad: Buffer): {
        ciphertext: Buffer;
        tag: Buffer;
    };
    aesGcmOpen(key: Buffer, iv: Buffer, ct: Buffer, tag: Buffer, aad: Buffer): Buffer;
    generateKyberKeyPair(algo?: string): HybridKeyPair;
    kyberEncapsulate(pub: Buffer, algo?: string): {
        ciphertext: Buffer;
        sharedSecret: Buffer;
    };
    kyberDecapsulate(prv: Buffer, ct: Buffer, algo?: string): Buffer;
    generateDilithiumKeyPair(algo?: string): HybridKeyPair;
    dilithiumSign(prv: Buffer, msg: Buffer, algo?: string): Buffer;
    dilithiumVerify(pub: Buffer, msg: Buffer, sig: Buffer, algo?: string): boolean;
    generateHybridCSR(classicalKey: Buffer, pqKey: Buffer, subject: string, issuer: string, validityDays: number): Buffer;
    signHybridCertificate(csr: Buffer, caKey: Buffer, caCert: Buffer, extensions: Buffer[]): Buffer;
    generateCRL(caKey: Buffer, caCert: Buffer, revokedSerials: string[]): Buffer;
    verifyOCSP(ocspReq: Buffer, responderCert: Buffer): Buffer;
    getCertificatePolicyOID(name: string): string;
    generateDidKeyPair(method: string): {
        did: string;
        publicKey: Buffer;
        privateKey: Buffer;
    };
    resolveDID(did: string): Buffer;
    registerDID(doc: Buffer): Buffer;
    deactivateDID(did: string): Buffer;
    generateECDSAKeyPair(): HybridKeyPair;
    generateRSAKeyPair(bits: number): HybridKeyPair;
    createHybridCSR(param: {
        classicalPublicKey: Buffer;
        pqPublicKey: Buffer;
        subject: SubjectDN;
    }): Buffer;
}
declare let nativeBindings: NativeBindings;
export { nativeBindings };
export default nativeBindings;
