"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DTLSContext = exports.DTLSVersion = exports.VerifyMode = void 0;
const PQCertificateManager_1 = require("./PQCertificateManager");
/**
 * Verification modes for certificate verification
 */
var VerifyMode;
(function (VerifyMode) {
    VerifyMode[VerifyMode["NONE"] = 0] = "NONE";
    VerifyMode[VerifyMode["PEER"] = 1] = "PEER";
    VerifyMode[VerifyMode["FAIL_IF_NO_PEER_CERT"] = 2] = "FAIL_IF_NO_PEER_CERT";
    VerifyMode[VerifyMode["CLIENT_ONCE"] = 4] = "CLIENT_ONCE";
})(VerifyMode = exports.VerifyMode || (exports.VerifyMode = {}));
/**
 * DTLS protocol versions
 */
var DTLSVersion;
(function (DTLSVersion) {
    DTLSVersion["DTLS_1_0"] = "DTLS 1.0";
    DTLSVersion["DTLS_1_2"] = "DTLS 1.2";
    DTLSVersion["DTLS_1_3"] = "DTLS 1.3";
})(DTLSVersion = exports.DTLSVersion || (exports.DTLSVersion = {}));
/**
 * Manages DTLS context settings and certificates
 * This is a TypeScript implementation of the functionality provided by SSL_CTX in OpenSSL
 */
class DTLSContext {
    /**
     * Create a new DTLS context
     * @param options Context options
     */
    constructor(options) {
        this.id = DTLSContext.nextId++;
        this.isServer = options.isServer;
        this.certificateManager = new PQCertificateManager_1.PQCertificateManager();
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
    static getContextById(id) {
        return DTLSContext.contexts.get(id);
    }
    /**
     * Free a context by ID
     * @param id Context ID
     * @returns true if the context was found and freed, false otherwise
     */
    static freeContext(id) {
        return DTLSContext.contexts.delete(id);
    }
    /**
     * Set certificate and private key
     * @param cert Certificate as Buffer or string
     * @param key Private key as Buffer or string
     */
    setCertificateAndKey(cert, key) {
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
    getCertificate() {
        return this.certificate;
    }
    /**
     * Get the private key
     * @returns The private key or undefined if not set
     */
    getPrivateKey() {
        return this.privateKey;
    }
    /**
     * Check if this is a server context
     * @returns true if this is a server context, false otherwise
     */
    isServerContext() {
        return this.isServer;
    }
    /**
     * Get the cipher suites
     * @returns Array of cipher suite strings
     */
    getCipherSuites() {
        return [...this.cipherSuites];
    }
    /**
     * Get the post-quantum cipher suites
     * @returns Array of PQCipherSuite enums
     */
    getPQCipherSuites() {
        return [...this.pqCipherSuites];
    }
    /**
     * Get the minimum DTLS version
     * @returns The minimum DTLS version
     */
    getMinVersion() {
        return this.minVersion;
    }
    /**
     * Get the maximum DTLS version
     * @returns The maximum DTLS version
     */
    getMaxVersion() {
        return this.maxVersion;
    }
    /**
     * Get the verify mode
     * @returns The verify mode
     */
    getVerifyMode() {
        return this.verifyMode;
    }
    /**
     * Check if certificate transparency is enabled
     * @returns true if certificate transparency is enabled, false otherwise
     */
    isCertTransparencyEnabled() {
        return this.enableCertTransparency;
    }
    /**
     * Check if OCSP stapling is enabled
     * @returns true if OCSP stapling is enabled, false otherwise
     */
    isOCSPStaplingEnabled() {
        return this.ocspStapling;
    }
    /**
     * Get the CRL distribution points
     * @returns Array of CRL distribution point URIs
     */
    getCRLDistributionPoints() {
        return [...this.crlDistributionPoints];
    }
    /**
     * Get the certificate policies
     * @returns Array of certificate policy OIDs
     */
    getCertificatePolicies() {
        return [...this.certificatePolicies];
    }
    /**
     * Get the certificate manager
     * @returns The certificate manager
     */
    getCertificateManager() {
        return this.certificateManager;
    }
    /**
     * Free this context
     * This removes it from the static map
     */
    free() {
        DTLSContext.contexts.delete(this.id);
    }
}
exports.DTLSContext = DTLSContext;
DTLSContext.nextId = 1;
DTLSContext.contexts = new Map();
//# sourceMappingURL=DTLSContext.js.map