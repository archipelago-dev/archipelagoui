import * as crypto from 'crypto';
import { PQCipherSuite } from './PQCipherSuite';
import { PQCertificateManager } from './PQCertificateManager';

/**
 * Verification modes for certificate verification
 */
export enum VerifyMode {
  NONE = 0,
  PEER = 1,
  FAIL_IF_NO_PEER_CERT = 2,
  CLIENT_ONCE = 4
}

/**
 * DTLS protocol versions
 */
export enum DTLSVersion {
  DTLS_1_0 = 'DTLS 1.0',
  DTLS_1_2 = 'DTLS 1.2',
  DTLS_1_3 = 'DTLS 1.3'
}

/**
 * Options for creating a DTLS context
 */
export interface DTLSContextOptions {
  isServer: boolean;
  cert?: Buffer | string;
  key?: Buffer | string;
  cipherSuites?: string[];
  pqCipherSuites?: PQCipherSuite[];
  minVersion?: DTLSVersion;
  maxVersion?: DTLSVersion;
  verifyMode?: VerifyMode;
  enableCertTransparency?: boolean;
  ocspStapling?: boolean;
  crlDistributionPoints?: string[];
  certificatePolicies?: string[];
}

/**
 * Manages DTLS context settings and certificates
 * This is a TypeScript implementation of the functionality provided by SSL_CTX in OpenSSL
 */
export class DTLSContext {
  private static nextId = 1;
  private static contexts: Map<number, DTLSContext> = new Map();

  public readonly id: number;
  private readonly isServer: boolean;
  private readonly certificateManager: PQCertificateManager;
  private readonly cipherSuites: string[];
  private readonly pqCipherSuites: PQCipherSuite[];
  private readonly minVersion: DTLSVersion;
  private readonly maxVersion: DTLSVersion;
  private readonly verifyMode: VerifyMode;
  private readonly enableCertTransparency: boolean;
  private readonly ocspStapling: boolean;
  private readonly crlDistributionPoints: string[];
  private readonly certificatePolicies: string[];
  private certificate?: Buffer;
  private privateKey?: Buffer;

  /**
   * Create a new DTLS context
   * @param options Context options
   */
  constructor(options: DTLSContextOptions) {
    this.id = DTLSContext.nextId++;
    this.isServer = options.isServer;
    this.certificateManager = new PQCertificateManager();
    this.cipherSuites = options.cipherSuites || [];
    this.pqCipherSuites = options.pqCipherSuites || [];
    this.minVersion = options.minVersion || DTLSVersion.DTLS_1_2;
    this.maxVersion = options.maxVersion || DTLSVersion.DTLS_1_2;
    this.verifyMode = options.verifyMode || VerifyMode.PEER;
    this.enableCertTransparency = options.enableCertTransparency || false;
    this.ocspStapling = options.ocspStapling || false;
    this.crlDistributionPoints = options.crlDistributionPoints || [];
    this.certificatePolicies = options.certificatePolicies || [];

    // Load certificate and private key if provided
    if (options.cert && options.key) {
      this.setCertificateAndKey(options.cert, options.key);
    }

    // Store the context in the static map
    DTLSContext.contexts.set(this.id, this);
  }

  /**
   * Get a context by ID
   * @param id Context ID
   * @returns The context or undefined if not found
   */
  public static getContextById(id: number): DTLSContext | undefined {
    return DTLSContext.contexts.get(id);
  }

  /**
   * Free a context by ID
   * @param id Context ID
   * @returns true if the context was found and freed, false otherwise
   */
  public static freeContext(id: number): boolean {
    return DTLSContext.contexts.delete(id);
  }

  /**
   * Set certificate and private key
   * @param cert Certificate as Buffer or string
   * @param key Private key as Buffer or string
   */
  public setCertificateAndKey(cert: Buffer | string, key: Buffer | string): void {
    // Convert strings to buffers if needed
    const certBuffer = typeof cert === 'string' ? Buffer.from(cert) : cert;
    const keyBuffer = typeof key === 'string' ? Buffer.from(key) : key;

    this.certificate = certBuffer;
    this.privateKey = keyBuffer;
  }

  /**
   * Get the certificate
   * @returns The certificate or undefined if not set
   */
  public getCertificate(): Buffer | undefined {
    return this.certificate;
  }

  /**
   * Get the private key
   * @returns The private key or undefined if not set
   */
  public getPrivateKey(): Buffer | undefined {
    return this.privateKey;
  }

  /**
   * Check if this is a server context
   * @returns true if this is a server context, false otherwise
   */
  public isServerContext(): boolean {
    return this.isServer;
  }

  /**
   * Get the cipher suites
   * @returns Array of cipher suite strings
   */
  public getCipherSuites(): string[] {
    return [...this.cipherSuites];
  }

  /**
   * Get the post-quantum cipher suites
   * @returns Array of PQCipherSuite enums
   */
  public getPQCipherSuites(): PQCipherSuite[] {
    return [...this.pqCipherSuites];
  }

  /**
   * Get the minimum DTLS version
   * @returns The minimum DTLS version
   */
  public getMinVersion(): DTLSVersion {
    return this.minVersion;
  }

  /**
   * Get the maximum DTLS version
   * @returns The maximum DTLS version
   */
  public getMaxVersion(): DTLSVersion {
    return this.maxVersion;
  }

  /**
   * Get the verify mode
   * @returns The verify mode
   */
  public getVerifyMode(): VerifyMode {
    return this.verifyMode;
  }

  /**
   * Check if certificate transparency is enabled
   * @returns true if certificate transparency is enabled, false otherwise
   */
  public isCertTransparencyEnabled(): boolean {
    return this.enableCertTransparency;
  }

  /**
   * Check if OCSP stapling is enabled
   * @returns true if OCSP stapling is enabled, false otherwise
   */
  public isOCSPStaplingEnabled(): boolean {
    return this.ocspStapling;
  }

  /**
   * Get the CRL distribution points
   * @returns Array of CRL distribution point URIs
   */
  public getCRLDistributionPoints(): string[] {
    return [...this.crlDistributionPoints];
  }

  /**
   * Get the certificate policies
   * @returns Array of certificate policy OIDs
   */
  public getCertificatePolicies(): string[] {
    return [...this.certificatePolicies];
  }

  /**
   * Get the certificate manager
   * @returns The certificate manager
   */
  public getCertificateManager(): PQCertificateManager {
    return this.certificateManager;
  }

  /**
   * Free this context
   * This removes it from the static map
   */
  public free(): void {
    DTLSContext.contexts.delete(this.id);
  }
}
