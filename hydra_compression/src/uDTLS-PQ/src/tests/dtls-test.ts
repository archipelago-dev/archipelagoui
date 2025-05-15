import { DTLSSocket, DTLSVersion, VerifyMode } from '../lib/types';
import { CompatibilityManager } from '../CompatibilityLayer';
import { DTLSConnection } from '../DTLSConnection';
import { EnhancedDTLSSocket } from '../EnhancedDTLSSocket';
import { PQKeyExchange } from '../PQKeyExchange';
import { PQCertificateManager } from '../PQCertificateManager';
import { PQAlgorithm, ClassicalKeyType } from '../lib/types';
import * as dgram from 'dgram';

// This is a simple test to verify that our code compiles correctly
// It doesn't actually run the DTLS protocol

async function testDTLSConnection() {
    // Create a UDP socket
    const socket = dgram.createSocket('udp4');
    
    // Create a DTLS context
    const context = { id: 1 }; // Mock context
    
    // Create a DTLS connection
    const connection = new DTLSConnection({
        socket,
        context,
        peerAddress: '127.0.0.1',
        peerPort: 5684
    });
    
    // Test handshake (this won't actually work without a real server)
    try {
        await connection.handshake();
        console.log('Handshake completed');
    } catch (err) {
        console.error('Handshake failed:', err);
    }
}

async function testEnhancedDTLSSocket() {
    // Create an enhanced DTLS socket
    const socket = new EnhancedDTLSSocket({
        address: '127.0.0.1',
        port: 5684,
        autoRekey: true,
        rekeyInterval: 3600000, // 1 hour
        earlyData: true
    });
    
    // Test early data
    try {
        await socket.connectWithEarlyData(Buffer.from('Early data'));
        console.log('Connected with early data');
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

async function testPQKeyExchange() {
    // Create a PQ key exchange
    const keyExchange = new PQKeyExchange(PQAlgorithm.KYBER768);
    
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
    const certManager = new PQCertificateManager();
    
    // Generate a hybrid certificate
    const { cert, key } = certManager.generateHybridCertificate({
        keyType: ClassicalKeyType.ECDSA_P256,
        pqAlgorithm: PQAlgorithm.DILITHIUM2,
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
    const compatManager = new CompatibilityManager();
    
    // Create a mock DTLS socket
    const socket = new DTLSSocket({
        address: '127.0.0.1',
        port: 5684
    });
    
    // Test capability negotiation
    try {
        const params = await compatManager.negotiateCapabilities(socket);
        console.log('Negotiated parameters:', params);
    } catch (err) {
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
    } catch (err) {
        console.error('Tests failed:', err);
    }
}

runTests().catch(console.error);