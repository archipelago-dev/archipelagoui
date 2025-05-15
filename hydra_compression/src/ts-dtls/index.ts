import { EventEmitter } from 'events';
import dgram from 'dgram';
import { PQKeyExchange, PQAlgorithm } from './PQKeyExchange';

// Enums and types
export enum SecurityLevel {
  STANDARD = 'standard',
  POST_QUANTUM_MEDIUM = 'pq-medium',
  POST_QUANTUM_HIGH = 'pq-high',
  HYBRID = 'hybrid'
}

export enum ConnectionState {
  CLOSED = 'closed',
  HANDSHAKE = 'handshake',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

export interface DTLSOptions {
  isServer?: boolean;
  cert?: string | Buffer;
  key?: string | Buffer;
  securityLevel?: SecurityLevel;
  minVersion?: '1.0' | '1.2' | '1.3';
  maxVersion?: '1.2' | '1.3';
  cipherSuites?: string[];
  verifyPeer?: boolean;
  debug?: boolean;
  timeout?: number;
  mtu?: number;
  autoFallback?: boolean;
}

// Message types
enum MessageType {
  CLIENT_HELLO = 0x01,
  SERVER_HELLO = 0x02,
  APPLICATION_DATA = 0x03,
  ALERT = 0x15,
  HANDSHAKE_FINISHED = 0x14
}

// DTLS implementation using TypeScript and mlkem
export class DTLS extends EventEmitter {
  private readonly opts: {
    isServer: boolean;
    securityLevel: SecurityLevel;
    minVersion: string;
    maxVersion: string;
    verifyPeer: boolean;
    debug: boolean;
    timeout: number;
    mtu: number;
    autoFallback: boolean;
    cipherSuites: string[];
    cert?: string | Buffer;
    key?: string | Buffer;
  };

  private state: ConnectionState = ConnectionState.CLOSED;
  private socket?: dgram.Socket;
  private remoteAddress?: string;
  private remotePort?: number;
  private pqKeyExchange: PQKeyExchange;
  private localKeyPair?: { publicKey: Buffer, privateKey: Buffer };
  private remotePublicKey?: Buffer;
  private sharedSecret?: Buffer;

  constructor(options: DTLSOptions) {
    super();

    // Default options
    this.opts = {
      isServer: false,
      securityLevel: SecurityLevel.STANDARD,
      minVersion: '1.2',
      maxVersion: '1.3',
      verifyPeer: true,
      debug: false,
      timeout: 30_000,
      mtu: 1400,
      autoFallback: true,
      cipherSuites: [],
      ...options
    };

    // Initialize PQKeyExchange for post-quantum key exchange
    const algorithm = this.getPQAlgorithmForSecurityLevel(this.opts.securityLevel);
    this.pqKeyExchange = new PQKeyExchange(algorithm);

    // Validate options
    this.validateOptions();
  }

  private getPQAlgorithmForSecurityLevel(securityLevel: SecurityLevel): PQAlgorithm {
    switch (securityLevel) {
      case SecurityLevel.POST_QUANTUM_MEDIUM:
        return PQAlgorithm.KYBER512;
      case SecurityLevel.POST_QUANTUM_HIGH:
      case SecurityLevel.HYBRID:
        return PQAlgorithm.KYBER768;
      default:
        return PQAlgorithm.KYBER768; // Default to KYBER768
    }
  }

  private validateOptions(): void {
    if (parseFloat(this.opts.minVersion) > parseFloat(this.opts.maxVersion)) {
      throw new Error('minVersion cannot exceed maxVersion');
    }

    if (!this.opts.cert || !this.opts.key) {
      throw new Error('Certificate & key required for DTLS context');
    }
  }

