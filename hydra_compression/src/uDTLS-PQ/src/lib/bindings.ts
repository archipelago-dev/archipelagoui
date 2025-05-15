// bindings.ts (very top – _before_ the `try { … }`)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);   // <- gives us CJS‑style require()

// src/lib/bindings.ts
import { Buffer } from "buffer";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import type { HybridKeyPair, SubjectDN } from "./types";

/* -------------------------------------------------------------------------- */
/*  1.  TypeScript interface for the compiled addon                           */
/* -------------------------------------------------------------------------- */
export interface NativeBindings {
    /* DTLS ------------------------------------------------------------- */
    createContext(
        opts: { isServer: boolean; cert?: string; key?: string }
    ): { id: number };
    freeContext(h: { id: number }): void;

    createSession(ctx: { id: number }): { id: number };
    freeSession(sess: { id: number }): void;

    dtlsConnect(sess: { id: number }, host: string, port: number): number;
    dtlsAccept(sess: { id: number }, host: string, port: number): number;
    dtlsReceive(sess: { id: number }, len: number): Buffer;
    dtlsSend(
        sess: { id: number },
        data: Buffer,
        host: string,
        port: number
    ): number;
    dtlsShutdown(sess: { id: number }): void;

    setCipherSuites(ctx: { id: number }, suites: string[]): boolean;
    setPQCipherSuites(ctx: { id: number }, algo: string): boolean;
    setVerifyMode(ctx: { id: number }, mode: number): void;
    setMinMaxVersion(ctx: { id: number }, min: number, max: number): void;
    getError(sess: { id: number }): string;
    getVersion(): string;
    setupAutomaticRekey(id: number, intervalMs: number): void;

    /* Symmetric crypto -------------------------------------------------- */
    aesGcmSeal(
        key: Buffer,
        iv: Buffer,
        pt: Buffer,
        aad: Buffer
    ): { ciphertext: Buffer; tag: Buffer };
    aesGcmOpen(
        key: Buffer,
        iv: Buffer,
        ct: Buffer,
        tag: Buffer,
        aad: Buffer
    ): Buffer;

    /* PQ crypto --------------------------------------------------------- */
    generateKyberKeyPair(algo?: string): HybridKeyPair;
    kyberEncapsulate(
        pub: Buffer,
        algo?: string
    ): { ciphertext: Buffer; sharedSecret: Buffer };
    kyberDecapsulate(prv: Buffer, ct: Buffer, algo?: string): Buffer;

    generateDilithiumKeyPair(algo?: string): HybridKeyPair;
    dilithiumSign(prv: Buffer, msg: Buffer, algo?: string): Buffer;
    dilithiumVerify(
        pub: Buffer,
        msg: Buffer,
        sig: Buffer,
        algo?: string
    ): boolean;

    /* X.509 & misc. ----------------------------------------------------- */
    generateHybridCSR(
        classicalKey: Buffer,
        pqKey: Buffer,
        subject: string,
        issuer: string,
        validityDays: number
    ): Buffer;
    signHybridCertificate(
        csr: Buffer,
        caKey: Buffer,
        caCert: Buffer,
        extensions: Buffer[]
    ): Buffer;
    generateCRL(
        caKey: Buffer,
        caCert: Buffer,
        revokedSerials: string[]
    ): Buffer;
    verifyOCSP(ocspReq: Buffer, responderCert: Buffer): Buffer;
    getCertificatePolicyOID(name: string): string;

    /* DIDs -------------------------------------------------------------- */
    generateDidKeyPair(
        method: string
    ): { did: string; publicKey: Buffer; privateKey: Buffer };
    resolveDID(did: string): Buffer;
    registerDID(doc: Buffer): Buffer;
    deactivateDID(did: string): Buffer;

    /* Helpers ----------------------------------------------------------- */
    generateECDSAKeyPair(): HybridKeyPair;
    generateRSAKeyPair(bits: number): HybridKeyPair;
    createHybridCSR(param: {
        classicalPublicKey: Buffer;
        pqPublicKey: Buffer;
        subject: SubjectDN;
    }): Buffer;
}

/* -------------------------------------------------------------------------- */
/*  2.  Load the *.node* file – with a safe “require” even under ESM          */
/* -------------------------------------------------------------------------- */

// we’ll decide at run‑time whether the native module is available
let nativeBindings: NativeBindings;

/** Tries to resolve `../build/Release/uDTLS-PQ.node` relative to this file */
function loadNative(): NativeBindings | null {
    try {
        const require = createRequire(import.meta.url);

        // Path to the compiled addon regardless of CJS/ESM build layout
        const binPath = join(
            dirname(fileURLToPath(import.meta.url)),
            "..",
            "..",
            "build",
            "Release",
            "uDTLS-PQ.node"
        );

        return require(binPath) as NativeBindings;
    } catch (err) {
        // Either the binary is missing *or* we’re in the browser / test env
        console.error("Failed to load native module – falling back to shim:", err);
        return null;
    }
}

/* -------------------------------------------------------------------------- */
/*  3.  Provide a stub implementation for dev / browser builds               */
/* -------------------------------------------------------------------------- */
function buildMock(): NativeBindings {
    const noop = () => {};
    const zero = () => Buffer.alloc(0);
    const keyPair = () => ({ publicKey: Buffer.alloc(0), privateKey: Buffer.alloc(0) });

    return {
        /* DTLS ----------------------------------------------------------- */
        createContext: () => ({ id: 1 }),
        freeContext: noop,
        createSession: () => ({ id: 1 }),
        freeSession: noop,
        dtlsConnect: () => 0,
        dtlsAccept: () => 0,
        dtlsReceive: zero,
        dtlsSend: () => 0,
        dtlsShutdown: noop,
        setCipherSuites: () => true,
        setPQCipherSuites: () => true,
        setVerifyMode: noop,
        setMinMaxVersion: noop,
        getError: () => "No native module",
        getVersion: () => "mock‑1.0.0",
        setupAutomaticRekey: noop,

        /* Symmetric crypto ---------------------------------------------- */
        aesGcmSeal: () => ({ ciphertext: Buffer.alloc(0), tag: Buffer.alloc(0) }),
        aesGcmOpen: zero,

        /* PQ crypto ----------------------------------------------------- */
        generateKyberKeyPair: keyPair,
        kyberEncapsulate: () => ({ ciphertext: Buffer.alloc(0), sharedSecret: Buffer.alloc(32) }),
        kyberDecapsulate: zero,
        generateDilithiumKeyPair: keyPair,
        dilithiumSign: zero,
        dilithiumVerify: () => true,

        /* X.509 & misc. -------------------------------------------------- */
        generateHybridCSR: zero,
        signHybridCertificate: zero,
        generateCRL: zero,
        verifyOCSP: zero,
        getCertificatePolicyOID: () => "1.2.3.4",

        /* DIDs ----------------------------------------------------------- */
        generateDidKeyPair: () => ({
            did: "did:example:mock",
            publicKey: Buffer.alloc(0),
            privateKey: Buffer.alloc(0),
        }),
        resolveDID: zero,
        registerDID: zero,
        deactivateDID: zero,

        /* Helpers -------------------------------------------------------- */
        generateECDSAKeyPair: keyPair,
        generateRSAKeyPair: keyPair,
        createHybridCSR: () => Buffer.alloc(0),
    };
}

/* -------------------------------------------------------------------------- */
/*  4.  Decide which implementation we expose                                 */
/* -------------------------------------------------------------------------- */
nativeBindings = loadNative() ?? buildMock();

export { nativeBindings };
export default nativeBindings;
