"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompatibilityManager = void 0;
const PQCipherSuite_1 = require("./PQCipherSuite");
class CompatibilityManager {
    // Detect server capabilities during handshake
    async negotiateCapabilities(socket) {
        // Start with most secure options
        const clientHello = this.createClientHello({
            versions: ['DTLS 1.3', 'DTLS 1.2'],
            cipherSuites: [
                // PQ-hybrid suites
                PQCipherSuite_1.PQCipherSuite.KYBER_AES_GCM_SHA384,
                // Traditional suites
                'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
                'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
                // Fallback suites for broader compatibility
                'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
                'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256'
            ]
        });
        // Send hello and process server response
        const serverHello = await socket.sendClientHello(clientHello);
        // Check for downgrade attacks
        this.detectDowngrade(clientHello, serverHello);
        return this.parseServerCapabilities(serverHello);
    }
    // Create a ClientHello message with specified parameters
    createClientHello(options) {
        return {
            versions: options.versions,
            cipherSuites: options.cipherSuites,
            random: Buffer.alloc(32),
            sessionId: Buffer.alloc(32),
            compressionMethods: [0],
            extensions: {} // No extensions for now
        };
    }
    // Parse server capabilities from ServerHello
    parseServerCapabilities(serverHello) {
        const pqSupported = Object.values(PQCipherSuite_1.PQCipherSuite).includes(serverHello.cipherSuite);
        return {
            version: serverHello.version,
            cipherSuite: serverHello.cipherSuite,
            compressionMethod: serverHello.compressionMethod,
            extensions: serverHello.extensions || {},
            pqSupported
        };
    }
    // Protect against protocol downgrade attacks
    detectDowngrade(clientHello, serverHello) {
        if (clientHello.versions.includes('DTLS 1.3') &&
            serverHello.version === 'DTLS 1.2') {
            // Check downgrade protection token
            if (!this.verifyDowngradeToken(serverHello.random)) {
                throw new Error('Possible downgrade attack detected');
            }
        }
    }
    // Verify the downgrade protection token in the server random
    verifyDowngradeToken(random) {
        // In DTLS 1.3, the last 8 bytes of the server random should contain
        // a special value if the server supports DTLS 1.3 but is downgrading
        // to DTLS 1.2 at the client's request
        const downgradeSentinel = Buffer.from('444F574E47524400', 'hex'); // "DOWNGRD"
        const lastEightBytes = random.slice(random.length - 8);
        // If the last 8 bytes match the sentinel, this is a legitimate downgrade
        return !lastEightBytes.equals(downgradeSentinel);
    }
}
exports.CompatibilityManager = CompatibilityManager;
//# sourceMappingURL=CompatibilityLayer.js.map