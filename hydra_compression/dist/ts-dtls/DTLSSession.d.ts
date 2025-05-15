/// <reference types="node" />
/// <reference types="node" />
/**
 * Connection states for a DTLS session
 */
export declare enum ConnectionState {
    CLOSED = "closed",
    HANDSHAKE = "handshake",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    DISCONNECTED = "disconnected",
    ERROR = "error"
}
/**
 * Manages a DTLS session
 * This is a TypeScript implementation of the functionality provided by SSL in OpenSSL
 */
export declare class DTLSSession {
    private static nextId;
    private static sessions;
    readonly id: number;
    private readonly context;
    private state;
    private securityParameters;
    private peerAddress?;
    private peerPort?;
    private sequenceNumber;
    private epoch;
    private keyExchange;
    private handshakeMessages;
    private handshakeHash?;
    private rekeyInterval?;
    private lastActivity;
    /**
     * Create a new DTLS session
     * @param contextId ID of the DTLS context to use
     */
    constructor(contextId: number);
    /**
     * Get a session by ID
     * @param id Session ID
     * @returns The session or undefined if not found
     */
    static getSessionById(id: number): DTLSSession | undefined;
    /**
     * Free a session by ID
     * @param id Session ID
     * @returns true if the session was found and freed, false otherwise
     */
    static freeSession(id: number): boolean;
    /**
     * Set up automatic rekeying
     * @param intervalSeconds Interval in seconds between rekeying
     */
    setupAutomaticRekey(intervalSeconds: number): void;
    /**
     * Perform a key update (rekeying)
     */
    private rekey;
    /**
     * Derive the key block from the master secret and seed
     * @param masterSecret The master secret
     * @param seed The seed for key derivation
     */
    private deriveKeyBlock;
    /**
     * HKDF-Expand function (RFC 5869)
     * @param prk Pseudorandom key
     * @param info Context and application specific information
     * @param length Length of output keying material in bytes
     * @returns Output keying material
     */
    private hkdfExpand;
    /**
     * Connect to a peer
     * @param address Peer address
     * @param port Peer port
     * @returns true if the connection was initiated successfully, false otherwise
     */
    connect(address: string, port: number): boolean;
    /**
     * Process received DTLS data
     * @param data Received data
     * @returns Object with handshake status and any application data
     */
    processData(data: Buffer): {
        handshakeComplete: boolean;
        applicationData?: Buffer;
    };
    /**
     * Process a ChangeCipherSpec message
     * @param fragment Message fragment
     * @returns Object with handshake status
     */
    private processChangeCipherSpec;
    /**
     * Process an Alert message
     * @param fragment Message fragment
     * @returns Object with handshake status
     */
    private processAlert;
    /**
     * Process a Handshake message
     * @param fragment Message fragment
     * @returns Object with handshake status
     */
    private processHandshake;
    /**
     * Process a ClientHello message
     * @param data Message data
     * @returns Object with handshake status
     */
    private processClientHello;
    /**
     * Process a ServerHello message
     * @param data Message data
     * @returns Object with handshake status
     */
    private processServerHello;
    /**
     * Process a Certificate message
     * @param data Message data
     * @returns Object with handshake status
     */
    private processCertificate;
    /**
     * Process a ServerKeyExchange message
     * @param data Message data
     * @returns Object with handshake status
     */
    private processServerKeyExchange;
    /**
     * Process a CertificateRequest message
     * @param data Message data
     * @returns Object with handshake status
     */
    private processCertificateRequest;
    /**
     * Process a ServerHelloDone message
     * @param data Message data
     * @returns Object with handshake status
     */
    private processServerHelloDone;
    /**
     * Process a CertificateVerify message
     * @param data Message data
     * @returns Object with handshake status
     */
    private processCertificateVerify;
    /**
     * Process a ClientKeyExchange message
     * @param data Message data
     * @returns Object with handshake status
     */
    private processClientKeyExchange;
    /**
     * Process a Finished message
     * @param data Message data
     * @returns Object with handshake status
     */
    private processFinished;
    /**
     * Decrypt application data
     * @param data Encrypted data
     * @param epoch Epoch number
     * @param sequenceNumber Sequence number
     * @returns Decrypted data
     */
    private decryptApplicationData;
    /**
     * Send application data
     * @param data Data to send
     * @returns Encrypted record
     */
    sendApplicationData(data: Buffer): Buffer;
    /**
     * Get the current connection state
     * @returns The connection state
     */
    getState(): ConnectionState;
    /**
     * Get the peer address
     * @returns The peer address or undefined if not connected
     */
    getPeerAddress(): string | undefined;
    /**
     * Get the peer port
     * @returns The peer port or undefined if not connected
     */
    getPeerPort(): number | undefined;
    /**
     * Clean up resources
     */
    private cleanup;
    /**
     * Free this session
     * This removes it from the static map and cleans up resources
     */
    free(): void;
}
