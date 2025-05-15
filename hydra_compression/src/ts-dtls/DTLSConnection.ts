import { EventEmitter } from 'events';
import { Socket } from 'dgram';
import { PQKeyExchange } from './PQKeyExchange';
import { HandshakeType, createHandshakeMessage, parseHandshakeMessage } from './DTLSHandshake';
import { PQCipherSuite, isPQCipherSuite } from './PQCipherSuite';

// Connection states
export enum ConnectionState {
  CLOSED = 'closed',
  HANDSHAKE = 'handshake',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

export interface ConnectionOptions {
  socket: Socket;
  address: string;
  port: number;
  isServer: boolean;
  cert?: Buffer;
  key?: Buffer;
  cipherSuites?: string[];
  pqCipherSuites?: PQCipherSuite[];
  timeout?: number;
}

/**
 * Represents a single DTLS connection
 */
export class DTLSConnection extends EventEmitter {
  private state: ConnectionState = ConnectionState.CLOSED;
  private socket: Socket;
  private address: string;
  private port: number;
  private isServer: boolean;
  private cert?: Buffer;
  private key?: Buffer;
  private cipherSuites: string[];
  private pqCipherSuites: PQCipherSuite[];
  private timeout: number;
  private messageSeq: number = 0;
  private pqKeyExchange?: PQKeyExchange;
  private sharedSecret?: Buffer;
  private handshakeComplete: boolean = false;
  private remotePublicKey?: Buffer;
  private localKeyPair?: { publicKey: Buffer; privateKey: Buffer };

  constructor(options: ConnectionOptions) {
    super();
    this.socket = options.socket;
    this.address = options.address;
    this.port = options.port;
    this.isServer = options.isServer;
    this.cert = options.cert;
    this.key = options.key;
    this.cipherSuites = options.cipherSuites || [];
    this.pqCipherSuites = options.pqCipherSuites || [];
    this.timeout = options.timeout || 30000; // 30 seconds default timeout
    
    // Initialize PQ key exchange if PQ cipher suites are enabled
    if (this.pqCipherSuites.length > 0) {
      this.pqKeyExchange = new PQKeyExchange();
    }
  }

  /**
   * Start the DTLS handshake
   */
  public async connect(): Promise<void> {
    this.state = ConnectionState.CONNECTING;
    
    try {
      // Generate key pair if using PQ
      if (this.pqKeyExchange) {
        this.localKeyPair = await this.pqKeyExchange.generateKeyPair();
      }
      
      // Send client hello
      await this.sendClientHello();
    } catch (error) {
      this.state = ConnectionState.ERROR;
      this.emit('error', error);
    }
  }

  /**
   * Send data over the DTLS connection
   * @param data Data to send
   */
  public send(data: Buffer | string): void {
    if (this.state !== ConnectionState.CONNECTED) {
      throw new Error('Not connected');
    }
    
    const buffer = typeof data === 'string' ? Buffer.from(data) : data;
    
    // Encrypt the data
    const encrypted = this.encrypt(buffer);
    
    // Send the encrypted data
    this.socket.send(encrypted, 0, encrypted.length, this.port, this.address);
  }

  /**
   * Close the DTLS connection
   */
  public close(): void {
    this.state = ConnectionState.CLOSED;
    this.emit('close');
  }

  /**
   * Handle incoming DTLS messages
   * @param msg Message data
   * @param rinfo Remote address info
   */
  public async handleMessage(msg: Buffer, rinfo: { address: string; port: number }): Promise<void> {
    // Check if the message is from the expected peer
    if (rinfo.address !== this.address || rinfo.port !== this.port) {
      return;
    }
    
    // Check message type
    const contentType = msg[0];
    
    switch (contentType) {
      case 20: // Change Cipher Spec
        this.handleChangeCipherSpec(msg.slice(13)); // Skip header
        break;
      case 21: // Alert
        this.handleAlert(msg.slice(13)); // Skip header
        break;
      case 22: // Handshake
        await this.handleHandshake(msg.slice(13)); // Skip header
        break;
      case 23: // Application Data
        this.handleApplicationData(msg.slice(13)); // Skip header
        break;
      default:
        this.emit('error', new Error(`Unknown content type: ${contentType}`));
    }
  }

