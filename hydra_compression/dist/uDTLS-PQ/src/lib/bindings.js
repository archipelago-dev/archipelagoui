"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nativeBindings = void 0;
// bindings.ts (very top – _before_ the `try { … }`)
const node_module_1 = require("node:module");
const require = (0, node_module_1.createRequire)(import.meta.url); // <- gives us CJS‑style require()
// src/lib/bindings.ts
const buffer_1 = require("buffer");
const path_1 = require("path");
const url_1 = require("url");
/* -------------------------------------------------------------------------- */
/*  2.  Load the *.node* file – with a safe “require” even under ESM          */
/* -------------------------------------------------------------------------- */
// we’ll decide at run‑time whether the native module is available
let nativeBindings;
exports.nativeBindings = nativeBindings;
/** Tries to resolve `../build/Release/uDTLS-PQ.node` relative to this file */
function loadNative() {
    try {
        const require = (0, node_module_1.createRequire)(import.meta.url);
        // Path to the compiled addon regardless of CJS/ESM build layout
        const binPath = (0, path_1.join)((0, path_1.dirname)((0, url_1.fileURLToPath)(import.meta.url)), "..", "..", "build", "Release", "uDTLS-PQ.node");
        return require(binPath);
    }
    catch (err) {
        // Either the binary is missing *or* we’re in the browser / test env
        console.error("Failed to load native module – falling back to shim:", err);
        return null;
    }
}
/* -------------------------------------------------------------------------- */
/*  3.  Provide a stub implementation for dev / browser builds               */
/* -------------------------------------------------------------------------- */
function buildMock() {
    const noop = () => { };
    const zero = () => buffer_1.Buffer.alloc(0);
    const keyPair = () => ({ publicKey: buffer_1.Buffer.alloc(0), privateKey: buffer_1.Buffer.alloc(0) });
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
        aesGcmSeal: () => ({ ciphertext: buffer_1.Buffer.alloc(0), tag: buffer_1.Buffer.alloc(0) }),
        aesGcmOpen: zero,
        /* PQ crypto ----------------------------------------------------- */
        generateKyberKeyPair: keyPair,
        kyberEncapsulate: () => ({ ciphertext: buffer_1.Buffer.alloc(0), sharedSecret: buffer_1.Buffer.alloc(32) }),
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
            publicKey: buffer_1.Buffer.alloc(0),
            privateKey: buffer_1.Buffer.alloc(0),
        }),
        resolveDID: zero,
        registerDID: zero,
        deactivateDID: zero,
        /* Helpers -------------------------------------------------------- */
        generateECDSAKeyPair: keyPair,
        generateRSAKeyPair: keyPair,
        createHybridCSR: () => buffer_1.Buffer.alloc(0),
    };
}
/* -------------------------------------------------------------------------- */
/*  4.  Decide which implementation we expose                                 */
/* -------------------------------------------------------------------------- */
exports.nativeBindings = nativeBindings = loadNative() ?? buildMock();
exports.default = nativeBindings;
//# sourceMappingURL=bindings.js.map