  // Connect to a remote DTLS server
  async connect(port: number, host: string, cb?: () => void): Promise<void> {
    if (this.state !== ConnectionState.CLOSED) {
      throw new Error('DTLS instance already used');
    }

    if (this.opts.isServer) {
      throw new Error('Server mode cannot connect()');
    }

    // Store remote address and port
    this.remoteAddress = host;
    this.remotePort = port;

    // Create UDP socket
    this.socket = dgram.createSocket('udp4');
    this.setupSocketEvents();

    // Generate Kyber key pair for post-quantum key exchange
    try {
      this.localKeyPair = await this.pqKeyExchange.generateKeyPair();

      // Start handshake
      this.state = ConnectionState.HANDSHAKE;
      await this.startHandshake();

      if (cb) {
        this.once('connect', cb);
      }
    } catch (err) {
      this.handleError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // Listen for incoming DTLS connections (server mode)
  listen(port: number, host?: string, cb?: () => void): void {
    if (this.state !== ConnectionState.CLOSED) {
      throw new Error('DTLS instance already used');
    }

    if (!this.opts.isServer) {
      throw new Error('Client mode cannot listen()');
    }

    // Create UDP socket
    this.socket = dgram.createSocket('udp4');

    // Bind socket to port
    this.socket.bind(port, host || '0.0.0.0', () => {
      this.state = ConnectionState.CONNECTING;
      this.setupSocketEvents();

      if (cb) {
        cb();
      }

      this.emit('listening');
    });
  }

  // Start DTLS handshake
  private async startHandshake(): Promise<void> {
    if (!this.socket || !this.remoteAddress || !this.remotePort || !this.localKeyPair) {
      this.handleError(new Error('Cannot start handshake: socket or keys not initialized'));
      return;
    }

    try {
      // Send ClientHello with our public key
      const clientHello = this.createClientHello(this.localKeyPair.publicKey);

      // Send the ClientHello message
      this.socket.send(clientHello, this.remotePort, this.remoteAddress);

      // Set timeout for handshake
      setTimeout(() => {
        if (this.state === ConnectionState.HANDSHAKE) {
          this.handleError(new Error('Handshake timeout'));
        }
      }, this.opts.timeout);
    } catch (err) {
      this.handleError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // Create a ClientHello message with our public key
  private createClientHello(publicKey: Buffer): Buffer {
    // Message format:
    // - 1 byte: message type (0x01 for ClientHello)
    // - 2 bytes: protocol version (0x0303 for TLS 1.2)
    // - 4 bytes: length of public key
    // - N bytes: public key

    const message = Buffer.alloc(7 + publicKey.length);
    message[0] = MessageType.CLIENT_HELLO; // ClientHello
    message[1] = 0x03; // TLS 1.2 (major)
    message[2] = 0x03; // TLS 1.2 (minor)

    // Write public key length
    message.writeUInt32BE(publicKey.length, 3);

    // Write public key
    publicKey.copy(message, 7);

    return message;
  }

  // Send data over the DTLS connection
  send(data: Buffer | string): boolean {
    if (this.state !== ConnectionState.CONNECTED) {
      this.emit('error', new Error('Cannot send: not connected'));
      return false;
    }

    if (!this.socket || !this.remoteAddress || !this.remotePort || !this.sharedSecret) {
      this.emit('error', new Error('Cannot send: socket or shared secret not initialized'));
      return false;
    }

    try {
      // Convert string to Buffer if needed
      const buffer = typeof data === 'string' ? Buffer.from(data) : data;

      // Encrypt data using shared secret
      const encrypted = this.encrypt(buffer);

      // Send encrypted data
      this.socket.send(encrypted, this.remotePort, this.remoteAddress);
      return true;
    } catch (err) {
      this.handleError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }

  // Close the DTLS connection
  close(): void {
    if (this.state === ConnectionState.CLOSED) {
      return;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }

    this.state = ConnectionState.CLOSED;
    this.emit('close');
  }

  // Set up UDP socket events
  private setupSocketEvents(): void {
    if (!this.socket) return;

    this.socket.on('message', (msg, rinfo) => {
      this.handleIncomingMessage(msg, rinfo);
    });

    this.socket.on('error', (err) => {
      this.handleError(err);
    });

    this.socket.on('close', () => {
      this.state = ConnectionState.DISCONNECTED;
      this.emit('close');
    });
  }

  // Handle incoming UDP messages
  private handleIncomingMessage(msg: Buffer, rinfo: dgram.RemoteInfo): void {
    if (msg.length === 0) {
      this.emit('error', new Error('Empty UDP packet'));
      return;
    }

    try {
      // Check message type
      const messageType = msg[0];

      switch (messageType) {
        case MessageType.SERVER_HELLO:
          this.handleServerHello(msg);
          break;
        case MessageType.APPLICATION_DATA:
          this.handleApplicationData(msg);
          break;
        case MessageType.ALERT:
          this.handleAlert(msg);
          break;
        default:
          this.emit('error', new Error(`Unknown message type: ${messageType}`));
      }
    } catch (err) {
      this.handleError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // Handle ServerHello message
  private async handleServerHello(msg: Buffer): Promise<void> {
    if (this.state !== ConnectionState.HANDSHAKE) {
      this.emit('error', new Error('Unexpected ServerHello'));
      return;
    }

    try {
      // Extract server's public key
      const publicKeyLength = msg.readUInt32BE(3);
      const publicKey = msg.subarray(7, 7 + publicKeyLength);
      this.remotePublicKey = publicKey;

      // Extract ciphertext
      const ciphertextOffset = 7 + publicKeyLength;
      const ciphertextLength = msg.readUInt32BE(ciphertextOffset);
      const ciphertext = msg.subarray(ciphertextOffset + 4, ciphertextOffset + 4 + ciphertextLength);

      if (!this.localKeyPair) {
        throw new Error('Local key pair not initialized');
      }

      // Decrypt shared secret using our private key and the ciphertext
      this.sharedSecret = await this.pqKeyExchange.decapsulate(
        this.localKeyPair.privateKey,
        ciphertext
      );

      // Connection established
      this.state = ConnectionState.CONNECTED;
      this.emit('connect');
    } catch (err) {
      this.handleError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // Handle application data
  private handleApplicationData(msg: Buffer): void {
    if (this.state !== ConnectionState.CONNECTED) {
      this.emit('error', new Error('Received data but not connected'));
      return;
    }

    if (!this.sharedSecret) {
      this.emit('error', new Error('Shared secret not initialized'));
      return;
    }

    try {
      // Extract encrypted data
      const dataLength = msg.readUInt32BE(1);
      const encryptedData = msg.subarray(5, 5 + dataLength);

      // Decrypt data
      const decrypted = this.decrypt(encryptedData);

      // Emit message event (to match the README API)
      this.emit('message', decrypted);

      // Also emit data event for backward compatibility
      this.emit('data', decrypted);
    } catch (err) {
      this.handleError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // Handle alert messages
  private handleAlert(msg: Buffer): void {
    // In a real implementation, this would handle DTLS alert messages
    // For this simplified version, we'll just emit an error
    const alertLevel = msg[1];
    const alertDescription = msg[2];

    this.emit('error', new Error(`DTLS Alert: level=${alertLevel}, description=${alertDescription}`));

    // Fatal alerts should close the connection
    if (alertLevel === 2) { // Fatal
      this.close();
    }
  }

  // Simple XOR encryption (for demonstration only)
  private encrypt(data: Buffer): Buffer {
    if (!this.sharedSecret) {
      throw new Error('Shared secret not initialized');
    }

    // Message format:
    // - 1 byte: message type (0x03 for Application Data)
    // - 4 bytes: length of encrypted data
    // - N bytes: encrypted data

    const encrypted = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ this.sharedSecret[i % this.sharedSecret.length];
    }

    const message = Buffer.alloc(5 + encrypted.length);
    message[0] = MessageType.APPLICATION_DATA; // Application Data
    message.writeUInt32BE(encrypted.length, 1);
    encrypted.copy(message, 5);

    return message;
  }

  // Simple XOR decryption (for demonstration only)
  private decrypt(data: Buffer): Buffer {
    if (!this.sharedSecret) {
      throw new Error('Shared secret not initialized');
    }

    // XOR decryption (same as encryption)
    const decrypted = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) {
      decrypted[i] = data[i] ^ this.sharedSecret[i % this.sharedSecret.length];
    }

    return decrypted;
  }

  // Handle errors
  private handleError(err: Error): void {
    this.state = ConnectionState.ERROR;
    this.emit('error', err);
    this.close();
  }
}
