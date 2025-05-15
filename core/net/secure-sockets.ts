import {EventEmitter} from "node:events";
import type {DtlsOptions} from "../types/net";
// Native bindings re‑exported by the addon:
import {DTLS, SecurityLevel} from "../../hydra_compression/src/uDTLS-PQ/src/udtls-pq";
import {KeyManager} from "../crypto/key-manager";


/**
 * A thin async/event‑driven wrapper around the u‑DTLS‑PQ addon.
 *
 * Usage:
 *   const sock = new SecureSocket({ host: "127.0.0.1", port: 4444 });
 *   await sock.connect();
 *   sock.on("message", data => console.log("Got", data));
 *   sock.send("hello");
 *   sock.close();
 */
export class SecureSocket extends EventEmitter {
    private session?: DTLS;
    private readonly opts: DtlsOptions;

    constructor(opts: DtlsOptions) {
        super();
        this.opts = opts;
        console.log("SecureSocket opts", opts);
    }

    /** Establish a DTLS (PQ‑hybrid) session. */
    async connect(): Promise<void> {
        try {
            // Ensure we have the required certificates and keys
            if (!this.opts.cert || !this.opts.key) {
                throw new Error("Certificate and key are required for DTLS connection");
            }
            
            this.opts["sessionTicket"] = undefined;
            this.session = new DTLS({
                isServer: false,
                ...this.opts,
                securityLevel: SecurityLevel.HYBRID,
            });
            
            this.session.on("data", (buf: Uint8Array) => this.emit("message", buf));
            this.session.on("close", () => this.emit("close"));
            this.session.on("error", (e: Error) => this.emit("error", e));
            this.emit("open");
        } catch (err) {
            this.emit("error", err as Error);
            throw err;
        }
    }

    /** Send data (string or bytes). Throws if not connected. */
    async send(data: string | Uint8Array): Promise<void> {
        if (!this.session) throw new Error("Not connected");
        
        // Convert string to Buffer if needed
        const buffer = typeof data === "string" ? Buffer.from(data) : data;
        
        try {
            this.session.send(buffer);
        } catch (err) {
            this.emit("error", err as Error);
            throw err;
        }
    }

    /** Close the connection. */
    close(): void {
        if (this.session) {
            try {
                this.session.close();
                this.session = undefined;
            } catch (err) {
                this.emit("error", err as Error);
            }
        }
    }
}
