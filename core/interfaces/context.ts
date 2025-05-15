// core/interfaces/context.ts

import { CryptoBundle } from '../crypto/factory';

/**
 * Transport‑wide context (one per logical endpoint)
 */
export interface TransportContext {
    /** Unique identifier for this endpoint */
    id: string;

    /** Whether this endpoint acts as the server half of the pair */
    isServer: boolean;

    /** Aggregated crypto primitives + cached keys  */
    crypto: CryptoBundle;

    /** Arbitrary options passed at construction */
    options: Record<string, any>;

    /** Set to true once the mutual handshake has been verified */
    verified: boolean;

    /** Handshake artefacts generated in `init()` */
    handshake: {
        /** 32‑byte random nonce */
        challenge: Uint8Array;
        /** Detached Falcon signature over `challenge` */
        signature: Uint8Array;
        /** The public key that must verify `signature` (added for clarity) */
        publicKey: Uint8Array;
    };

    /** Optional connection metadata */
    peerHost?: string;
    peerPort?: number;
}

/**
 * Per‑pair session (encompasses a single TransportContext + run‑time stats)
 */
export interface TransportSession {
    id: string;
    context: TransportContext;
    createdAt: number;
    lastActivityAt: number;
    close(): void;
}
