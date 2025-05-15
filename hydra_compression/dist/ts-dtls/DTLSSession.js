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
exports.DTLSSession = exports.ConnectionState = void 0;
const crypto = __importStar(require("crypto"));
const DTLSContext_1 = require("./DTLSContext");
const PQKeyExchange_1 = require("./PQKeyExchange");
/**
 * Connection states for a DTLS session
 */
var ConnectionState;
(function (ConnectionState) {
    ConnectionState["CLOSED"] = "closed";
    ConnectionState["HANDSHAKE"] = "handshake";
    ConnectionState["CONNECTING"] = "connecting";
    ConnectionState["CONNECTED"] = "connected";
    ConnectionState["DISCONNECTED"] = "disconnected";
    ConnectionState["ERROR"] = "error";
})(ConnectionState = exports.ConnectionState || (exports.ConnectionState = {}));
/**
 * Manages a DTLS session
 * This is a TypeScript implementation of the functionality provided by SSL in OpenSSL
 */
class DTLSSession {
    /**
     * Create a new DTLS session
     * @param contextId ID of the DTLS context to use
     */
    constructor(contextId) {
        this.state = ConnectionState.CLOSED;
        this.sequenceNumber = 0n;
        this.epoch = 0;
        this.handshakeMessages = [];
        this.lastActivity = Date.now();
        const context = DTLSContext_1.DTLSContext.getContextById(contextId);
        if (!context) {
            throw new Error(`Context with ID ${contextId} not found`);
        }
        this.id = DTLSSession.nextId++;
        this.context = context;
        this.securityParameters = {
            cipherSuite: '',
            compressionMethod: 0
        };
        this.keyExchange = new PQKeyExchange_1.PQKeyExchange();
        // Store the session in the static map
        DTLSSession.sessions.set(this.id, this);
    }
    /**
     * Get a session by ID
     * @param id Session ID
     * @returns The session or undefined if not found
     */
    static getSessionById(id) {
        return DTLSSession.sessions.get(id);
    }
    /**
     * Free a session by ID
     * @param id Session ID
     * @returns true if the session was found and freed, false otherwise
     */
    static freeSession(id) {
        const session = DTLSSession.sessions.get(id);
        if (session) {
            session.cleanup();
            return DTLSSession.sessions.delete(id);
        }
        return false;
    }
    /**
     * Set up automatic rekeying
     * @param intervalSeconds Interval in seconds between rekeying
     */
    setupAutomaticRekey(intervalSeconds) {
        // Clear any existing rekey interval
        if (this.rekeyInterval) {
            clearInterval(this.rekeyInterval);
        }
        // Set up a new rekey interval
        this.rekeyInterval = setInterval(() => {
            // Only rekey if the session is connected and has been active recently
            if (this.state === ConnectionState.CONNECTED &&
                Date.now() - this.lastActivity < intervalSeconds * 1000 * 2) {
                this.rekey();
            }
        }, intervalSeconds * 1000);
    }
    /**
     * Perform a key update (rekeying)
     */
    rekey() {
        // Increment the epoch
        this.epoch++;
        // Generate new key material
        if (this.securityParameters.masterSecret &&
            this.securityParameters.clientRandom &&
            this.securityParameters.serverRandom) {
            // Derive new key block using the master secret and updated parameters
            const seed = Buffer.concat([
                Buffer.from('key update'),
                this.securityParameters.clientRandom,
                this.securityParameters.serverRandom,
                Buffer.from([this.epoch & 0xff, (this.epoch >> 8) & 0xff])
            ]);
            this.deriveKeyBlock(this.securityParameters.masterSecret, seed);
        }
    }
    /**
     * Derive the key block from the master secret and seed
     * @param masterSecret The master secret
     * @param seed The seed for key derivation
     */
    deriveKeyBlock(masterSecret, seed) {
        // Use HKDF to derive key material
        const keyMaterial = this.hkdfExpand(masterSecret, seed, 96); // Size depends on cipher suite
        // Split the key material into the various keys
        const clientWriteKey = keyMaterial.slice(0, 16);
        const serverWriteKey = keyMaterial.slice(16, 32);
        const clientWriteIV = keyMaterial.slice(32, 48);
        const serverWriteIV = keyMaterial.slice(48, 64);
        const clientMac = keyMaterial.slice(64, 80);
        const serverMac = keyMaterial.slice(80, 96);
        // Update the security parameters
        this.securityParameters.keyBlock = {
            clientWriteKey,
            serverWriteKey,
            clientWriteIV,
            serverWriteIV,
            clientMac,
            serverMac
        };
    }
    /**
     * HKDF-Expand function (RFC 5869)
     * @param prk Pseudorandom key
     * @param info Context and application specific information
     * @param length Length of output keying material in bytes
     * @returns Output keying material
     */
    hkdfExpand(prk, info, length) {
        const hashLen = 32; // SHA-256 hash length
        const n = Math.ceil(length / hashLen);
        const t = Buffer.alloc(n * hashLen);
        let prev = Buffer.alloc(0);
        for (let i = 0; i < n; i++) {
            const hmac = crypto.createHmac('sha256', prk);
            hmac.update(Buffer.concat([prev, info, Buffer.from([i + 1])]));
            const output = hmac.digest();
            output.copy(t, i * hashLen);
            prev = output;
        }
        return t.slice(0, length);
    }
    /**
     * Connect to a peer
     * @param address Peer address
     * @param port Peer port
     * @returns true if the connection was initiated successfully, false otherwise
     */
    connect(address, port) {
        if (this.state !== ConnectionState.CLOSED) {
            return false;
        }
        this.peerAddress = address;
        this.peerPort = port;
        this.state = ConnectionState.CONNECTING;
        // Reset sequence number and epoch
        this.sequenceNumber = 0n;
        this.epoch = 0;
        // Clear handshake messages
        this.handshakeMessages = [];
        return true;
    }
    /**
     * Process received DTLS data
     * @param data Received data
     * @returns Object with handshake status and any application data
     */
    processData(data) {
        // Update last activity timestamp
        this.lastActivity = Date.now();
        // Process the DTLS record
        try {
            // Parse record header
            if (data.length < 13) { // DTLS record header is 13 bytes
                throw new Error('Record too short');
            }
            const contentType = data[0];
            const version = data.readUInt16BE(1);
            const epoch = data.readUInt16BE(3);
            const sequenceNumber = data.readUIntBE(5, 6);
            const length = data.readUInt16BE(11);
            if (data.length < 13 + length) {
                throw new Error('Record truncated');
            }
            const fragment = data.slice(13, 13 + length);
            // Process based on content type
            switch (contentType) {
                case 20: // ChangeCipherSpec
                    return this.processChangeCipherSpec(fragment);
                case 21: // Alert
                    return this.processAlert(fragment);
                case 22: // Handshake
                    return this.processHandshake(fragment);
                case 23: // Application data
                    return {
                        handshakeComplete: true,
                        applicationData: this.decryptApplicationData(fragment, epoch, BigInt(sequenceNumber))
                    };
                default:
                    throw new Error(`Unknown content type: ${contentType}`);
            }
        }
        catch (error) {
            console.error('Error processing DTLS data:', error);
            this.state = ConnectionState.ERROR;
            return { handshakeComplete: false };
        }
    }
    /**
     * Process a ChangeCipherSpec message
     * @param fragment Message fragment
     * @returns Object with handshake status
     */
    processChangeCipherSpec(fragment) {
        // ChangeCipherSpec is a single byte with value 1
        if (fragment.length !== 1 || fragment[0] !== 1) {
            throw new Error('Invalid ChangeCipherSpec message');
        }
        // Update state based on current state
        if (this.state === ConnectionState.HANDSHAKE) {
            // Increment epoch as we're changing cipher specs
            this.epoch++;
            // Reset sequence number
            this.sequenceNumber = 0n;
        }
        return { handshakeComplete: false };
    }
    /**
     * Process an Alert message
     * @param fragment Message fragment
     * @returns Object with handshake status
     */
    processAlert(fragment) {
        if (fragment.length < 2) {
            throw new Error('Alert message too short');
        }
        const level = fragment[0];
        const description = fragment[1];
        // Fatal alert
        if (level === 2) {
            this.state = ConnectionState.ERROR;
        }
        return { handshakeComplete: false };
    }
    /**
     * Process a Handshake message
     * @param fragment Message fragment
     * @returns Object with handshake status
     */
    processHandshake(fragment) {
        if (fragment.length < 12) { // DTLS handshake header is 12 bytes
            throw new Error('Handshake message too short');
        }
        const msgType = fragment[0];
        const length = fragment.readUIntBE(1, 3);
        const messageSeq = fragment.readUInt16BE(4);
        const fragmentOffset = fragment.readUIntBE(6, 3);
        const fragmentLength = fragment.readUIntBE(9, 3);
        if (fragment.length < 12 + fragmentLength) {
            throw new Error('Handshake fragment truncated');
        }
        const handshakeData = fragment.slice(12, 12 + fragmentLength);
        // Store handshake message for later use in Finished calculation
        this.handshakeMessages.push(fragment.slice(0, 12 + fragmentLength));
        // Process based on message type
        switch (msgType) {
            case 1: // ClientHello
                return this.processClientHello(handshakeData);
            case 2: // ServerHello
                return this.processServerHello(handshakeData);
            case 11: // Certificate
                return this.processCertificate(handshakeData);
            case 12: // ServerKeyExchange
                return this.processServerKeyExchange(handshakeData);
            case 13: // CertificateRequest
                return this.processCertificateRequest(handshakeData);
            case 14: // ServerHelloDone
                return this.processServerHelloDone(handshakeData);
            case 15: // CertificateVerify
                return this.processCertificateVerify(handshakeData);
            case 16: // ClientKeyExchange
                return this.processClientKeyExchange(handshakeData);
            case 20: // Finished
                return this.processFinished(handshakeData);
            default:
                throw new Error(`Unknown handshake message type: ${msgType}`);
        }
    }
    /**
     * Process a ClientHello message
     * @param data Message data
     * @returns Object with handshake status
     */
    processClientHello(data) {
        // Implementation details would go here
        return { handshakeComplete: false };
    }
    /**
     * Process a ServerHello message
     * @param data Message data
     * @returns Object with handshake status
     */
    processServerHello(data) {
        // Implementation details would go here
        return { handshakeComplete: false };
    }
    /**
     * Process a Certificate message
     * @param data Message data
     * @returns Object with handshake status
     */
    processCertificate(data) {
        // Implementation details would go here
        return { handshakeComplete: false };
    }
    /**
     * Process a ServerKeyExchange message
     * @param data Message data
     * @returns Object with handshake status
     */
    processServerKeyExchange(data) {
        // Implementation details would go here
        return { handshakeComplete: false };
    }
    /**
     * Process a CertificateRequest message
     * @param data Message data
     * @returns Object with handshake status
     */
    processCertificateRequest(data) {
        // Implementation details would go here
        return { handshakeComplete: false };
    }
    /**
     * Process a ServerHelloDone message
     * @param data Message data
     * @returns Object with handshake status
     */
    processServerHelloDone(data) {
        // Implementation details would go here
        return { handshakeComplete: false };
    }
    /**
     * Process a CertificateVerify message
     * @param data Message data
     * @returns Object with handshake status
     */
    processCertificateVerify(data) {
        // Implementation details would go here
        return { handshakeComplete: false };
    }
    /**
     * Process a ClientKeyExchange message
     * @param data Message data
     * @returns Object with handshake status
     */
    processClientKeyExchange(data) {
        // Implementation details would go here
        return { handshakeComplete: false };
    }
    /**
     * Process a Finished message
     * @param data Message data
     * @returns Object with handshake status
     */
    processFinished(data) {
        // Implementation details would go here
        // If this is the final handshake message, mark the connection as complete
        this.state = ConnectionState.CONNECTED;
        return { handshakeComplete: true };
    }
    /**
     * Decrypt application data
     * @param data Encrypted data
     * @param epoch Epoch number
     * @param sequenceNumber Sequence number
     * @returns Decrypted data
     */
    decryptApplicationData(data, epoch, sequenceNumber) {
        // Implementation would depend on the negotiated cipher suite
        // For AES-GCM:
        // Get the appropriate key and IV based on whether we're the client or server
        const key = this.context.isServerContext()
            ? this.securityParameters.keyBlock?.clientWriteKey
            : this.securityParameters.keyBlock?.serverWriteKey;
        const baseIV = this.context.isServerContext()
            ? this.securityParameters.keyBlock?.clientWriteIV
            : this.securityParameters.keyBlock?.serverWriteIV;
        if (!key || !baseIV) {
            throw new Error('Keys not established');
        }
        // Construct the nonce (IV)
        const nonce = Buffer.alloc(12);
        baseIV.copy(nonce, 0);
        // XOR the last 8 bytes with the sequence number
        for (let i = 0; i < 8; i++) {
            nonce[4 + i] ^= Number((sequenceNumber >> BigInt(8 * (7 - i))) & BigInt(0xff));
        }
        // Construct the additional authenticated data (AAD)
        const aad = Buffer.alloc(13);
        aad[0] = 23; // Application data content type
        aad.writeUInt16BE(0xfefd, 1); // DTLS 1.2 version
        aad.writeUInt16BE(epoch, 3);
        // Write the 48-bit sequence number
        for (let i = 0; i < 6; i++) {
            aad[5 + i] = Number((sequenceNumber >> BigInt(8 * (5 - i))) & BigInt(0xff));
        }
        // Length of the encrypted data
        aad.writeUInt16BE(data.length, 11);
        // Decrypt using AES-GCM
        const decipher = crypto.createDecipheriv('aes-128-gcm', key, nonce);
        decipher.setAAD(aad);
        decipher.setAuthTag(data.slice(data.length - 16)); // Last 16 bytes are the auth tag
        const decrypted = decipher.update(data.slice(0, data.length - 16));
        decipher.final(); // Verify the auth tag
        return decrypted;
    }
    /**
     * Send application data
     * @param data Data to send
     * @returns Encrypted record
     */
    sendApplicationData(data) {
        // Update last activity timestamp
        this.lastActivity = Date.now();
        // Get the appropriate key and IV based on whether we're the client or server
        const key = this.context.isServerContext()
            ? this.securityParameters.keyBlock?.serverWriteKey
            : this.securityParameters.keyBlock?.clientWriteKey;
        const baseIV = this.context.isServerContext()
            ? this.securityParameters.keyBlock?.serverWriteIV
            : this.securityParameters.keyBlock?.clientWriteIV;
        if (!key || !baseIV) {
            throw new Error('Keys not established');
        }
        // Construct the nonce (IV)
        const nonce = Buffer.alloc(12);
        baseIV.copy(nonce, 0);
        // XOR the last 8 bytes with the sequence number
        for (let i = 0; i < 8; i++) {
            nonce[4 + i] ^= Number((this.sequenceNumber >> BigInt(8 * (7 - i))) & BigInt(0xff));
        }
        // Construct the additional authenticated data (AAD)
        const aad = Buffer.alloc(13);
        aad[0] = 23; // Application data content type
        aad.writeUInt16BE(0xfefd, 1); // DTLS 1.2 version
        aad.writeUInt16BE(this.epoch, 3);
        // Write the 48-bit sequence number
        for (let i = 0; i < 6; i++) {
            aad[5 + i] = Number((this.sequenceNumber >> BigInt(8 * (5 - i))) & BigInt(0xff));
        }
        // Length will be filled in after encryption
        // Encrypt using AES-GCM
        const cipher = crypto.createCipheriv('aes-128-gcm', key, nonce);
        cipher.setAAD(aad);
        const encrypted = Buffer.concat([
            cipher.update(data),
            cipher.final()
        ]);
        const authTag = cipher.getAuthTag();
        // Update the length in the AAD
        aad.writeUInt16BE(encrypted.length + authTag.length, 11);
        // Construct the DTLS record
        const record = Buffer.alloc(13 + encrypted.length + authTag.length);
        record[0] = 23; // Application data content type
        record.writeUInt16BE(0xfefd, 1); // DTLS 1.2 version
        record.writeUInt16BE(this.epoch, 3);
        // Write the 48-bit sequence number
        for (let i = 0; i < 6; i++) {
            record[5 + i] = Number((this.sequenceNumber >> BigInt(8 * (5 - i))) & BigInt(0xff));
        }
        // Write the length
        record.writeUInt16BE(encrypted.length + authTag.length, 11);
        // Copy the encrypted data and auth tag
        encrypted.copy(record, 13);
        authTag.copy(record, 13 + encrypted.length);
        // Increment the sequence number
        this.sequenceNumber++;
        return record;
    }
    /**
     * Get the current connection state
     * @returns The connection state
     */
    getState() {
        return this.state;
    }
    /**
     * Get the peer address
     * @returns The peer address or undefined if not connected
     */
    getPeerAddress() {
        return this.peerAddress;
    }
    /**
     * Get the peer port
     * @returns The peer port or undefined if not connected
     */
    getPeerPort() {
        return this.peerPort;
    }
    /**
     * Clean up resources
     */
    cleanup() {
        // Clear any rekey interval
        if (this.rekeyInterval) {
            clearInterval(this.rekeyInterval);
            this.rekeyInterval = undefined;
        }
    }
    /**
     * Free this session
     * This removes it from the static map and cleans up resources
     */
    free() {
        this.cleanup();
        DTLSSession.sessions.delete(this.id);
    }
}
exports.DTLSSession = DTLSSession;
DTLSSession.nextId = 1;
DTLSSession.sessions = new Map();
//# sourceMappingURL=DTLSSession.js.map