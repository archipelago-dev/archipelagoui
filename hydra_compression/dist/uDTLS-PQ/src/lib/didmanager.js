"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIDManager = void 0;
const bindings_1 = require("./bindings");
/**
 * Decentralized Identifier (DID) support using native bindings.
 * Provides generation, resolution, and registration for DID methods.
 */
class DIDManager {
    constructor() {
        this.nb = bindings_1.nativeBindings;
    }
    /**
     * Generate a new DID and key pair for a given method.
     * @param method DID method name (e.g., 'key', 'web', 'example')
     */
    generateDID(method) {
        const { did, publicKey, privateKey } = this.nb.generateDidKeyPair(method);
        return { did, publicKey, privateKey };
    }
    /**
     * Resolve a DID to its DID Document.
     * @param did Decentralized Identifier
     */
    async resolveDID(did) {
        const docJson = this.nb.resolveDID(did);
        return JSON.parse(docJson.toString());
    }
    /**
     * Register a DID Document on-chain or in a ledger.
     * @param didDocument JSON object representing DID Document
     */
    registerDID(didDocument) {
        const txIdBuf = this.nb.registerDID(Buffer.from(JSON.stringify(didDocument)));
        return txIdBuf.toString('hex');
    }
    /**
     * Deregister or deactivate a DID.
     * @param did Decentralized Identifier to deactivate
     */
    deactivateDID(did) {
        const statusBuf = this.nb.deactivateDID(did);
        return statusBuf.toString('utf-8');
    }
}
exports.DIDManager = DIDManager;
//# sourceMappingURL=didmanager.js.map