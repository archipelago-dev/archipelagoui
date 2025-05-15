// Post‑quantum KEM preference
import {SecurityLevel} from "../../hydra_compression/src/uDTLS-PQ/src/udtls-pq";

export type PqCipher =
    | "KYBER_LEVEL_1"
    | "KYBER_LEVEL_3"
    | "KYBER_LEVEL_5";

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