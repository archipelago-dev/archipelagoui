/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'events';
/**
 * Security levels for DTLS connections
 */
export declare enum SecurityLevel {
    STANDARD = "standard",
    POST_QUANTUM_MEDIUM = "pq-medium",
    POST_QUANTUM_HIGH = "pq-high",
    HYBRID = "hybrid"
}
/**
 * Options for DTLS connections
 */
export interface DTLSOptions {
    isServer?: boolean;
    cert?: string | Buffer;
    key?: string | Buffer;
    securityLevel?: SecurityLevel;
    minVersion?: string;
    maxVersion?: string;
    cipherSuites?: string[];
    verifyPeer?: boolean;
    debug?: boolean;
    timeout?: number;
    mtu?: number;
    autoRekey?: boolean;
    rekeyInterval?: number;
}
/**
 * Main DTLS class for handling secure datagram communication
 */
export declare class DTLS extends EventEmitter {
    private context?;
    private session?;
    private socket?;
    private state;
    private readonly options;
    private mtu;
    private debug;
    private timeout;
    private connectionTimeout;
    /**
     * Create a new DTLS instance
     * @param options DTLS options
     */
    constructor(options?: DTLSOptions);
    /**
     * Initialize the DTLS context
     * @throws Error if certificate or key is missing
     */
    private initContext;
    /**
     * Map version string to DTLSVersion enum
     * @param version Version string
     * @returns DTLSVersion enum value
     */
    private mapVersion;
    /**
     * Get PQ cipher suites based on security level
     * @returns Array of PQCipherSuite enums
     */
    private getPQCipherSuites;
    /**
     * Connect to a DTLS server
     * @param port Server port
     * @param host Server host
     * @param callback Optional callback when connected
     * @throws Error if already connected or in server mode
     */
    connect(port: number, host: string, callback?: () => void): void;
    /**
     * Set up UDP socket event handlers
     */
    private setupSocketEvents;
    /**
     * Handle incoming UDP message
     * @param msg Message data
     * @param rinfo Remote info
     */
    private handleMessage;
    /**
     * Start the DTLS handshake
     */
    private startHandshake;
    /**
     * Set a timeout for the connection
     * @param ms Timeout in milliseconds
     */
    private setTimeout;
    /**
     * Clear the connection timeout
     */
    private clearTimeout;
    /**
     * Send data over the DTLS connection
     * @param data Data to send
     * @param callback Optional callback when data is sent
     * @throws Error if not connected
     */
    send(data: Buffer, callback?: (err?: Error, bytes?: number) => void): void;
    /**
     * Fragment data if larger than MTU
     * @param data Data to fragment
     * @returns Array of data fragments
     */
    private fragmentData;
    /**
     * Close the DTLS connection
     * @param callback Optional callback when closed
     */
    close(callback?: () => void): void;
    /**
     * Listen for incoming DTLS connections
     * @param port Port to listen on
     * @param address Optional address to bind to
     * @param callback Optional callback when listening
     * @throws Error if not in server mode
     */
    listen(port: number, address?: string, callback?: () => void): void;
}
