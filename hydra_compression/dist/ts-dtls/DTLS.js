"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DTLS = exports.SecurityLevel = void 0;
const events_1 = require("events");
const dgram = __importStar(require("dgram"));
const DTLSContext_1 = require("./DTLSContext");
const DTLSSession_1 = require("./DTLSSession");
const PQCipherSuite_1 = require("./PQCipherSuite");
/**
 * Security levels for DTLS connections
 */
var SecurityLevel;
(function (SecurityLevel) {
    SecurityLevel["STANDARD"] = "standard";
    SecurityLevel["POST_QUANTUM_MEDIUM"] = "pq-medium";
    SecurityLevel["POST_QUANTUM_HIGH"] = "pq-high";
    SecurityLevel["HYBRID"] = "hybrid";
})(SecurityLevel = exports.SecurityLevel || (exports.SecurityLevel = {}));
/**
 * Main DTLS class for handling secure datagram communication
 */
class DTLS extends events_1.EventEmitter {
    /**
     * Create a new DTLS instance
     * @param options DTLS options
     */
    constructor(options = {}) {
        super();
        this.state = DTLSSession_1.ConnectionState.CLOSED;
        this.timeout = null;
        // Set default options
        this.options = {
            isServer: false,
            cert: '',
            key: '',
            securityLevel: SecurityLevel.STANDARD,
            minVersion: '1.2',
            maxVersion: '1.2',
            cipherSuites: [],
            verifyPeer: true,
            debug: false,
            timeout: 30000,
            mtu: 1400,
            autoRekey: true,
            rekeyInterval: 3600,
            ...options
        };
        this.mtu = this.options.mtu;
        this.debug = this.options.debug;
        this.connectionTimeout = this.options.timeout;
    }
    /**
     * Initialize the DTLS context
     * @throws Error if certificate or key is missing
     */
    initContext() {
        if (!this.options.cert || !this.options.key) {
            throw new Error('Certificate and key are required');
        }
        // Create context options
        const contextOptions = {
            isServer: this.options.isServer,
            cert: this.options.cert,
            key: this.options.key,
            cipherSuites: this.options.cipherSuites,
            pqCipherSuites: this.getPQCipherSuites(),
            minVersion: this.mapVersion(this.options.minVersion),
            maxVersion: this.mapVersion(this.options.maxVersion),
            verifyMode: this.options.verifyPeer ? DTLSContext_1.VerifyMode.PEER : DTLSContext_1.VerifyMode.NONE,
            enableCertTransparency: true,
            ocspStapling: true
        };
        // Create the context
        this.context = new DTLSContext_1.DTLSContext(contextOptions);
        if (this.debug) {
            console.log(`DTLS context created with ID ${this.context.id}`);
        }
    }
    /**
     * Map version string to DTLSVersion enum
     * @param version Version string
     * @returns DTLSVersion enum value
     */
    mapVersion(version) {
        switch (version) {
            case '1.0':
                return DTLSContext_1.DTLSVersion.DTLS_1_0;
            case '1.3':
                return DTLSContext_1.DTLSVersion.DTLS_1_3;
            case '1.2':
            default:
                return DTLSContext_1.DTLSVersion.DTLS_1_2;
        }
    }
    /**
     * Get PQ cipher suites based on security level
     * @returns Array of PQCipherSuite enums
     */
    getPQCipherSuites() {
        switch (this.options.securityLevel) {
            case SecurityLevel.POST_QUANTUM_MEDIUM:
                return [PQCipherSuite_1.PQCipherSuite.KYBER512_AES_128_GCM_SHA256];
            case SecurityLevel.POST_QUANTUM_HIGH:
                return [PQCipherSuite_1.PQCipherSuite.KYBER768_AES_256_GCM_SHA384];
            case SecurityLevel.HYBRID:
                return [
                    PQCipherSuite_1.PQCipherSuite.KYBER512_AES_128_GCM_SHA256,
                    PQCipherSuite_1.PQCipherSuite.KYBER768_AES_256_GCM_SHA384
                ];
            default:
                return [];
        }
    }
    /**
     * Connect to a DTLS server
     * @param port Server port
     * @param host Server host
     * @param callback Optional callback when connected
     * @throws Error if already connected or in server mode
     */
    connect(port, host, callback) {
        if (this.state !== DTLSSession_1.ConnectionState.CLOSED) {
            throw new Error('DTLS instance already in use');
        }
        if (this.options.isServer) {
            throw new Error('Cannot connect in server mode');
        }
        // Initialize context if not already done
        if (!this.context) {
            this.initContext();
        }
        // Create UDP socket
        this.socket = dgram.createSocket('udp4');
        // Set up socket event handlers
        this.setupSocketEvents();
        // Create session
        if (this.context) {
            this.session = new DTLSSession_1.DTLSSession(this.context.id);
            // Set up automatic rekeying if enabled
            if (this.options.autoRekey) {
                this.session.setupAutomaticRekey(this.options.rekeyInterval);
            }
            // Connect to the peer
            const success = this.session.connect(host, port);
            if (!success) {
                this.emit('error', new Error('Failed to initiate DTLS connection'));
                return;
            }
            this.state = DTLSSession_1.ConnectionState.CONNECTING;
            // Set connection timeout
            this.setTimeout(this.connectionTimeout);
            // Register connect callback if provided
            if (callback) {
                this.once('connect', callback);
            }
            // Start handshake
            this.startHandshake();
        }
        else {
            this.emit('error', new Error('DTLS context not initialized'));
        }
    }
    /**
     * Set up UDP socket event handlers
     */
    setupSocketEvents() {
        if (!this.socket)
            return;
        this.socket.on('message', (msg, rinfo) => {
            this.handleMessage(msg, rinfo);
        });
        this.socket.on('error', (err) => {
            this.emit('error', err);
            this.close();
        });
        this.socket.on('close', () => {
            this.state = DTLSSession_1.ConnectionState.CLOSED;
            this.emit('close');
        });
    }
    /**
     * Handle incoming UDP message
     * @param msg Message data
     * @param rinfo Remote info
     */
    handleMessage(msg, rinfo) {
        // Clear timeout as we received a message
        this.clearTimeout();
        if (!this.session) {
            this.emit('error', new Error('No active DTLS session'));
            return;
        }
        try {
            // Process the DTLS message
            const result = this.session.processData(msg);
            // If handshake is complete and we were connecting, emit connect event
            if (result.handshakeComplete && this.state === DTLSSession_1.ConnectionState.CONNECTING) {
                this.state = DTLSSession_1.ConnectionState.CONNECTED;
                this.emit('connect');
            }
            // If we received application data, emit data event
            if (result.applicationData) {
                this.emit('data', result.applicationData);
            }
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    /**
     * Start the DTLS handshake
     */
    startHandshake() {
        // Implementation would send ClientHello or process incoming ClientHello
        // This would be implemented in the DTLSSession class
    }
    /**
     * Set a timeout for the connection
     * @param ms Timeout in milliseconds
     */
    setTimeout(ms) {
        this.clearTimeout();
        this.timeout = setTimeout(() => {
            this.emit('timeout');
            this.close();
        }, ms);
    }
    /**
     * Clear the connection timeout
     */
    clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
    /**
     * Send data over the DTLS connection
     * @param data Data to send
     * @param callback Optional callback when data is sent
     * @throws Error if not connected
     */
    send(data, callback) {
        if (this.state !== DTLSSession_1.ConnectionState.CONNECTED) {
            const error = new Error('Not connected');
            if (callback) {
                callback(error);
            }
            else {
                throw error;
            }
            return;
        }
        if (!this.session || !this.socket) {
            const error = new Error('Session or socket not initialized');
            if (callback) {
                callback(error);
            }
            else {
                throw error;
            }
            return;
        }
        try {
            // Fragment data if larger than MTU
            const fragments = this.fragmentData(data);
            // Send each fragment
            for (const fragment of fragments) {
                const record = this.session.sendApplicationData(fragment);
                this.socket.send(record, 0, record.length, this.session.getPeerPort() || 0, this.session.getPeerAddress() || '', callback);
            }
        }
        catch (error) {
            if (callback) {
                callback(error instanceof Error ? error : new Error(String(error)));
            }
            else {
                throw error;
            }
        }
    }
    /**
     * Fragment data if larger than MTU
     * @param data Data to fragment
     * @returns Array of data fragments
     */
    fragmentData(data) {
        const fragments = [];
        const maxFragmentSize = this.mtu - 25; // DTLS overhead
        for (let offset = 0; offset < data.length; offset += maxFragmentSize) {
            fragments.push(data.slice(offset, offset + maxFragmentSize));
        }
        return fragments;
    }
    /**
     * Close the DTLS connection
     * @param callback Optional callback when closed
     */
    close(callback) {
        // Clear timeout
        this.clearTimeout();
        // Free session
        if (this.session) {
            const sessionId = this.session.id;
            DTLSSession_1.DTLSSession.freeSession(sessionId);
            this.session = undefined;
        }
        // Close socket
        if (this.socket) {
            this.socket.close(() => {
                this.state = DTLSSession_1.ConnectionState.CLOSED;
                if (callback) {
                    callback();
                }
            });
        }
        else if (callback) {
            callback();
        }
        // Free context
        if (this.context) {
            const contextId = this.context.id;
            DTLSContext_1.DTLSContext.freeContext(contextId);
            this.context = undefined;
        }
    }
    /**
     * Listen for incoming DTLS connections
     * @param port Port to listen on
     * @param address Optional address to bind to
     * @param callback Optional callback when listening
     * @throws Error if not in server mode
     */
    listen(port, address, callback) {
        if (!this.options.isServer) {
            throw new Error('Cannot listen in client mode');
        }
        // Initialize context if not already done
        if (!this.context) {
            this.initContext();
        }
        // Create UDP socket
        this.socket = dgram.createSocket('udp4');
        // Set up socket event handlers
        this.setupSocketEvents();
        // Bind socket
        this.socket.bind(port, address, () => {
            this.emit('listening');
            if (callback) {
                callback();
            }
        });
    }
}
exports.DTLS = DTLS;
//# sourceMappingURL=DTLS.js.map