  /**
   * Handle change cipher spec message
   * @param data Message data
   */
  private handleChangeCipherSpec(data: Buffer): void {
    // In a real implementation, this would update the cipher state
    // For this example, we'll just emit an event
    this.emit('changeCipherSpec');
  }

  /**
   * Handle alert message
   * @param data Message data
   */
  private handleAlert(data: Buffer): void {
    const level = data[0]; // 1 = warning, 2 = fatal
    const description = data[1];
    
    if (level === 2) {
      this.state = ConnectionState.ERROR;
      this.emit('error', new Error(`Fatal alert: ${description}`));
    } else {
      this.emit('warning', `Warning alert: ${description}`);
    }
  }

  /**
   * Handle handshake message
   * @param data Message data
   */
  private async handleHandshake(data: Buffer): Promise<void> {
    const { type, body } = parseHandshakeMessage(data);
    
    switch (type) {
      case HandshakeType.CLIENT_HELLO:
        await this.handleClientHello(body);
        break;
      case HandshakeType.SERVER_HELLO:
        await this.handleServerHello(body);
        break;
      case HandshakeType.SERVER_KEY_EXCHANGE:
        await this.handleServerKeyExchange(body);
        break;
      case HandshakeType.CLIENT_KEY_EXCHANGE:
        await this.handleClientKeyExchange(body);
        break;
      case HandshakeType.FINISHED:
        // Handshake is complete
        this.handshakeComplete = true;
        this.state = ConnectionState.CONNECTED;
        this.emit('connect');
        break;
      default:
        this.emit('error', new Error(`Unknown handshake type: ${type}`));
    }
  }

