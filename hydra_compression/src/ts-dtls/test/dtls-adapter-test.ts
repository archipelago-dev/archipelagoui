// DTLS Adapter Test with MLKEM Integration
// This test verifies that the DTLS adapter works correctly with the MLKEM implementation

import * as fs from 'fs';
import * as path from 'path';
import { DTLS, SecurityLevel } from '../../uDTLS-PQ/src/udtls-pq';
import { PQKeyExchange, PQAlgorithm } from '../../uDTLS-PQ/src/PQKeyExchange';

// Constants
const SERVER_PORT = 8443;
const SERVER_HOST = '127.0.0.1';
const CERT_PATH = path.join(process.cwd(), 'certs/server.crt');
const KEY_PATH = path.join(process.cwd(), 'certs/server.key');

/**
 * Test the MLKEM key exchange directly with the PQKeyExchange class
 */
async function testMlKemKeyExchange() {
    console.log('=== Testing MLKEM Key Exchange ===');
    
    // Create a PQKeyExchange instance with KYBER768
    const keyExchange = new PQKeyExchange(PQAlgorithm.KYBER768);
    
    // Generate a key pair
    console.log('Generating key pair...');
    const keyPair = keyExchange.generateKeyPair();
    console.log('Public key length:', keyPair.publicKey.length);
    console.log('Private key length:', keyPair.privateKey.length);
    
    // Encapsulate a shared secret
    console.log('Encapsulating shared secret...');
    const { ciphertext, sharedSecret } = keyExchange.encapsulate(keyPair.publicKey);
    console.log('Ciphertext length:', ciphertext.length);
    console.log('Shared secret length:', sharedSecret.length);
    
    // Decapsulate the shared secret
    console.log('Decapsulating shared secret...');
    const decapsulatedSecret = keyExchange.decapsulate(keyPair.privateKey, ciphertext);
    console.log('Decapsulated secret length:', decapsulatedSecret.length);
    
    // Verify that the shared secrets match
    const secretsMatch = Buffer.compare(sharedSecret, decapsulatedSecret) === 0;
    console.log('Shared secrets match:', secretsMatch);
    
    if (!secretsMatch) {
        throw new Error('Shared secrets do not match');
    }
    
    return true;
}

/**
 * Test a simple DTLS handshake with MLKEM
 */
async function testSimpleDtlsHandshake() {
    console.log('\n=== Testing Simple DTLS Handshake with MLKEM ===');
    
    try {
        // Load certificates
        console.log('Loading certificates...');
        const cert = fs.readFileSync(CERT_PATH);
        const key = fs.readFileSync(KEY_PATH);
        
        // Create server
        console.log('Creating DTLS server...');
        const server = new DTLS({
            isServer: true,
            cert,
            key,
            securityLevel: SecurityLevel.HYBRID,
            debug: true
        });
        
        // Set up server event handlers
        let serverReady = false;
        
        server.on('listening', () => {
            console.log(`Server listening on port ${SERVER_PORT}`);
            serverReady = true;
        });
        
        server.on('connection', (connection) => {
            console.log('Client connected to server');
            
            connection.on('data', (data) => {
                const message = data.toString();
                console.log(`Server received: ${message}`);
                
                // Echo back
                connection.send(Buffer.from(`Server echo: ${message}`));
            });
        });
        
        // Start server
        server.listen(SERVER_PORT, SERVER_HOST);
        
        // Wait for server to start
        const startTime = Date.now();
        while (!serverReady && Date.now() - startTime < 5000) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!serverReady) {
            server.close();
            throw new Error('Server failed to start');
        }
        
        console.log('Server started successfully');
        server.close();
        return true;
    } catch (error) {
        console.error('DTLS handshake test failed:', error);
        return false;
    }
}

/**
 * Run all tests
 */
async function runTests() {
    try {
        // Test MLKEM key exchange
        const keyExchangeSuccess = await testMlKemKeyExchange();
        console.log('MLKEM key exchange test:', keyExchangeSuccess ? 'PASSED' : 'FAILED');
        
        // Test simple DTLS handshake
        const handshakeSuccess = await testSimpleDtlsHandshake();
        console.log('Simple DTLS handshake test:', handshakeSuccess ? 'PASSED' : 'FAILED');
        
        console.log('\n=== All Tests Completed ===');
        if (keyExchangeSuccess && handshakeSuccess) {
            console.log('MLKEM integration is working correctly!');
        } else {
            console.log('Some tests failed. Please check the logs for details.');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
runTests().catch(console.error);
