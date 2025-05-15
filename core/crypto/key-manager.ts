/**
 * Key Management System for Archipelago
 * 
 * Provides a unified interface for managing both Kyber encryption keys and Falcon signature keys.
 * Supports key generation, storage, rotation, and retrieval.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {

createKyberExchange, KyberKeyExchange } from './kyber';

import * as falcon from './falcon';

const TICKET_STORE = new Map<string, Uint8Array>();  // memory MVP

const SESSION_TICKET_TTL_MS = 24 * 60 * 60 * 1000;
const ticketCache = new Map<string, { ticket: Uint8Array; ts: number }>();


/**
 * Interface for key pairs (both encryption and signature)
 */
export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/**
 * Types of cryptographic keys supported
 */
export enum KeyType {
  ENCRYPTION = 'encryption',
  SIGNATURE = 'signature'
}

/**
 * Key metadata for storage and retrieval
 */
export interface KeyMetadata {
  id: string;
  type: KeyType;
  createdAt: number;
  rotatedAt?: number;
  isActive: boolean;
}

/**
 * Stored key data with metadata
 */
export interface StoredKey {
  metadata: KeyMetadata;
  publicKey: string; // Base64 encoded
  privateKey: string; // Base64 encoded (encrypted if password provided)
}

/**
 * Options for the KeyManager
 */
export interface KeyManagerOptions {
  storageDir: string;
  password?: string; // Optional password for encrypting private keys
  autoRotationDays?: number; // Number of days before automatic key rotation
}

/**
 * Key Manager class for handling cryptographic keys
 */
export class KeyManager {
  private storageDir: string;
  private password?: string;
  private autoRotationDays: number;
  private encryptionKeys: Map<string, StoredKey> = new Map();
  private signatureKeys: Map<string, StoredKey> = new Map();
  private activeEncryptionKeyId?: string;
  private activeSignatureKeyId?: string;
  
  /**
   * Create a new KeyManager instance
   */
  constructor(options: KeyManagerOptions) {
    this.storageDir = options.storageDir;
    this.password = options.password;
    this.autoRotationDays = options.autoRotationDays || 90; // Default to 90 days
    
    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    
    // Load existing keys
    this.loadKeys();
  }
  
  /**
   * Load existing keys from storage
   */
  private loadKeys(): void {
    const encryptionKeyDir = path.join(this.storageDir, 'encryption');
    const signatureKeyDir = path.join(this.storageDir, 'signature');
    
    // Create directories if they don't exist
    if (!fs.existsSync(encryptionKeyDir)) {
      fs.mkdirSync(encryptionKeyDir, { recursive: true });
    }
    if (!fs.existsSync(signatureKeyDir)) {
      fs.mkdirSync(signatureKeyDir, { recursive: true });
    }
    
    // Load encryption keys
    this.loadKeysFromDir(encryptionKeyDir, this.encryptionKeys);
    
    // Load signature keys
    this.loadKeysFromDir(signatureKeyDir, this.signatureKeys);
    
    // Set active keys
    this.setActiveKeys();
  }
  
