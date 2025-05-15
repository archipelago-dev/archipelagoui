"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassicalKeyType = exports.PQCipherSuite = exports.DTLSSession = exports.DTLSContext = exports.PQAlgorithm = exports.DTLSSocket = exports.ConnectionState = exports.VerifyMode = exports.DTLSVersion = void 0;
// src/lib/types.ts
const events_1 = require("events");
var DTLSVersion;
(function (DTLSVersion) {
    DTLSVersion["DTLS_1_0"] = "DTLS 1.0";
    DTLSVersion["DTLS_1_2"] = "DTLS 1.2";
    DTLSVersion["DTLS_1_3"] = "DTLS 1.3";
})(DTLSVersion = exports.DTLSVersion || (exports.DTLSVersion = {}));
var VerifyMode;
(function (VerifyMode) {
    VerifyMode[VerifyMode["NONE"] = 0] = "NONE";
    VerifyMode[VerifyMode["PEER"] = 1] = "PEER";
    VerifyMode[VerifyMode["FAIL_IF_NO_PEER_CERT"] = 2] = "FAIL_IF_NO_PEER_CERT";
    VerifyMode[VerifyMode["CLIENT_ONCE"] = 4] = "CLIENT_ONCE";
})(VerifyMode = exports.VerifyMode || (exports.VerifyMode = {}));
var ConnectionState;
(function (ConnectionState) {
    ConnectionState["HANDSHAKE"] = "handshake";
    ConnectionState["CONNECTED"] = "connected";
    ConnectionState["CLOSING"] = "closing";
    ConnectionState["CLOSED"] = "closed";
    ConnectionState["ERROR"] = "error";
})(ConnectionState = exports.ConnectionState || (exports.ConnectionState = {}));
class DTLSSocket extends events_1.EventEmitter {
    constructor(options) {
        super();
    }
    connect(options) {
        return Promise.resolve();
    }
    send(data) {
        return Promise.resolve();
    }
    close() {
        return Promise.resolve();
    }
    sendClientHello(clientHello) {
        return Promise.resolve({});
    }
    hasValidSessionTicket() {
        return false;
    }
    useBufferPool(param) {
    }
    enableCryptoPrecomputation(param) {
    }
    enablePacketBatching(param) {
    }
}
exports.DTLSSocket = DTLSSocket;
var PQAlgorithm;
(function (PQAlgorithm) {
    PQAlgorithm["KYBER512"] = "kyber512";
    PQAlgorithm["KYBER768"] = "kyber768";
    PQAlgorithm["KYBER1024"] = "kyber1024";
    PQAlgorithm["DILITHIUM2"] = "dilithium2";
    PQAlgorithm["DILITHIUM3"] = "dilithium3";
    PQAlgorithm["DILITHIUM5"] = "dilithium5";
})(PQAlgorithm = exports.PQAlgorithm || (exports.PQAlgorithm = {}));
/** Opaque handle coming back from native `createContext(...)` */
class DTLSContext {
    constructor(id) {
        this.id = id;
    }
}
exports.DTLSContext = DTLSContext;
/** Opaque handle coming back from native `createSession(...)` */
class DTLSSession {
    constructor(id) {
        this.id = id;
    }
}
exports.DTLSSession = DTLSSession;
var PQCipherSuite;
(function (PQCipherSuite) {
    PQCipherSuite["KYBER512_AES_128_GCM_SHA256"] = "TLS_KYBER512_WITH_AES_128_GCM_SHA256";
    PQCipherSuite["KYBER768_AES_256_GCM_SHA384"] = "TLS_KYBER768_WITH_AES_256_GCM_SHA384";
    PQCipherSuite["KYBER1024_AES_256_GCM_SHA512"] = "TLS_KYBER1024_WITH_AES_256_GCM_SHA512";
})(PQCipherSuite = exports.PQCipherSuite || (exports.PQCipherSuite = {}));
/**
 * Types and interfaces for hybrid PQ certificates and DTLS-PQ.
 */
/** Classical asymmetric key types */
var ClassicalKeyType;
(function (ClassicalKeyType) {
    ClassicalKeyType["ECDSA_P256"] = "ECDSA_P256";
    ClassicalKeyType["RSA_2048"] = "RSA_2048";
})(ClassicalKeyType = exports.ClassicalKeyType || (exports.ClassicalKeyType = {}));
//# sourceMappingURL=types.js.map