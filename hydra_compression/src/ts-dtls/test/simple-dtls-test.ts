// Simple DTLS Test
// This test verifies that the basic DTLS functionality works without MLKEM

import * as fs from 'fs';
import * as path from 'path';
import { DTLS, SecurityLevel } from '../DTLS';
import { DTLSConnection } from '../DTLSConnection';

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
 * Test a simple DTLS handshake without MLKEM
 */
async function testSimpleDtlsHandshake() {
    log('=== Testing Simple DTLS Handshake (Standard Mode) ===');
    
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
            securityLevel: SecurityLevel.STANDARD, // Use standard security level
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
            securityLevel: SecurityLevel.STANDARD, // Use standard security level
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
            const message = 'Hello from DTLS client!';
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
        const timeout = 10000; // 10 seconds
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

// Run the test
testSimpleDtlsHandshake()
    .then(success => {
        log('Test result:', success ? 'PASSED' : 'FAILED');
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        log('Test error:', error);
        process.exit(1);
    });