  /**
   * Load keys from a directory
   */
  private loadKeysFromDir(dir: string, keyMap: Map<string, StoredKey>): void {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(dir, file);
          const keyData = JSON.parse(fs.readFileSync(filePath, 'utf8')) as StoredKey;
          keyMap.set(keyData.metadata.id, keyData);
        }
      }
    } catch (error) {
      console.error('Error loading keys:', error);
    }
  }
  
  /**
   * Set active keys based on metadata
   */
  private setActiveKeys(): void {
    // Find active encryption key
    for (const [id, key] of this.encryptionKeys.entries()) {
      if (key.metadata.isActive) {
        this.activeEncryptionKeyId = id;
        break;
      }
    }
    
    // Find active signature key
    for (const [id, key] of this.signatureKeys.entries()) {
      if (key.metadata.isActive) {
        this.activeSignatureKeyId = id;
        break;
      }
    }
    
    // If no active keys found, create new ones
    if (!this.activeEncryptionKeyId) {
      this.generateEncryptionKey();
    }
    
    if (!this.activeSignatureKeyId) {
      this.generateSignatureKey();
    }
  }
  
  /**
   * Generate a new encryption key pair
   */
  public async generateEncryptionKey(): Promise<string> {
    // Generate new Kyber key pair
    const kex = await createKyberExchange();
    const keyPair: KeyPair = await kex.generateKeyPair();
    const keyId = crypto.randomUUID();
    const metadata: KeyMetadata = {
      id: keyId,
      type: KeyType.ENCRYPTION,
      createdAt: Date.now(),
      isActive: true
    };
    
    // Encode keys for storage
    const publicKeyBase64 = Buffer.from(keyPair.publicKey).toString('base64');
    const privateKeyBase64 = Buffer.from(keyPair.privateKey).toString('base64');
    
    // Create stored key
    const storedKey: StoredKey = {
      metadata,
      publicKey: publicKeyBase64,
      privateKey: this.encryptPrivateKey(privateKeyBase64)
    };
    
    // Deactivate current active key
    if (this.activeEncryptionKeyId) {
      const currentActive = this.encryptionKeys.get(this.activeEncryptionKeyId);
      if (currentActive) {
        currentActive.metadata.isActive = false;
        this.saveKey(currentActive, KeyType.ENCRYPTION);
      }
    }
    
    // Set new key as active
    this.activeEncryptionKeyId = keyId;
    this.encryptionKeys.set(keyId, storedKey);
    
    // Save key to storage
    this.saveKey(storedKey, KeyType.ENCRYPTION);
    
    return keyId;
  }
  
  /**
   * Generate a new signature key pair
   */
  public async generateSignatureKey(): Promise<string> {
    // Generate new Falcon key pair
    const keyPair = await falcon.keyPair();
    
    // Create key ID and metadata
    const keyId = crypto.randomUUID();
    const metadata: KeyMetadata = {
      id: keyId,
      type: KeyType.SIGNATURE,
      createdAt: Date.now(),
      isActive: true
    };
    
    // Encode keys for storage
    const publicKeyBase64 = Buffer.from(keyPair.publicKey).toString('base64');
    const privateKeyBase64 = Buffer.from(keyPair.privateKey).toString('base64');
    
    // Create stored key
    const storedKey: StoredKey = {
      metadata,
      publicKey: publicKeyBase64,
      privateKey: this.encryptPrivateKey(privateKeyBase64)
    };
    
    // Deactivate current active key
    if (this.activeSignatureKeyId) {
      const currentActive = this.signatureKeys.get(this.activeSignatureKeyId);
      if (currentActive) {
        currentActive.metadata.isActive = false;
        this.saveKey(currentActive, KeyType.SIGNATURE);
      }
    }
    
    // Set new key as active
    this.activeSignatureKeyId = keyId;
    this.signatureKeys.set(keyId, storedKey);
    
    // Save key to storage
    this.saveKey(storedKey, KeyType.SIGNATURE);
    
    return keyId;
  }
  
  /**
   * Encrypt a private key for storage
   */
  private encryptPrivateKey(privateKeyBase64: string): string {
    if (!this.password) {
      return privateKeyBase64;
    }
    
    try {
      // Use AES-256-GCM for encrypting the private key
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(this.password, 'salt', 32);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      
      let encrypted = cipher.update(privateKeyBase64, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Return IV + AuthTag + Encrypted data
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Error encrypting private key:', error);
      return privateKeyBase64;
    }
  }
  
  /**
   * Decrypt a private key from storage
   */
  private decryptPrivateKey(encryptedPrivateKey: string): string {
    if (!this.password || !encryptedPrivateKey.includes(':')) {
      return encryptedPrivateKey;
    }
    
    try {
      // Split into IV, AuthTag, and encrypted data
      const parts = encryptedPrivateKey.split(':');
      if (parts.length !== 3) {
        return encryptedPrivateKey;
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      // Decrypt using AES-256-GCM
      const key = crypto.scryptSync(this.password, 'salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting private key:', error);
      return encryptedPrivateKey;
    }
  }
  
  /**
   * Save a key to storage
   */
  private saveKey(key: StoredKey, type: KeyType): void {
    const dir = path.join(this.storageDir, type.toString());
    const filePath = path.join(dir, `${key.metadata.id}.json`);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(key, null, 2));
    } catch (error) {
      console.error(`Error saving ${type} key:`, error);
    }
  }
  
  /**
   * Get the active encryption key pair
   */
  public async getActiveEncryptionKeyPair(): Promise<KeyPair> {
    if (!this.activeEncryptionKeyId) {
      throw new Error('No active encryption key found');
    }
    
    const storedKey = this.encryptionKeys.get(this.activeEncryptionKeyId);
    if (!storedKey) {
      throw new Error('Active encryption key not found in storage');
    }
    
    return {
      publicKey: Buffer.from(storedKey.publicKey, 'base64'),
      privateKey: Buffer.from(this.decryptPrivateKey(storedKey.privateKey), 'base64')
    };
  }
  
  /**
   * Get the active signature key pair
   */
  public async getActiveSignatureKeyPair(): Promise<KeyPair> {
    if (!this.activeSignatureKeyId) {
      throw new Error('No active signature key found');
    }
    
    const storedKey = this.signatureKeys.get(this.activeSignatureKeyId);
    if (!storedKey) {
      throw new Error('Active signature key not found in storage');
    }
    
    return {
      publicKey: Buffer.from(storedKey.publicKey, 'base64'),
      privateKey: Buffer.from(this.decryptPrivateKey(storedKey.privateKey), 'base64')
    };
  }
  
  /**
   * Get a specific encryption key pair by ID
   */
  public async getEncryptionKeyPair(keyId: string): Promise<KeyPair> {
    const storedKey = this.encryptionKeys.get(keyId);
    if (!storedKey) {
      throw new Error(`Encryption key with ID ${keyId} not found`);
    }
    
    return {
      publicKey: Buffer.from(storedKey.publicKey, 'base64'),
      privateKey: Buffer.from(this.decryptPrivateKey(storedKey.privateKey), 'base64')
    };
  }
  
  /**
   * Get a specific signature key pair by ID
   */
  public async getSignatureKeyPair(keyId: string): Promise<KeyPair> {
    const storedKey = this.signatureKeys.get(keyId);
    if (!storedKey) {
      throw new Error(`Signature key with ID ${keyId} not found`);
    }
    
    return {
      publicKey: Buffer.from(storedKey.publicKey, 'base64'),
      privateKey: Buffer.from(this.decryptPrivateKey(storedKey.privateKey), 'base64')
    };
  }
  
  /**
   * Get all encryption key metadata
   */
  public getEncryptionKeyMetadata(): KeyMetadata[] {
    return Array.from(this.encryptionKeys.values()).map(key => key.metadata);
  }
  
  /**
   * Get all signature key metadata
   */
  public getSignatureKeyMetadata(): KeyMetadata[] {
    return Array.from(this.signatureKeys.values()).map(key => key.metadata);
  }
  
  /**
   * Rotate the active encryption key
   */
  public async rotateEncryptionKey(): Promise<string> {
    const newKeyId = await this.generateEncryptionKey();
    
    // Update rotation timestamp for old key
    if (this.activeEncryptionKeyId && this.activeEncryptionKeyId !== newKeyId) {
      const oldKey = this.encryptionKeys.get(this.activeEncryptionKeyId);
      if (oldKey) {
        oldKey.metadata.rotatedAt = Date.now();
        this.saveKey(oldKey, KeyType.ENCRYPTION);
      }
    }
    
    return newKeyId;
  }
  
  /**
   * Rotate the active signature key
   */
  public async rotateSignatureKey(): Promise<string> {
    const newKeyId = await this.generateSignatureKey();
    
    // Update rotation timestamp for old key
    if (this.activeSignatureKeyId && this.activeSignatureKeyId !== newKeyId) {
      const oldKey = this.signatureKeys.get(this.activeSignatureKeyId);
      if (oldKey) {
        oldKey.metadata.rotatedAt = Date.now();
        this.saveKey(oldKey, KeyType.SIGNATURE);
      }
    }
    
    return newKeyId;
  }
  
  /**
   * Check if keys need rotation based on age
   */
  public async checkAndRotateKeys(): Promise<{encryptionRotated: boolean, signatureRotated: boolean}> {
    const result = {
      encryptionRotated: false,
      signatureRotated: false
    };
    
    // Check encryption key age
    if (this.activeEncryptionKeyId) {
      const key = this.encryptionKeys.get(this.activeEncryptionKeyId);
      if (key) {
        const ageInDays = (Date.now() - key.metadata.createdAt) / (1000 * 60 * 60 * 24);
        if (ageInDays > this.autoRotationDays) {
          await this.rotateEncryptionKey();
          result.encryptionRotated = true;
        }
      }
    }
    
    // Check signature key age
    if (this.activeSignatureKeyId) {
      const key = this.signatureKeys.get(this.activeSignatureKeyId);
      if (key) {
        const ageInDays = (Date.now() - key.metadata.createdAt) / (1000 * 60 * 60 * 24);
        if (ageInDays > this.autoRotationDays) {
          await this.rotateSignatureKey();
          result.signatureRotated = true;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Delete a key by ID and type
   */
  public deleteKey(keyId: string, type: KeyType): boolean {
    const keyMap = type === KeyType.ENCRYPTION ? this.encryptionKeys : this.signatureKeys;
    const key = keyMap.get(keyId);
    
    if (!key) {
      return false;
    }
    
    // Don't delete active keys
    if (key.metadata.isActive) {
      return false;
    }
    
    // Remove from memory
    keyMap.delete(keyId);
    
    // Remove from storage
    try {
      const dir = path.join(this.storageDir, type.toString());
      const filePath = path.join(dir, `${keyId}.json`);
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting ${type} key:`, error);
      return false;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  ✨ Session‑Ticket helpers – used by SecureSocket / DtlsVfsAdapter  */
  /* ------------------------------------------------------------------ */

  /** Save a DTLS 1.3 (PQ‑hybrid) resumption ticket for an endpoint. */
  static saveTicket(endpoint: string, ticket: Uint8Array): void {
    ticketCache.set(endpoint, { ticket, ts: Date.now() });
  }

  /** Retrieve a cached ticket (or undefined if expired / none). */
  static getTicket(endpoint: string): Uint8Array | undefined {
    const entry = ticketCache.get(endpoint);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > SESSION_TICKET_TTL_MS) {
      ticketCache.delete(endpoint);
      return undefined;
    }
    return entry.ticket;
  }

  /** Purge tickets older than the TTL (call from a cron / interval). */
  static rotateTickets(ttlMs: number = SESSION_TICKET_TTL_MS): void {
    const now = Date.now();
    for (const [ep, { ts }] of ticketCache) {
      if (now - ts > ttlMs) ticketCache.delete(ep);
    }
  }
}

// Export a default instance for convenience
let defaultKeyManager: KeyManager | null = null;

/**
 * Initialize the default key manager
 */
export function initializeKeyManager(options: KeyManagerOptions): KeyManager {
  defaultKeyManager = new KeyManager(options);
  return defaultKeyManager;
}

/**
 * Get the default key manager instance
 */
export function getKeyManager(): KeyManager {
  if (!defaultKeyManager) {
    throw new Error('Key manager not initialized. Call initializeKeyManager first.');
  }
  return defaultKeyManager;
}

