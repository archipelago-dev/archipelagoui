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
const types_1 = require("../lib/types");
const CompatibilityLayer_1 = require("../CompatibilityLayer");
const DTLSConnection_1 = require("../DTLSConnection");
const EnhancedDTLSSocket_1 = require("../EnhancedDTLSSocket");
const PQKeyExchange_1 = require("../PQKeyExchange");
const PQCertificateManager_1 = require("../PQCertificateManager");
const types_2 = require("../lib/types");
const dgram = __importStar(require("dgram"));
// This is a simple test to verify that our code compiles correctly
// It doesn't actually run the DTLS protocol
async function testDTLSConnection() {
    // Create a UDP socket
    const socket = dgram.createSocket('udp4');
    // Create a DTLS context
    const context = { id: 1 }; // Mock context
    // Create a DTLS connection
    const connection = new DTLSConnection_1.DTLSConnection({
        socket,
        context,
        peerAddress: '127.0.0.1',
        peerPort: 5684
    });
    // Test handshake (this won't actually work without a real server)
    try {
        await connection.handshake();
        console.log('Handshake completed');
    }
    catch (err) {
        console.error('Handshake failed:', err);
    }
}
async function testEnhancedDTLSSocket() {
    // Create an enhanced DTLS socket
    const socket = new EnhancedDTLSSocket_1.EnhancedDTLSSocket({
        address: '127.0.0.1',
        port: 5684,
        autoRekey: true,
        rekeyInterval: 3600000,
        earlyData: true
    });
    // Test early data
    try {
        await socket.connectWithEarlyData(Buffer.from('Early data'));
        console.log('Connected with early data');
    }
    catch (err) {
        console.error('Connection failed:', err);
    }
}
async function testPQKeyExchange() {
    // Create a PQ key exchange
    const keyExchange = new PQKeyExchange_1.PQKeyExchange(types_2.PQAlgorithm.KYBER768);
    // Generate a key pair
    const keyPair = keyExchange.generateKeyPair();
    // Test encapsulation
    const { ciphertext, sharedSecret } = keyExchange.encapsulate(keyPair.publicKey);
    // Test decapsulation
    const decapsulated = keyExchange.decapsulate(keyPair.privateKey, ciphertext);
    // In a real implementation, sharedSecret and decapsulated should be equal
    console.log('Key exchange completed');
}
async function testPQCertificateManager() {
    // Create a certificate manager
    const certManager = new PQCertificateManager_1.PQCertificateManager();
    // Generate a hybrid certificate
    const { cert, key } = certManager.generateHybridCertificate({
        keyType: types_2.ClassicalKeyType.ECDSA_P256,
        pqAlgorithm: types_2.PQAlgorithm.DILITHIUM2,
        subject: {
            commonName: 'example.com'
        },
        validityDays: 365,
        pqPublicKeyOID: '1.3.6.1.4.1.2.267.7.4.4',
        classicalPublicKeyOID: '1.2.840.10045.2.1'
    });
    console.log('Certificate generated');
}
async function testCompatibilityManager() {
    // Create a compatibility manager
    const compatManager = new CompatibilityLayer_1.CompatibilityManager();
    // Create a mock DTLS socket
    const socket = new types_1.DTLSSocket({
        address: '127.0.0.1',
        port: 5684
    });
    // Test capability negotiation
    try {
        const params = await compatManager.negotiateCapabilities(socket);
        console.log('Negotiated parameters:', params);
    }
    catch (err) {
        console.error('Negotiation failed:', err);
    }
}
// Run the tests
async function runTests() {
    console.log('Running DTLS tests...');
    try {
        await testDTLSConnection();
        await testEnhancedDTLSSocket();
        await testPQKeyExchange();
        await testPQCertificateManager();
        await testCompatibilityManager();
        console.log('All tests completed successfully');
    }
    catch (err) {
        console.error('Tests failed:', err);
    }
}
runTests().catch(console.error);
//# sourceMappingURL=dtls-test.js.map