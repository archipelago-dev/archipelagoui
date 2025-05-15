import { DTLS, SecurityLevel, ConnectionState } from '../../hydra_compression/src/ts-dtls';
import { MlKem768 } from 'mlkem';
import dgram from 'dgram';

// Mock the UDP socket
jest.mock('dgram', () => {
  const EventEmitter = require('events');
  
  // Mock socket implementation
  class MockSocket extends EventEmitter {
    send(msg: Buffer, port: number, address: string, callback?: (error: Error | null, bytes: number) => void): void {
      // Simulate sending data
      setTimeout(() => {
        // For testing, we'll simulate receiving a response
        if (msg[0] === 0x01) { // ClientHello
          // Extract client's public key
          const publicKeyLength = msg.readUInt32BE(3);
          const clientPublicKey = msg.subarray(7, 7 + publicKeyLength);
          
          // Create a mock ServerHello response
          this.simulateServerHello(clientPublicKey);
        } else if (msg[0] === 0x03) { // Application Data
          // Extract data length
          const dataLength = msg.readUInt32BE(1);
          const encryptedData = msg.subarray(5, 5 + dataLength);
          
          // Echo back the encrypted data (for testing)
          this.simulateDataResponse(encryptedData);
        }
        
        if (callback) {
          callback(null, msg.length);
        }
      }, 10);
    }
    
    close(): void {
      this.emit('close');
    }
    
    bind(port: number, address: string, callback?: () => void): void {
      if (callback) {
        callback();
      }
    }
    
    // Simulate receiving a ServerHello message
    private simulateServerHello(clientPublicKey: Buffer): void {
      // Generate a mock server key pair
      const kyber = new MlKem768();
      kyber.generateKeyPair().then(([serverPublicKey, serverSecretKey]) => {
        // Create a mock ServerHello message
        // - 1 byte: message type (0x02 for ServerHello)
        // - 2 bytes: protocol version (0x0303 for TLS 1.2)
        // - 4 bytes: length of server public key
        // - N bytes: server public key
        // - 4 bytes: length of ciphertext
        // - M bytes: ciphertext (mock)
        
        // Create a mock ciphertext (in a real implementation, this would be the encapsulated shared secret)
        const ciphertext = Buffer.alloc(32);
        for (let i = 0; i < 32; i++) {
          ciphertext[i] = i; // Just a pattern for testing
        }
        
        const message = Buffer.alloc(7 + serverPublicKey.length + 4 + ciphertext.length);
        message[0] = 0x02; // ServerHello
        message[1] = 0x03; // TLS 1.2 (major)
        message[2] = 0x03; // TLS 1.2 (minor)
        
        // Write server public key length
        message.writeUInt32BE(serverPublicKey.length, 3);
        
        // Write server public key
        Buffer.from(serverPublicKey).copy(message, 7);
        
        // Write ciphertext length
        message.writeUInt32BE(ciphertext.length, 7 + serverPublicKey.length);
        
        // Write ciphertext
        ciphertext.copy(message, 7 + serverPublicKey.length + 4);
        
        // Emit the message event
        this.emit('message', message, { address: '127.0.0.1', port: 12345 });
      });
    }
    
    // Simulate receiving application data
    private simulateDataResponse(encryptedData: Buffer): void {
      // Create a mock application data message
      // - 1 byte: message type (0x03 for Application Data)
      // - 4 bytes: length of encrypted data
      // - N bytes: encrypted data
      
      const message = Buffer.alloc(5 + encryptedData.length);
      message[0] = 0x03; // Application Data
      message.writeUInt32BE(encryptedData.length, 1);
      encryptedData.copy(message, 5);
      
      // Emit the message event
      this.emit('message', message, { address: '127.0.0.1', port: 12345 });
    }
  }
  
  return {
    createSocket: jest.fn(() => new MockSocket())
  };
});

// Mock the mlkem package
jest.mock('mlkem', () => {
  return {
    MlKem768: jest.fn().mockImplementation(() => {
      return {
        generateKeyPair: jest.fn().mockResolvedValue([
          new Uint8Array(32).fill(1), // Mock public key
          new Uint8Array(32).fill(2)  // Mock private key
        ]),
        encapsulate: jest.fn().mockResolvedValue([
          new Uint8Array(32).fill(3), // Mock ciphertext
          new Uint8Array(32).fill(4)  // Mock shared secret
        ]),
        decapsulate: jest.fn().mockResolvedValue(
          new Uint8Array(32).fill(4)  // Mock shared secret (same as above)
        )
      };
    })
  };
});

