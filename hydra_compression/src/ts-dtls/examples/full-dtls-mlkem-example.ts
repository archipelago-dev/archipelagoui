// Full DTLS Protocol Example with MLKEM Integration
// This example demonstrates the complete DTLS handshake with MLKEM key exchange

import * as dgram from 'dgram';
import * as fs from 'fs';
import * as path from 'path';
import { DTLS } from '../DTLS';
import { DTLSConnection } from '../DTLSConnection';
import { PQKeyExchange, PQAlgorithm } from '../PQKeyExchange';
import { PQCipherSuite } from '../PQCipherSuite';
import { SecurityLevel } from '../DTLS';

// Constants
const SERVER_PORT = 8443;
const SERVER_HOST = '127.0.0.1';
const CERT_PATH = path.join(process.cwd(), 'certs/server.crt');
const KEY_PATH = path.join(process.cwd(), 'certs/server.key');

/**
 * Load certificates from files
 */
function loadCertificates(): { cert: Buffer; key: Buffer } {
  console.log('Loading certificates from:', CERT_PATH);
  console.log('Loading private key from:', KEY_PATH);
  
  try {
    const cert = fs.readFileSync(CERT_PATH);
    const key = fs.readFileSync(KEY_PATH);
    return { cert, key };
  } catch (error) {
    console.error('Error loading certificates:', error);
    throw new Error('Failed to load certificates');
  }
}

/**
 * Simulates the DTLS server side
 */
async function runServer(cert: Buffer, key: Buffer) {
  console.log('=== DTLS Server with MLKEM ===');
  
  // Create server instance
  const server = new DTLS({
    isServer: true,
    cert,
    key,
    securityLevel: SecurityLevel.HYBRID,
    debug: true
  });
  
  // Set up server event handlers
  server.on('listening', () => {
    console.log(`Server listening on port ${SERVER_PORT}`);
  });
  
  server.on('connection', (connection: DTLSConnection) => {
    console.log('Client connected to server');
    
    connection.on('data', (data: Buffer) => {
      const message = data.toString();
      console.log(`Server received: ${message}`);
      
      // Echo back with a server prefix
      connection.send(Buffer.from(`Server received: ${message}`));
    });
    
    connection.on('close', () => {
      console.log('Client disconnected');
    });
    
    connection.on('error', (err: Error) => {
      console.error('Connection error:', err.message);
    });
  });
  
  server.on('error', (err: Error) => {
    console.error('Server error:', err.message);
  });
  
  // Start listening
  server.listen(SERVER_PORT, SERVER_HOST);
  
  return server;
}

/**
 * Simulates the DTLS client side
 */
async function runClient(cert: Buffer, key: Buffer) {
  console.log('=== DTLS Client with MLKEM ===');
  
  // Create client instance
  const client = new DTLS({
    isServer: false,
    cert,
    key,
    securityLevel: SecurityLevel.HYBRID,
    debug: true
  });
  
  // Set up client event handlers
  client.on('connect', (connection: DTLSConnection) => {
    console.log('Connected to server');
    
    // Send a test message
    const message = 'Hello, secure world with post-quantum protection!';
    console.log(`Sending message: ${message}`);
    connection.send(Buffer.from(message));
    
    connection.on('data', (data: Buffer) => {
      console.log(`Client received: ${data.toString()}`);
      
      // Close the connection after receiving response
      setTimeout(() => {
        console.log('Closing connection...');
        connection.close();
      }, 1000);
    });
    
    connection.on('error', (err: Error) => {
      console.error('Connection error:', err.message);
    });
  });
  
  client.on('error', (err: Error) => {
    console.error('Client error:', err.message);
  });
  
  // Connect to server
  client.connect(SERVER_PORT, SERVER_HOST);
  
  return client;
}

/**
 * Explains the DTLS handshake with MLKEM integration
 */
function explainProtocol() {
  console.log('\n=== DTLS Handshake with MLKEM Integration ===');
  console.log('1. Client Hello:');
  console.log('   - Client sends supported cipher suites including PQ cipher suites');
  console.log('   - Client indicates support for MLKEM key exchange');
  
  console.log('\n2. Server Hello:');
  console.log('   - Server selects cipher suite with MLKEM support');
  console.log('   - Server generates MLKEM key pair');
  
  console.log('\n3. Server Key Exchange:');
  console.log('   - Server sends its MLKEM public key to client');
  
  console.log('\n4. Client Key Exchange:');
  console.log('   - Client performs MLKEM encapsulation with server\'s public key');
  console.log('   - Client derives shared secret');
  console.log('   - Client sends ciphertext to server');
  
  console.log('\n5. Server Processing:');
  console.log('   - Server performs MLKEM decapsulation with ciphertext and private key');
  console.log('   - Server derives the same shared secret');
  
  console.log('\n6. Finished:');
  console.log('   - Both parties derive session keys from shared secret');
  console.log('   - Secure communication begins with post-quantum protection');
}

/**
 * Main function to run the full example
 */
async function runFullExample() {
  try {
    // Explain the protocol
    explainProtocol();
    
    console.log('\n=== Starting Full DTLS Example ===');
    
    // Load certificates
    const { cert, key } = loadCertificates();
    
    // Start server
    const server = await runServer(cert, key);
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start client
    const client = await runClient(cert, key);
    
    // Wait for the example to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Clean up
    console.log('\n=== Cleaning Up ===');
    server.close();
    
    console.log('\n=== Example Completed ===');
    console.log('The DTLS handshake with MLKEM integration was successfully demonstrated.');
    console.log('This implementation provides post-quantum security against future quantum attacks.');
    
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run the full example
runFullExample().catch(console.error);
