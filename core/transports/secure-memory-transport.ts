// core/transports/secure-memory-transport.ts

import { Transport, TransportOptions } from '../interfaces/transport';
import { AESGCM, generateAesKey } from '../crypto/aes';
import { TransportContext, TransportSession } from '../interfaces/context';
import { createCryptoBundle } from '../crypto/factory';

/**
 * In‑process transport that encrypts payloads with AES‑GCM and authenticates
 * both peers via a Falcon‑signed nonce.  No actual sockets are used – the peer
 * instance is linked directly through `pairWith()`.
 */
export class SecureMemoryTransport implements Transport {
    /* ------------------------------------------------------------------ */
    private key: CryptoKey | null = null;
    private peer: SecureMemoryTransport | null = null;
    private handlers: Record<string, Function[]> = {};

    private readonly options: TransportOptions;
    private context: TransportContext | null = null;
    private session: TransportSession | null = null;
    private aes: AESGCM | null = null;

    constructor(options: TransportOptions) {
        this.options = options;
    }

    /* -------------------------- getters ------------------------------- */
    getContext(): TransportContext | null {
        return this.context;
    }
    getSession(): TransportSession | null {
        return this.session;
    }

    /* ------------------------- lifecycle ------------------------------ */
    async init(): Promise<void> {
        console.info('[SecureMemoryTransport] Initializing transport…');

        const crypto = await createCryptoBundle(this.options);

        // Symmetric key for payload encryption
        this.key = await generateAesKey();
        this.aes = new AESGCM(this.key);

        // Handshake artefacts
        const challenge = globalThis.crypto.getRandomValues(new Uint8Array(32));
        // @ts-ignore
        const signature = await crypto.signature.sign(challenge, crypto.signaturePrivateKey);

        const id = typeof globalThis.crypto?.randomUUID === 'function'
            ? globalThis.crypto.randomUUID()
            : Math.random().toString(36).slice(2);

        this.context = {
            id,
            isServer: this.options.isServer,
            crypto,
            options: {},
            verified: false,
            handshake: {
                challenge,
                signature,
                // @ts-ignore
                publicKey: crypto.signaturePublicKey
            }
        };

        this.session = {
            id: `${id}-session`,
            // @ts-ignore
            context: this.context,
            createdAt: Date.now(),
            lastActivityAt: Date.now(),
            close: () => this.close()
        };

        console.debug('[SecureMemoryTransport] Generated handshake challenge and signature');
    }

    /* ------------------------- pairing / handshake -------------------- */
    /** Link two SecureMemoryTransport instances together */
    pairWith(peer: SecureMemoryTransport): void {
        console.info('[SecureMemoryTransport] Pairing with peer…');

        // Basic sanity checks
        if (!this.context || !peer.context) throw new Error('Both transports must be initialised');

        // Build two verification promises
        const localVerify = peer.context.crypto.signature.verify(
            this.context.handshake.challenge,
            this.context.handshake.signature,
            this.context.handshake.publicKey
        );

        const peerVerify = this.context.crypto.signature.verify(
            peer.context.handshake.challenge,
            peer.context.handshake.signature,
            peer.context.handshake.publicKey
        );

        // Race the combined verification against a timeout
        Promise.race([
            Promise.all([localVerify, peerVerify]),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Handshake timeout')), 2000)
            )
        ])
            .then((result) => {
                // Type‑guard the resolved value from race()
                if (!Array.isArray(result) || result.length !== 2) {
                    throw new Error('Unexpected handshake race result');
                }
                const [locOK, peerOK] = result as [boolean, boolean];
                if (!locOK || !peerOK) throw new Error('Mutual handshake verification failed');

                this.context!.verified = true;
                peer.context!.verified = true;
                console.info('[SecureMemoryTransport] Mutual handshake verification successful');

                // Establish bidirectional link and share symmetric key
                const sharedKey = this.key!;            // reuse initiator’s key
                this.aes = new AESGCM(sharedKey);
                this.key = sharedKey;

                peer.key = sharedKey;                   // ⬅ always set
                peer.aes = new AESGCM(sharedKey);       // ⬅ rebuild AES
                this.peer = peer;
                peer.peer = this;
                if (!peer.key && this.key) peer.key = this.key;
            })
            .catch((err) => {
                throw new Error(`[SecureMemoryTransport] Handshake error: ${err.message}`);
            });
    }

    /* ------------------------- connection stubs ----------------------- */
    async connect(_port: number, _host: string): Promise<void> {
        console.info('[SecureMemoryTransport] Simulating connect (no‑op)…');
    }
    async listen(_port: number): Promise<void> {
        console.info('[SecureMemoryTransport] Simulating listen (no‑op)…');
    }

    /* ------------------------- data plane ----------------------------- */
    private ensureVerified() {
        if (!this.context?.verified) throw new Error('Handshake not verified');
    }

    async send(data: Uint8Array): Promise<void> {
        this.ensureVerified();
        if (!this.aes || !this.peer) return;
        console.debug('[SecureMemoryTransport] Sending encrypted payload…');
        const encrypted = await this.aes.encrypt(data);
        this.session!.lastActivityAt = Date.now();
        this.peer.receive(encrypted);
    }

    async receive(data: Uint8Array): Promise<void> {
        this.ensureVerified();
        if (!this.aes) return;
        console.debug('[SecureMemoryTransport] Receiving and decrypting payload…');
        // @ts-ignore
        const decrypted = await this.aes.decrypt(data);
        this.session!.lastActivityAt = Date.now();
        this.emit('message', decrypted);
    }

    /* ------------------------- teardown ------------------------------- */
    close(): void {
        console.warn('[SecureMemoryTransport] Closing session…');
        this.peer = null;
        this.key = null;
        this.session = null;
        this.context = null;
    }

    /* ------------------------- event helpers -------------------------- */
    on(event: 'message' | 'error', handler: Function): void {
        if (!this.handlers[event]) this.handlers[event] = [];
        this.handlers[event].push(handler);
    }
    private emit(event: string, payload: any): void {
        (this.handlers[event] || []).forEach((fn) => fn(payload));
    }
}
