// src/udtls-pq.ts
import { EventEmitter } from "node:events";
import dgram from "node:dgram";

// src/lib/types.ts
var DTLSSession = class {
  constructor(id) {
    this.id = id;
  }
};

// src/udtls-pq.ts
var DTLS = class extends EventEmitter {
  constructor(options) {
    super();
    this.state = "closed" /* CLOSED */;
    this.opts = {
      isServer: false,
      securityLevel: "standard" /* STANDARD */,
      minVersion: "1.2",
      maxVersion: "1.3",
      verifyPeer: true,
      debug: false,
      timeout: 3e4,
      mtu: 1400,
      autoFallback: true,
      cipherSuites: [],
      ...options
    };
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
      cert: typeof this.opts.cert === "string" ? Buffer.from(this.opts.cert) : this.opts.cert,
      key: this.opts.key,
      ciphers: this.opts.cipherSuites,
      pqCiphers: this.pickPqSuites(),
      enableCertTransparency: true,
      minVersion: this.mapVersion(this.opts.minVersion),
      maxVersion: this.mapVersion(this.opts.maxVersion),
      verifyMode: this.opts.verifyPeer ? 1 /* PEER */ : 0 /* NONE */,
      isServer: this.opts.isServer
    };
    this.context = nativeBindings.createContext(ctxOpts);
    if (!this.context) throw new Error("DTLS context init failed");
  }
  pickPqSuites() {
    switch (this.opts.securityLevel) {
      case "pq-medium" /* POST_QUANTUM_MEDIUM */:
        return ["TLS_KYBER512_WITH_AES_128_GCM_SHA256" /* KYBER512_AES_128_GCM_SHA256 */];
      case "pq-high" /* POST_QUANTUM_HIGH */:
        return ["TLS_KYBER768_WITH_AES_256_GCM_SHA384" /* KYBER768_AES_256_GCM_SHA384 */];
      case "hybrid" /* HYBRID */:
        return [
          "TLS_KYBER512_WITH_AES_128_GCM_SHA256" /* KYBER512_AES_128_GCM_SHA256 */,
          "TLS_KYBER768_WITH_AES_256_GCM_SHA384" /* KYBER768_AES_256_GCM_SHA384 */
        ];
      default:
        return void 0;
    }
  }
  mapVersion(v) {
    return {
      "1.0": "DTLS 1.0" /* DTLS_1_0 */,
      "1.2": "DTLS 1.2" /* DTLS_1_2 */,
      "1.3": "DTLS 1.3" /* DTLS_1_3 */
    }[v];
  }
  compareVer(a, b) {
    return parseFloat(a) - parseFloat(b);
  }
  /* ------------------------------------------------------------------ */
  /*  Client Connect                                                    */
  /* ------------------------------------------------------------------ */
  connect(port, host, cb) {
    if (this.state !== "closed" /* CLOSED */)
      throw new Error("DTLS instance already used");
    if (this.opts.isServer) throw new Error("Server mode cannot connect()");
    this.socket = dgram.createSocket("udp4");
    this.session = new DTLSSession(this.context.id);
    nativeBindings.setupAutomaticRekey(this.session.id, 3600);
    const ok = nativeBindings.dtlsConnect(this.session, host, port);
    if (!ok) {
      const err = nativeBindings.getError(this.session) ?? "DTLS connect error";
      return this.handleError(new Error(err));
    }
    this.state = "handshake" /* HANDSHAKE */;
    this.setupSocketEvents();
    if (cb) this.once("connect", cb);
  }
  /* ------------------------------------------------------------------ */
  /*  UDP Socket Event Wiring                                           */
  /* ------------------------------------------------------------------ */
  setupSocketEvents() {
    const sock = this.socket;
    sock.on("message", (msg) => this.onUdpData(msg));
    sock.on("error", (e) => this.handleError(e));
    sock.on("close", () => {
      this.state = "disconnected" /* DISCONNECTED */;
      this.emit("close");
    });
  }
  onUdpData(msg) {
    if (!msg?.length) {
      this.emit("error", new Error("Empty UDP packet"));
      return;
    }
    try {
      const res = nativeBindings.dtlsReceive(this.session, msg);
      if (res.handshakeComplete && this.state !== "connected" /* CONNECTED */) {
        this.state = "connected" /* CONNECTED */;
        this.emit("connect");
      }
      if (res.data) this.emit("message", res.data);
    } catch (e) {
      this.handleError(e);
    }
  }
  /* ------------------------------------------------------------------ */
  /*  Send / Close                                                      */
  /* ------------------------------------------------------------------ */
  send(data) {
    if (this.state !== "connected" /* CONNECTED */)
      throw new Error("DTLS not connected");
    const buf = typeof data === "string" ? Buffer.from(data) : data;
    const cipher = nativeBindings.aesGcmSeal(buf, buf, buf, buf);
    this.socket.send(cipher, 0, cipher.length, this.socket.remotePort, this.socket.remoteAddress);
  }
  close() {
    try {
      nativeBindings.dtlsShutdown(this.session);
    } catch {
    }
    nativeBindings.freeSession?.(this.session);
    nativeBindings.freeContext?.(this.context);
    this.socket?.close();
    this.state = "closed" /* CLOSED */;
  }
  /* ------------------------------------------------------------------ */
  /*  Error utility                                                     */
  /* ------------------------------------------------------------------ */
  handleError(err) {
    this.state = "error" /* ERROR */;
    this.emit("error", err);
    this.close();
  }
};

// src/index.ts
var dtls = new DTLS({
  isServer: false,
  securityLevel: "hybrid" /* HYBRID */,
  cert: Buffer.from("mock-cert"),
  key: Buffer.from("mock-key")
});
export {
  dtls
};
//# sourceMappingURL=index.mjs.map