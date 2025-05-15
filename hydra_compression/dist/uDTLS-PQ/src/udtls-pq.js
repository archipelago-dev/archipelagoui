"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DTLS = exports.ConnectionState = exports.SecurityLevel = void 0;
const node_events_1 = require("node:events");
const node_dgram_1 = __importDefault(require("node:dgram"));
//  * Generate a Falcon key pair for post-quantum secure signatures
// ── Types ─────────────────────────────────────────────────────────────────────
const types_1 = require("./lib/types");
/* -------------------------------------------------------------------------- */
/*  Public enums & interfaces                                                 */
/* -------------------------------------------------------------------------- */
var SecurityLevel;
(function (SecurityLevel) {
    SecurityLevel["STANDARD"] = "standard";
    SecurityLevel["POST_QUANTUM_MEDIUM"] = "pq-medium";
    SecurityLevel["POST_QUANTUM_HIGH"] = "pq-high";
    SecurityLevel["HYBRID"] = "hybrid";
})(SecurityLevel = exports.SecurityLevel || (exports.SecurityLevel = {}));
var ConnectionState;
(function (ConnectionState) {
    ConnectionState["CLOSED"] = "closed";
    ConnectionState["HANDSHAKE"] = "handshake";
    ConnectionState["CONNECTING"] = "connecting";
    ConnectionState["CONNECTED"] = "connected";
    ConnectionState["DISCONNECTED"] = "disconnected";
    ConnectionState["ERROR"] = "error";
})(ConnectionState = exports.ConnectionState || (exports.ConnectionState = {}));
class DTLS extends node_events_1.EventEmitter {
    constructor(options) {
        super();
        this.state = ConnectionState.CLOSED;
        /* default‑merge */
        this.opts = {
            isServer: false,
            securityLevel: SecurityLevel.STANDARD,
            minVersion: "1.2",
            maxVersion: "1.3",
            verifyPeer: true,
            debug: false,
            timeout: 30000,
            mtu: 1400,
            autoFallback: true,
            cipherSuites: [],
            ...options,
        };
        /* Validate & init context */
        this.initContext();
    }
    /* ------------------------------------------------------------------ */
    /*  Context / Session Helpers                                         */
    /* ------------------------------------------------------------------ */
    initContext() {
        if (!this.opts.cert || !this.opts.key)
            throw new Error("Certificate & key required for DTLS context");
        if (this.compareVer(this.opts.minVersion, this.opts.maxVersion) > 0)
            throw new Error("minVersion cannot exceed maxVersion");
        const ctxOpts = {
            cert: typeof this.opts.cert === "string"
                ? Buffer.from(this.opts.cert)
                : this.opts.cert,
            key: this.opts.key,
            ciphers: this.opts.cipherSuites,
            pqCiphers: this.pickPqSuites(),
            enableCertTransparency: true,
            minVersion: this.mapVersion(this.opts.minVersion),
            maxVersion: this.mapVersion(this.opts.maxVersion),
            verifyMode: this.opts.verifyPeer ? types_1.VerifyMode.PEER : types_1.VerifyMode.NONE,
            isServer: this.opts.isServer,
        };
        // @ts-ignore
        this.context = nativeBindings.createContext(ctxOpts);
        if (!this.context)
            throw new Error("DTLS context init failed");
    }
    pickPqSuites() {
        switch (this.opts.securityLevel) {
            case SecurityLevel.POST_QUANTUM_MEDIUM:
                return [types_1.PQCipherSuite.KYBER512_AES_128_GCM_SHA256];
            case SecurityLevel.POST_QUANTUM_HIGH:
                return [types_1.PQCipherSuite.KYBER768_AES_256_GCM_SHA384];
            case SecurityLevel.HYBRID:
                return [
                    types_1.PQCipherSuite.KYBER512_AES_128_GCM_SHA256,
                    types_1.PQCipherSuite.KYBER768_AES_256_GCM_SHA384,
                ];
            default:
                return undefined;
        }
    }
    mapVersion(v) {
        return {
            "1.0": types_1.DTLSVersion.DTLS_1_0,
            "1.2": types_1.DTLSVersion.DTLS_1_2,
            "1.3": types_1.DTLSVersion.DTLS_1_3,
        }[v];
    }
    compareVer(a, b) {
        return parseFloat(a) - parseFloat(b);
    }
    /* ------------------------------------------------------------------ */
    /*  Client Connect                                                    */
    /* ------------------------------------------------------------------ */
    connect(port, host, cb) {
        if (this.state !== ConnectionState.CLOSED)
            throw new Error("DTLS instance already used");
        if (this.opts.isServer)
            throw new Error("Server mode cannot connect()");
        this.socket = node_dgram_1.default.createSocket("udp4");
        this.session = new types_1.DTLSSession(this.context.id);
        // @ts-ignore
        nativeBindings.setupAutomaticRekey(this.session.id, 3600);
        // @ts-ignore
        const ok = nativeBindings.dtlsConnect(this.session, host, port);
        if (!ok) {
            //  @ts-ignore
            const err = nativeBindings.getError(this.session) ?? "DTLS connect error";
            return this.handleError(new Error(err));
        }
        this.state = ConnectionState.HANDSHAKE;
        this.setupSocketEvents();
        if (cb)
            this.once("connect", cb);
    }
    /* ------------------------------------------------------------------ */
    /*  UDP Socket Event Wiring                                           */
    /* ------------------------------------------------------------------ */
    setupSocketEvents() {
        const sock = this.socket;
        sock.on("message", (msg) => this.onUdpData(msg));
        sock.on("error", (e) => this.handleError(e));
        sock.on("close", () => {
            this.state = ConnectionState.DISCONNECTED;
            this.emit("close");
        });
    }
    onUdpData(msg) {
        if (!msg?.length) {
            this.emit("error", new Error("Empty UDP packet"));
            return;
        }
        try {
            //@ts-ignore
            const res = nativeBindings.dtlsReceive(this.session, msg);
            if (res.handshakeComplete && this.state !== ConnectionState.CONNECTED) {
                this.state = ConnectionState.CONNECTED;
                this.emit("connect");
            }
            if (res.data)
                this.emit("message", res.data);
        }
        catch (e) {
            this.handleError(e);
        }
    }
    /* ------------------------------------------------------------------ */
    /*  Send / Close                                                      */
    /* ------------------------------------------------------------------ */
    send(data) {
        if (this.state !== ConnectionState.CONNECTED)
            throw new Error("DTLS not connected");
        const buf = typeof data === "string" ? Buffer.from(data) : data;
        //@ts-ignore
        const cipher = nativeBindings.aesGcmSeal(buf, buf, buf, buf); // demo only
        //@ts-ignore
        this.socket.send(cipher, 0, cipher.length, this.socket.remotePort, this.socket.remoteAddress);
    }
    close() {
        //@ts-ignore
        try {
            nativeBindings.dtlsShutdown(this.session);
        }
        catch { /* ignore */ }
        //@ts-ignore
        nativeBindings.freeSession?.(this.session);
        //@ts-ignore
        nativeBindings.freeContext?.(this.context);
        this.socket?.close();
        this.state = ConnectionState.CLOSED;
    }
    /* ------------------------------------------------------------------ */
    /*  Error utility                                                     */
    /* ------------------------------------------------------------------ */
    handleError(err) {
        this.state = ConnectionState.ERROR;
        this.emit("error", err);
        this.close();
    }
}
exports.DTLS = DTLS;
//# sourceMappingURL=udtls-pq.js.map