  /**
   * Handle application data message
   * @param data Encrypted application data
   */
  private handleApplicationData(data: Buffer): void {
    if (!this.handshakeComplete) {
      this.emit('error', new Error('Received application data before handshake completed'));
      return;
    }
    
    try {
      // Decrypt the data
      const decrypted = this.decrypt(data);
      
      // Emit the data event
      this.emit('data', decrypted);
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Send client hello message
   */
  private async sendClientHello(): Promise<void> {
    // Build client hello message
    const clientHello = Buffer.alloc(100); // Simplified for example
    
    // In a real implementation, this would include:
    // - Protocol version
    // - Random bytes
    // - Session ID
    // - Cipher suites
    // - Compression methods
    // - Extensions (including PQ extensions)
    
    // For this example, we'll just include some dummy data
    clientHello.write('CLIENT_HELLO', 0);
    
    // Send the message
    const message = createHandshakeMessage(HandshakeType.CLIENT_HELLO, this.messageSeq++, clientHello);
    this.socket.send(message, 0, message.length, this.port, this.address);
  }

  /**
   * Handle client hello message
   * @param data Client hello data
   */
  private async handleClientHello(data: Buffer): Promise<void> {
    if (!this.isServer) {
      this.emit('error', new Error('Received client hello as client'));
      return;
    }
    
    // In a real implementation, this would:
    // - Parse the client hello
    // - Select a cipher suite
    // - Generate server random
    // - Send server hello
    
    // For this example, we'll just send a server hello
    await this.sendServerHello();
    
    // If using PQ, send server key exchange
    if (this.pqCipherSuites.length > 0) {
      await this.sendServerKeyExchange();
    }
  }

  /**
   * Send server hello message
   */
  private async sendServerHello(): Promise<void> {
    // Build server hello message
    const serverHello = Buffer.alloc(100); // Simplified for example
    
    // In a real implementation, this would include:
    // - Protocol version
    // - Random bytes
    // - Session ID
    // - Selected cipher suite
    // - Selected compression method
    // - Extensions
    
    // For this example, we'll just include some dummy data
    serverHello.write('SERVER_HELLO', 0);
    
    // Send the message
    const message = createHandshakeMessage(HandshakeType.SERVER_HELLO, this.messageSeq++, serverHello);
    this.socket.send(message, 0, message.length, this.port, this.address);
  }

  /**
   * Handle server hello message
   * @param data Server hello data
   */
  private async handleServerHello(data: Buffer): Promise<void> {
    if (this.isServer) {
      this.emit('error', new Error('Received server hello as server'));
      return;
    }
    
    // In a real implementation, this would:
    // - Parse the server hello
    // - Verify the selected cipher suite
    // - Store the server random
    
    // For this example, we'll just wait for the server key exchange
  }

  /**
   * Send server key exchange message
   */
  private async sendServerKeyExchange(): Promise<void> {
    if (!this.pqKeyExchange) {
      this.emit('error', new Error('Cannot perform key exchange'));
      return;
    }
    
    // Generate key pair
    this.localKeyPair = await this.pqKeyExchange.generateKeyPair();
    
    // Build server key exchange message
    const serverKeyExchange = Buffer.alloc(this.localKeyPair.publicKey.length + 2);
    
    // Include the public key length and the public key
    serverKeyExchange.writeUInt16BE(this.localKeyPair.publicKey.length, 0);
    this.localKeyPair.publicKey.copy(serverKeyExchange, 2);
    
    // Send the message
    const message = createHandshakeMessage(HandshakeType.SERVER_KEY_EXCHANGE, this.messageSeq++, serverKeyExchange);
    this.socket.send(message, 0, message.length, this.port, this.address);
  }

  /**
   * Handle server key exchange message
   * @param data Server key exchange data
   */
  private async handleServerKeyExchange(data: Buffer): Promise<void> {
    if (this.isServer) {
      this.emit('error', new Error('Received server key exchange as server'));
      return;
    }
    
    // Extract the public key
    const publicKeyLength = data.readUInt16BE(0);
    this.remotePublicKey = data.slice(2, 2 + publicKeyLength);
    
    // Send client key exchange
    await this.sendClientKeyExchange();
  }

  /**
   * Send client key exchange message
   */
  private async sendClientKeyExchange(): Promise<void> {
    if (!this.pqKeyExchange || !this.remotePublicKey || !this.localKeyPair) {
      this.emit('error', new Error('Cannot perform key exchange'));
      return;
    }
    
    try {
      // Perform key encapsulation using MLKEM
      const { ciphertext, sharedSecret } = await this.pqKeyExchange.encapsulate(this.remotePublicKey);
      this.sharedSecret = sharedSecret;
      
      // Build client key exchange message
      const clientKeyExchange = Buffer.alloc(ciphertext.length + 2);
      
      // Include the ciphertext length and the ciphertext
      clientKeyExchange.writeUInt16BE(ciphertext.length, 0);
      ciphertext.copy(clientKeyExchange, 2);
      
      // Send the message
      const message = createHandshakeMessage(HandshakeType.CLIENT_KEY_EXCHANGE, this.messageSeq++, clientKeyExchange);
      this.socket.send(message, 0, message.length, this.port, this.address);
      
      this.emit('debug', 'Sent client key exchange message');
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Handle client key exchange message
   * @param data Client key exchange data
   */
  private async handleClientKeyExchange(data: Buffer): Promise<void> {
    if (!this.isServer || !this.pqKeyExchange || !this.localKeyPair) {
      this.emit('error', new Error('Cannot perform key exchange'));
      return;
    }
    
    try {
      // Extract the ciphertext
      const ciphertextLength = data.readUInt16BE(0);
      const ciphertext = data.slice(2, 2 + ciphertextLength);
      
      // Perform key decapsulation using MLKEM
      this.sharedSecret = await this.pqKeyExchange.decapsulate(ciphertext, this.localKeyPair.privateKey);
      
      // Handshake is complete
      this.handshakeComplete = true;
      this.state = ConnectionState.CONNECTED;
      this.emit('connect');
      this.emit('debug', 'Completed handshake (server)');
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Encrypt data using the shared secret
   * @param data Data to encrypt
   * @returns Encrypted data
   */
  private encrypt(data: Buffer): Buffer {
    if (!this.sharedSecret) {
      throw new Error('No shared secret available');
    }
    
    // In a real implementation, this would use AES-GCM or another AEAD cipher
    // For this example, we'll just XOR the data with the shared secret
    const encrypted = Buffer.alloc(data.length);
    
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ this.sharedSecret[i % this.sharedSecret.length];
    }
    
    return encrypted;
  }

  /**
   * Decrypt data using the shared secret
   * @param data Data to decrypt
   * @returns Decrypted data
   */
  private decrypt(data: Buffer): Buffer {
    // For this example, our encryption is symmetric (XOR), so decryption is the same as encryption
    return this.encrypt(data);
  }

  /**
   * Get the current connection state
   * @returns Connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }
}
