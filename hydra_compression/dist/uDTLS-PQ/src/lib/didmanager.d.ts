/// <reference types="node" />
/// <reference types="node" />
import { NativeBindings } from './bindings';
/**
 * Interface for DIDManager with native bindings access
 */
export interface IDIDManager {
    nb: NativeBindings;
    generateDID(method: string): {
        did: string;
        publicKey: Buffer;
        privateKey: Buffer;
    };
    resolveDID(did: string): Promise<any>;
    registerDID(didDocument: any): string;
    deactivateDID(did: string): string;
}
/**
 * Decentralized Identifier (DID) support using native bindings.
 * Provides generation, resolution, and registration for DID methods.
 */
export declare class DIDManager implements IDIDManager {
    nb: NativeBindings;
    constructor();
    /**
     * Generate a new DID and key pair for a given method.
     * @param method DID method name (e.g., 'key', 'web', 'example')
     */
    generateDID(method: string): {
        did: string;
        publicKey: Buffer;
        privateKey: Buffer;
    };
    /**
     * Resolve a DID to its DID Document.
     * @param did Decentralized Identifier
     */
    resolveDID(did: string): Promise<any>;
    /**
     * Register a DID Document on-chain or in a ledger.
     * @param didDocument JSON object representing DID Document
     */
    registerDID(didDocument: any): string;
    /**
     * Deregister or deactivate a DID.
     * @param did Decentralized Identifier to deactivate
     */
    deactivateDID(did: string): string;
}
