// MLKEM DTLS Integration Test
// This test verifies that our MLKEM implementation works correctly with the DTLS adapter

import * as fs from 'fs';
import * as path from 'path';
import * as dgram from 'dgram';
import { DTLS } from '../DTLS';
import { DTLSConnection } from '../DTLSConnection';
import { PQKeyExchange, PQAlgorithm } from '../PQKeyExchange';
import { SecurityLevel } from '../DTLS';

// Constants
const SERVER_PORT = 8443;
const SERVER_HOST = '127.0.0.1';
const CERT_PATH = path.join(process.cwd(), 'certs/server.crt');
const KEY_PATH = path.join(process.cwd(), 'certs/server.key');
const DEBUG = true;

/**
 * Debug logger
 */
function log(...args: any[]) {
    if (DEBUG) {
        console.log(`[${new Date().toISOString()}]`, ...args);
    }
}

/**
 * Test the MLKEM key exchange directly
 */
async function testMlKemKeyExchange() {
    log('=== Testing MLKEM Key Exchange ===');
    
    // Create a PQKeyExchange instance with MLKEM768
    const keyExchange = new PQKeyExchange(PQAlgorithm.MLKEM768);
    
    // Generate a key pair
    log('Generating key pair...');
    const keyPair = await keyExchange.generateKeyPair();
    log('Public key length:', keyPair.publicKey.length);
    log('Private key length:', keyPair.privateKey.length);
    
    // Encapsulate a shared secret
    log('Encapsulating shared secret...');
    const { ciphertext, sharedSecret } = await keyExchange.encapsulate(keyPair.publicKey);
    log('Ciphertext length:', ciphertext.length);
    log('Shared secret length:', sharedSecret.length);
    
    // Decapsulate the shared secret
    log('Decapsulating shared secret...');
    const decapsulatedSecret = await keyExchange.decapsulate(ciphertext, keyPair.privateKey);
    log('Decapsulated secret length:', decapsulatedSecret.length);
    
    // Verify that the shared secrets match
    const secretsMatch = Buffer.compare(sharedSecret, decapsulatedSecret) === 0;
    log('Shared secrets match:', secretsMatch);
    
    if (!secretsMatch) {
        throw new Error('Shared secrets do not match');
    }
    
    return true;
}

/**
 * Test a simple DTLS handshake with MLKEM
 */
async function testSimpleDtlsHandshake() {
    log('\n=== Testing Simple DTLS Handshake with MLKEM ===');
    
    try {
        // Load certificates
        log('Loading certificates...');
        const cert = fs.readFileSync(CERT_PATH);
        const key = fs.readFileSync(KEY_PATH);
        
        log('Certificate length:', cert.length);
        log('Key length:', key.length);
        
        // Create server
        log('Creating DTLS server...');
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
            log(`Server listening on port ${SERVER_PORT}`);
            serverReady = true;
        });
        
        server.on('error', (err) => {
            log('Server error:', err.message);
        });
        
        server.on('connection', (connection: DTLSConnection) => {
            log('Client connected to server');
            
            connection.on('data', (data: Buffer) => {
                const message = data.toString();
                log(`Server received: ${message}`);
                
                // Echo back
                connection.send(Buffer.from(`Server echo: ${message}`));
            });
            
            connection.on('error', (err) => {
                log('Server connection error:', err.message);
            });
        });
        
        // Start server
        log('Starting server...');
        server.listen(SERVER_PORT, SERVER_HOST);
        
        // Wait for server to start
        const startTime = Date.now();
        while (!serverReady && Date.now() - startTime < 5000) {
            await new Promise(resolve => setTimeout(resolve, 100));
            log('Waiting for server to start...');
        }
        
        if (!serverReady) {
            server.close();
            throw new Error('Server failed to start');
        }
        
        // Create client
        log('Creating DTLS client...');
        const client = new DTLS({
            isServer: false,
            cert,
            key,
            securityLevel: SecurityLevel.HYBRID,
            debug: true
        });
        
        // Set up client event handlers
        let handshakeCompleted = false;
        
        client.on('error', (err) => {
            log('Client error:', err.message);
        });
        
        client.on('connect', (connection: DTLSConnection) => {
            log('Client connected to server');
            handshakeCompleted = true;
            
            // Send test message
            const message = 'Hello from MLKEM client!';
            log(`Sending message: ${message}`);
            connection.send(Buffer.from(message));
            
            connection.on('data', (data: Buffer) => {
                log(`Client received: ${data.toString()}`);
                
                // Close connection after receiving response
                setTimeout(() => {
                    log('Closing connection...');
                    connection.close();
                    server.close();
                }, 1000);
            });
            
            connection.on('error', (err) => {
                log('Client connection error:', err.message);
            });
        });
        
        // Connect to server
        log('Connecting client to server...');
        client.connect(SERVER_PORT, SERVER_HOST);
        
        // Wait for handshake to complete or timeout
        const timeout = 10000; // Increase timeout to 10 seconds
        const clientStartTime = Date.now();
        
        while (!handshakeCompleted && Date.now() - clientStartTime < timeout) {
            await new Promise(resolve => setTimeout(resolve, 500));
            log('Waiting for handshake to complete... Elapsed:', Date.now() - clientStartTime, 'ms');
        }
        
        if (!handshakeCompleted) {
            log('Handshake timed out after', timeout, 'ms');
            server.close();
            throw new Error('DTLS handshake timed out');
        }
        
        // Wait for the test to complete
        log('Handshake completed, waiting for test to finish...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        return handshakeCompleted;
    } catch (error) {
        log('DTLS handshake test failed:', error);
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
        log('MLKEM key exchange test:', keyExchangeSuccess ? 'PASSED' : 'FAILED');
        
        // Test simple DTLS handshake
        const handshakeSuccess = await testSimpleDtlsHandshake();
        log('Simple DTLS handshake test:', handshakeSuccess ? 'PASSED' : 'FAILED');
        
        log('\n=== All Tests Completed ===');
        if (keyExchangeSuccess && handshakeSuccess) {
            log('MLKEM integration is working correctly!');
        } else {
            log('Some tests failed. Please check the logs for details.');
        }
        
    } catch (error) {
        log('Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
runTests().catch(console.error);
