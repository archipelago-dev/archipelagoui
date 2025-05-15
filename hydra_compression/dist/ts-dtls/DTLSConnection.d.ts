/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'events';
import { Socket } from 'dgram';
import { PQCipherSuite } from './PQCipherSuite';
export declare enum ConnectionState {
    CLOSED = "closed",
    HANDSHAKE = "handshake",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    DISCONNECTED = "disconnected",
    ERROR = "error"
}
export interface ConnectionOptions {
    socket: Socket;
    address: string;
    port: number;
    isServer: boolean;
    cert?: Buffer;
    key?: Buffer;
    cipherSuites?: string[];
    pqCipherSuites?: PQCipherSuite[];
    timeout?: number;
}
/**
 * Represents a single DTLS connection
 */
export declare class DTLSConnection extends EventEmitter {
    private state;
    private socket;
    private address;
    private port;
    private isServer;
    private cert?;
    private key?;
    private cipherSuites;
    private pqCipherSuites;
    private timeout;
    private messageSeq;
    private pqKeyExchange?;
    private sharedSecret?;
    private handshakeComplete;
    private remotePublicKey?;
    private localKeyPair?;
    constructor(options: ConnectionOptions);
    /**
     * Start the DTLS handshake
     */
    connect(): Promise<void>;
    /**
     * Send data over the DTLS connection
     * @param data Data to send
     */
    send(data: Buffer | string): void;
    /**
     * Close the DTLS connection
     */
    close(): void;
    /**
     * Handle incoming DTLS messages
     * @param msg Message data
     * @param rinfo Remote address info
     */
    handleMessage(msg: Buffer, rinfo: {
        address: string;
        port: number;
    }): Promise<void>;
    /**
     * Handle change cipher spec message
     * @param data Message data
     */
    private handleChangeCipherSpec;
    /**
     * Handle alert message
     * @param data Message data
     */
    private handleAlert;
    /**
     * Handle handshake message
     * @param data Message data
     */
    private handleHandshake;
    /**
     * Handle application data message
     * @param data Encrypted application data
     */
    private handleApplicationData;
    /**
     * Send client hello message
     */
    private sendClientHello;
    /**
     * Handle client hello message
     * @param data Client hello data
     */
    private handleClientHello;
    /**
     * Send server hello message
     */
    private sendServerHello;
    /**
     * Handle server hello message
     * @param data Server hello data
     */
    private handleServerHello;
    /**
     * Send server key exchange message
     */
    private sendServerKeyExchange;
    /**
     * Handle server key exchange message
     * @param data Server key exchange data
     */
    private handleServerKeyExchange;
    /**
     * Send client key exchange message
     */
    private sendClientKeyExchange;
    /**
     * Handle client key exchange message
     * @param data Client key exchange data
     */
    private handleClientKeyExchange;
    /**
     * Encrypt data using the shared secret
     * @param data Data to encrypt
     * @returns Encrypted data
     */
    private encrypt;
    /**
     * Decrypt data using the shared secret
     * @param data Data to decrypt
     * @returns Decrypted data
     */
    private decrypt;
    /**
     * Get the current connection state
     * @returns Connection state
     */
    getState(): ConnectionState;
}
