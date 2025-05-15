import { EventEmitter } from "node:events";
import dgram            from "node:dgram";
import { createRequire } from "node:module";
//  * Generate a Falcon key pair for post-quantum secure signatures


// ── Types ─────────────────────────────────────────────────────────────────────
import {
    DTLSContext,
DTLSSession,
    DTLSContextOptions,
    DTLSVersion,
    PQCipherSuite,
    VerifyMode,
} from "./lib/types";

/* -------------------------------------------------------------------------- */
/*  Public enums & interfaces                                                 */
/* -------------------------------------------------------------------------- */

export enum SecurityLevel {
    STANDARD = "standard",
    POST_QUANTUM_MEDIUM = "pq-medium",
    POST_QUANTUM_HIGH = "pq-high",
    HYBRID = "hybrid",
}

export interface DTLSOptions {
    isServer?: boolean;
    cert?: string | Buffer;
    key?: string | Buffer;
    securityLevel?: SecurityLevel;
    minVersion?: "1.0" | "1.2" | "1.3";
    maxVersion?: "1.2" | "1.3";
    cipherSuites?: string[];
    verifyPeer?: boolean;
    debug?: boolean;
    timeout?: number;
    mtu?: number;
    autoFallback?: boolean;
}

export enum ConnectionState {
    CLOSED        = "closed",
    HANDSHAKE     = "handshake",
    CONNECTING    = "connecting",
    CONNECTED     = "connected",
    DISCONNECTED  = "disconnected",
    ERROR         = "error",
}

export class DTLS extends EventEmitter {
    private context!: DTLSContext;
    private session!: DTLSSession;

    private readonly opts: {
        isServer: boolean;
        securityLevel: SecurityLevel;
        minVersion: string | "1.0" | "1.2" | "1.3";
        maxVersion: string | "1.2" | "1.3";
        verifyPeer: boolean;
        debug: boolean;
        timeout: number;
        mtu: number;
        autoFallback: boolean;
        cipherSuites: any[] | string[];
        cert?: string | Buffer;
        key?: string | Buffer
    };
    private state: ConnectionState = ConnectionState.CLOSED;
    private socket?: dgram.Socket;

    constructor(options: DTLSOptions) {
        super();

        /* default‑merge */
        this.opts = {
            isServer: false,
            securityLevel: SecurityLevel.STANDARD,
            minVersion: "1.2",
            maxVersion: "1.3",
            verifyPeer: true,
            debug: false,
            timeout: 30_000,
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

    private initContext(): void {
        if (!this.opts.cert || !this.opts.key)
            throw new Error("Certificate & key required for DTLS context");

        if (this.compareVer(this.opts.minVersion, this.opts.maxVersion) > 0)
            throw new Error("minVersion cannot exceed maxVersion");

        const ctxOpts: DTLSContextOptions = {
            cert: typeof this.opts.cert === "string"
                ? Buffer.from(this.opts.cert)
                : this.opts.cert,
            key:  this.opts.key as Buffer,
            ciphers: this.opts.cipherSuites,
            pqCiphers: this.pickPqSuites(),
            enableCertTransparency: true,
            minVersion: this.mapVersion(this.opts.minVersion),
            maxVersion: this.mapVersion(this.opts.maxVersion),
            verifyMode: this.opts.verifyPeer ? VerifyMode.PEER : VerifyMode.NONE,
            isServer: this.opts.isServer,
        };
// @ts-ignore
        this.context = nativeBindings.createContext(ctxOpts);
        if (!this.context) throw new Error("DTLS context init failed");
    }

    private pickPqSuites(): PQCipherSuite[] | undefined {
        switch (this.opts.securityLevel) {
            case SecurityLevel.POST_QUANTUM_MEDIUM:
                return [PQCipherSuite.KYBER512_AES_128_GCM_SHA256];
            case SecurityLevel.POST_QUANTUM_HIGH:
                return [PQCipherSuite.KYBER768_AES_256_GCM_SHA384];
            case SecurityLevel.HYBRID:
                return [
                    PQCipherSuite.KYBER512_AES_128_GCM_SHA256,
                    PQCipherSuite.KYBER768_AES_256_GCM_SHA384,
                ];
            default:
                return undefined;
        }
    }

    private mapVersion(v: string | "1.0" | "1.2" | "1.3"): DTLSVersion | undefined {
        return {
            "1.0": DTLSVersion.DTLS_1_0,
            "1.2": DTLSVersion.DTLS_1_2,
            "1.3": DTLSVersion.DTLS_1_3,
        }[v];
    }

    private compareVer(a: string, b: string) {
        return parseFloat(a) - parseFloat(b);
    }

    /* ------------------------------------------------------------------ */
    /*  Client Connect                                                    */
    /* ------------------------------------------------------------------ */
    connect(port: number, host: string, cb?: () => void) {
        if (this.state !== ConnectionState.CLOSED)
            throw new Error("DTLS instance already used");

        if (this.opts.isServer) throw new Error("Server mode cannot connect()");
        this.socket = dgram.createSocket("udp4");


        this.session = new DTLSSession(this.context.id);
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
        if (cb) this.once("connect", cb);
    }

    /* ------------------------------------------------------------------ */
    /*  UDP Socket Event Wiring                                           */
    /* ------------------------------------------------------------------ */
    private setupSocketEvents() {
        const sock = this.socket!;
        sock.on("message", (msg) => this.onUdpData(msg));
        sock.on("error", (e) => this.handleError(e));
        sock.on("close", () => {
            this.state = ConnectionState.DISCONNECTED;
            this.emit("close");
        });
    }

    private onUdpData(msg: Buffer) {
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
            if (res.data) this.emit("message", res.data as Buffer);
        } catch (e) {
            this.handleError(e as Error);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Send / Close                                                      */
    /* ------------------------------------------------------------------ */

    send(data: Buffer | string) {
        if (this.state !== ConnectionState.CONNECTED)
            throw new Error("DTLS not connected");

        const buf   = typeof data === "string" ? Buffer.from(data) : data;
        //@ts-ignore
        const cipher= nativeBindings.aesGcmSeal(buf, buf, buf, buf); // demo only
        //@ts-ignore
        this.socket!.send(cipher, 0, cipher.length, this.socket!.remotePort!, this.socket!.remoteAddress!);
    }

    close() {
        //@ts-ignore
        try { nativeBindings.dtlsShutdown(this.session); } catch { /* ignore */ }
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
    private handleError(err: Error) {
        this.state = ConnectionState.ERROR;
        this.emit("error", err);
        this.close();
    }
}
