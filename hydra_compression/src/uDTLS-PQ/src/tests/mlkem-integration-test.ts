// MLKEM Integration Test
// This test verifies that the MLKEM adapter works correctly with the uDTLS-PQ API

import { PQKeyExchange } from '../PQKeyExchange.js';
import { PQAlgorithm } from '../lib/types.js';
import { SecurityLevel, DTLS } from '../udtls-pq.js';
import * as dgram from 'dgram';
import * as fs from 'fs';
import * as path from 'path';

// Constants
const SERVER_PORT = 8443;
const SERVER_HOST = '127.0.0.1';
const CERT_PATH = path.join(process.cwd(), 'certs/server.crt');
const KEY_PATH = path.join(process.cwd(), 'certs/server.key');

/**
 * Test the MLKEM key exchange directly
 */
async function testMlKemKeyExchange() {
    console.log('=== Testing MLKEM Key Exchange ===');
    
    // Create a PQKeyExchange instance with KYBER768
    const keyExchange = new PQKeyExchange(PQAlgorithm.KYBER768);
    
    // Generate a key pair
    console.log('Generating key pair...');
    const keyPair = await keyExchange.generateKeyPair();
    console.log('Public key length:', keyPair.publicKey.length);
    console.log('Private key length:', keyPair.privateKey.length);
    
    // Encapsulate a shared secret
    console.log('Encapsulating shared secret...');
    const { ciphertext, sharedSecret } = await keyExchange.encapsulate(keyPair.publicKey);
    console.log('Ciphertext length:', ciphertext.length);
    console.log('Shared secret length:', sharedSecret.length);
    
    // Decapsulate the shared secret
    console.log('Decapsulating shared secret...');
    const decapsulatedSecret = await keyExchange.decapsulate(keyPair.privateKey, ciphertext);
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
 * Test the DTLS handshake with MLKEM
 */
async function testDtlsHandshake() {
    console.log('\n=== Testing DTLS Handshake with MLKEM ===');
    
    // Load certificates
    console.log('Loading certificates...');
    let cert, key;
    try {
        cert = fs.readFileSync(CERT_PATH);
        key = fs.readFileSync(KEY_PATH);
        console.log('Certificates loaded successfully');
    } catch (error) {
        console.error('Error loading certificates:', error);
        throw error;
    }
    
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
    server.on('error', (error) => {
        console.error('Server error:', error);
    });
    
    server.on('listening', () => {
        console.log(`Server listening on port ${SERVER_PORT}`);
    });
    
    server.on('connection', (connection) => {
        console.log('Client connected to server');
        
        connection.on('data', (data) => {
            const message = data.toString();
            console.log(`Server received: ${message}`);
            
            // Echo back
            connection.send(Buffer.from(`Server echo: ${message}`));
        });
        
        connection.on('error', (error) => {
            console.error('Server connection error:', error);
        });
    });
    
    // Start server
    server.listen(SERVER_PORT, SERVER_HOST);
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create client
    console.log('Creating DTLS client...');
    const client = new DTLS({
        isServer: false,
        cert,
        key,
        securityLevel: SecurityLevel.HYBRID,
        debug: true
    });
    
    // Set up client event handlers
    let handshakeCompleted = false;
    
    client.on('error', (error) => {
        console.error('Client error:', error);
    });
    
    client.on('connect', (connection) => {
        console.log('Client connected to server');
        handshakeCompleted = true;
        
        // Send test message
        const message = 'Hello from MLKEM client!';
        console.log(`Sending message: ${message}`);
        connection.send(Buffer.from(message));
        
        connection.on('data', (data) => {
            console.log(`Client received: ${data.toString()}`);
            
            // Close connection after receiving response
            setTimeout(() => {
                console.log('Closing connection...');
                connection.close();
                server.close();
            }, 1000);
        });
        
        connection.on('error', (error) => {
            console.error('Client connection error:', error);
        });
    });
    
    // Connect to server
    console.log('Client attempting to connect to server...');
    client.connect(SERVER_PORT, SERVER_HOST);
    
    // Wait for handshake to complete or timeout
    // Increased timeout to 10 seconds to allow for post-quantum key exchange
    const timeout = 10000; 
    const startTime = Date.now();
    
    while (!handshakeCompleted && Date.now() - startTime < timeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
        process.stdout.write('.');  // Show progress
    }
    
    console.log(''); // New line after progress dots
    
    if (!handshakeCompleted) {
        console.error('DTLS handshake timed out after', timeout, 'ms');
        server.close();
        throw new Error('DTLS handshake timed out');
    }
    
    // Wait for the test to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return handshakeCompleted;
}

/**
 * Run all tests
 */
async function runTests() {
    try {
        // Test MLKEM key exchange
        const keyExchangeSuccess = await testMlKemKeyExchange();
        console.log('MLKEM key exchange test:', keyExchangeSuccess ? 'PASSED' : 'FAILED');
        
        // Test DTLS handshake
        const handshakeSuccess = await testDtlsHandshake();
        console.log('DTLS handshake test:', handshakeSuccess ? 'PASSED' : 'FAILED');
        
        console.log('\n=== All Tests Completed ===');
        console.log('MLKEM integration is working correctly!');
        
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
runTests().catch(console.error);
