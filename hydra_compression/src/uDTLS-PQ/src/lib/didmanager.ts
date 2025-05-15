import { NativeBindings, nativeBindings } from './bindings';

/**
 * Interface for DIDManager with native bindings access
 */
export interface IDIDManager {
    nb: NativeBindings;
    generateDID(method: string): { did: string; publicKey: Buffer; privateKey: Buffer };
    resolveDID(did: string): Promise<any>;
    registerDID(didDocument: any): string;
    deactivateDID(did: string): string;
}

/**
 * Decentralized Identifier (DID) support using native bindings.
 * Provides generation, resolution, and registration for DID methods.
 */
export class DIDManager implements IDIDManager {
    public nb: NativeBindings;

    constructor() {
        this.nb = nativeBindings;
    }

    /**
     * Generate a new DID and key pair for a given method.
     * @param method DID method name (e.g., 'key', 'web', 'example')
     */
    public generateDID(method: string): { did: string; publicKey: Buffer; privateKey: Buffer } {
        const { did, publicKey, privateKey } = this.nb.generateDidKeyPair(method);
        return { did, publicKey, privateKey };
    }

    /**
     * Resolve a DID to its DID Document.
     * @param did Decentralized Identifier
     */
    public async resolveDID(did: string): Promise<any> {
        const docJson = this.nb.resolveDID(did);
        return JSON.parse(docJson.toString());
    }

    /**
     * Register a DID Document on-chain or in a ledger.
     * @param didDocument JSON object representing DID Document
     */
    public registerDID(didDocument: any): string {
        const txIdBuf = this.nb.registerDID(Buffer.from(JSON.stringify(didDocument)));
        return txIdBuf.toString('hex');
    }

    /**
     * Deregister or deactivate a DID.
     * @param did Decentralized Identifier to deactivate
     */
    public deactivateDID(did: string): string {
        const statusBuf = this.nb.deactivateDID(did);
        return statusBuf.toString('utf-8');
    }
}
