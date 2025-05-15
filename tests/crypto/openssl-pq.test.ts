import { existsSync } from 'fs';
import { join } from 'path';

describe('OpenSSL PQ Native Module', () => {
  // Path to the compiled native module
  const modulePath = join(__dirname, '../../hydra_compression/src/uDTLS-PQ/build/Release/openssl_pq.node');
  
  test('Native module file exists', () => {
    // First, check if the compiled module exists
    expect(existsSync(modulePath)).toBe(true);
  });
  
  test('Native module can be loaded', () => {
    // Try to load the module
    let opensslPQ;
    expect(() => {
      opensslPQ = require(modulePath);
    }).not.toThrow();
    
    // Check that the module is an object
    expect(typeof opensslPQ).toBe('object');
  });
  
  test('Native module exports expected functions', () => {
    const opensslPQ = require(modulePath);
    
    // Check for expected functions from openssl.cpp
    expect(typeof opensslPQ.createContext).toBe('function');
    expect(typeof opensslPQ.getVersion).toBe('function');
    
    // Check for expected functions from pq_crypto.cpp
    expect(typeof opensslPQ.generateKyberKeyPair).toBe('function');
    expect(typeof opensslPQ.kyberEncapsulate).toBe('function');
    expect(typeof opensslPQ.kyberDecapsulate).toBe('function');
  });
  
  test('Can create a DTLS context', () => {
    const opensslPQ = require(modulePath);
    
    // Create a simple context (this might fail if certificates are required)
    let context;
    try {
      context = opensslPQ.createContext({ isServer: false });
      expect(context).toBeDefined();
    } catch (error) {
      // If it fails due to missing certificates, that's expected
      expect(error.message).toContain('certificate');
    }
  });
  
  test('Can get OpenSSL version', () => {
    const opensslPQ = require(modulePath);
    
    // Get OpenSSL version
    const version = opensslPQ.getVersion();
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });
  
  test('Can generate Kyber key pair', () => {
    const opensslPQ = require(modulePath);
    
    // Generate a Kyber key pair
    const keyPair = opensslPQ.generateKyberKeyPair('kyber768');
    expect(keyPair).toBeDefined();
    expect(keyPair.publicKey).toBeInstanceOf(Buffer);
    expect(keyPair.privateKey).toBeInstanceOf(Buffer);
  });
  
  test('Can perform Kyber encapsulation and decapsulation', () => {
    const opensslPQ = require(modulePath);
    
    // Generate a Kyber key pair
    const keyPair = opensslPQ.generateKyberKeyPair('kyber768');
    
    // Encapsulate a shared secret using the public key
    const encapsulation = opensslPQ.kyberEncapsulate(keyPair.publicKey, 'kyber768');
    expect(encapsulation).toBeDefined();
    expect(encapsulation.ciphertext).toBeInstanceOf(Buffer);
    expect(encapsulation.sharedSecret).toBeInstanceOf(Buffer);
    
    // Decapsulate the shared secret using the private key and ciphertext
    const decapsulation = opensslPQ.kyberDecapsulate(
      keyPair.privateKey, 
      encapsulation.ciphertext, 
      'kyber768'
    );
    expect(decapsulation).toBeInstanceOf(Buffer);
    
    // The decapsulated shared secret should match the encapsulated one
    expect(Buffer.compare(decapsulation, encapsulation.sharedSecret)).toBe(0);
  });
});
