"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DTLSConnection = void 0;
const events_1 = require("events");
const types_1 = require("./lib/types");
const bindings_1 = require("./lib/bindings");
class DTLSConnection extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.state = types_1.ConnectionState.HANDSHAKE;
        this.handshakeBuffer = [];
        this.sequenceNumber = 0n;
        this.socket = options.socket;
        this.context = options.context;
        this.peerAddress = options.peerAddress;
        this.peerPort = options.peerPort;
        this.nativeBinding = bindings_1.nativeBindings;
    }
    async handshake() {
        // Implement DTLS handshake with timeout and retransmission logic
        const clientHello = this.createClientHello();
        await this.sendDTLSPacket(clientHello);
        // Process handshake messages until complete
        return new Promise((resolve, reject) => {
            this.on('handshakeComplete', () => resolve());
            this.on('handshakeError', (err) => reject(err));
        });
    }
    send(data) {
        // Fragment data if needed
        const fragments = this.fragmentData(data);
        // Encrypt and send each fragment
        return Promise.all(fragments.map((fragment) => {
            const encryptedRecord = this.encryptRecord(fragment);
            return this.sendDTLSPacket(encryptedRecord);
        })).then(() => void 0);
    }
    encryptRecord(plaintext) {
        // Use AES-GCM for encryption
        const nonce = this.constructNonce();
        const aad = this.constructAAD();
        return this.nativeBinding.aesGcmSeal(Buffer.alloc(32), // Key should come from the session
        nonce, plaintext, aad).ciphertext;
    }
    createClientHello() {
        // Create a DTLS ClientHello message
        // This is a simplified implementation
        const header = Buffer.from([
            0x01,
            0x00, 0x00, 0x00,
            0x00, 0x00,
            0x00, 0x00, 0x00,
            0x00, 0x00, 0x00 // fragment length (will be filled later)
        ]);
        // In a real implementation, this would include protocol version,
        // random data, session ID, cipher suites, etc.
        const body = Buffer.alloc(32); // Simplified for this example
        // Update length fields
        const length = body.length;
        header[1] = (length >> 16) & 0xFF;
        header[2] = (length >> 8) & 0xFF;
        header[3] = length & 0xFF;
        header[9] = (length >> 16) & 0xFF;
        header[10] = (length >> 8) & 0xFF;
        header[11] = length & 0xFF;
        return Buffer.concat([header, body]);
    }
    async sendDTLSPacket(packet) {
        return new Promise((resolve, reject) => {
            this.socket.send(packet, this.peerPort, this.peerAddress, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    fragmentData(data) {
        // Simple implementation that doesn't actually fragment
        // In a real implementation, this would split data into MTU-sized chunks
        return [data];
    }
    constructNonce() {
        // In DTLS, the nonce is typically constructed from:
        // - The "salt" from the key block
        // - The 64-bit sequence number
        const salt = Buffer.alloc(4); // Should come from key block
        const seqNum = Buffer.alloc(8);
        seqNum.writeBigUInt64BE(this.sequenceNumber);
        return Buffer.concat([salt, seqNum]);
    }
    constructAAD() {
        // Additional Authenticated Data for AEAD ciphers
        // Typically includes record header information
        return Buffer.alloc(13); // Simplified for this example
    }
}
exports.DTLSConnection = DTLSConnection;
//# sourceMappingURL=DTLSConnection.js.map