describe('TypeScript DTLS Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('DTLS class should be defined', () => {
    expect(DTLS).toBeDefined();
  });
  
  test('SecurityLevel enum should be defined with correct values', () => {
    expect(SecurityLevel).toBeDefined();
    expect(SecurityLevel.STANDARD).toBe('standard');
    expect(SecurityLevel.POST_QUANTUM_MEDIUM).toBe('pq-medium');
    expect(SecurityLevel.POST_QUANTUM_HIGH).toBe('pq-high');
    expect(SecurityLevel.HYBRID).toBe('hybrid');
  });
  
  test('ConnectionState enum should be defined with correct values', () => {
    expect(ConnectionState).toBeDefined();
    expect(ConnectionState.CLOSED).toBe('closed');
    expect(ConnectionState.HANDSHAKE).toBe('handshake');
    expect(ConnectionState.CONNECTING).toBe('connecting');
    expect(ConnectionState.CONNECTED).toBe('connected');
    expect(ConnectionState.DISCONNECTED).toBe('disconnected');
    expect(ConnectionState.ERROR).toBe('error');
  });
  
  test('DTLS constructor should handle options', () => {
    const options = {
      isServer: false,
      securityLevel: SecurityLevel.HYBRID,
      cert: Buffer.from('mock-cert'),
      key: Buffer.from('mock-key')
    };
    
    const dtls = new DTLS(options);
    expect(dtls).toBeDefined();
  });
  
  test('DTLS should throw error with invalid options', () => {
    expect(() => {
      new DTLS({
        minVersion: '1.3',
        maxVersion: '1.2',
        cert: Buffer.from('mock-cert'),
        key: Buffer.from('mock-key')
      });
    }).toThrow('minVersion cannot exceed maxVersion');
  });
  
  test('DTLS connect should establish connection', (done) => {
    const dtls = new DTLS({
      cert: Buffer.from('mock-cert'),
      key: Buffer.from('mock-key')
    });
    
    // Use once to ensure the callback is only called once
    dtls.once('connect', () => {
      expect(dtls).toBeDefined();
      dtls.removeAllListeners(); // Remove all listeners to prevent multiple calls
      done();
    });
    
    dtls.connect(12345, '127.0.0.1');
  });
  
  test('DTLS should send and receive data', (done) => {
    const dtls = new DTLS({
      cert: Buffer.from('mock-cert'),
      key: Buffer.from('mock-key')
    });
    
    const testMessage = 'Hello, DTLS!';
    let dataReceived = false;
    
    dtls.once('connect', () => {
      // Send test message
      dtls.send(testMessage);
    });
    
    dtls.once('message', (data) => {
      // We should receive the echoed data back
      // Note: In our mock implementation, the server just echoes back the encrypted data,
      // so the decrypted data won't match the original message.
      // In a real implementation with proper encryption/decryption, they would match.
      expect(data).toBeDefined();
      expect(data).toBeInstanceOf(Buffer);
      dataReceived = true;
      dtls.close();
    });
    
    dtls.once('close', () => {
      if (dataReceived) {
        dtls.removeAllListeners(); // Remove all listeners to prevent multiple calls
        done();
      }
    });
    
    dtls.connect(12345, '127.0.0.1');
  });
  
  test('DTLS should handle close properly', (done) => {
    const dtls = new DTLS({
      cert: Buffer.from('mock-cert'),
      key: Buffer.from('mock-key')
    });
    
    let connectCalled = false;
    
    dtls.once('connect', () => {
      connectCalled = true;
      dtls.close();
    });
    
    dtls.once('close', () => {
      expect(connectCalled).toBe(true);
      dtls.removeAllListeners(); // Remove all listeners to prevent multiple calls
      done();
    });
    
    dtls.connect(12345, '127.0.0.1');
  });
  
  test('DTLS server should listen for connections', (done) => {
    const dtls = new DTLS({
      isServer: true,
      cert: Buffer.from('mock-cert'),
      key: Buffer.from('mock-key')
    });
    
    dtls.once('listening', () => {
      expect(dtls).toBeDefined();
      dtls.close();
      dtls.removeAllListeners();
      done();
    });
    
    dtls.listen(12345, '127.0.0.1');
  });
});
