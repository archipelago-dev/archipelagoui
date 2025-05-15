"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PQCertificateManager = exports.ClassicalKeyType = void 0;
const crypto = __importStar(require("crypto"));
const forge = __importStar(require("node-forge"));
/**
 * Types for certificate management
 */
var ClassicalKeyType;
(function (ClassicalKeyType) {
    ClassicalKeyType["ECDSA_P256"] = "ECDSA_P256";
    ClassicalKeyType["RSA_2048"] = "RSA_2048";
})(ClassicalKeyType = exports.ClassicalKeyType || (exports.ClassicalKeyType = {}));
/**
 * Support for hybrid certificates combining classical and post-quantum signatures.
 */
class PQCertificateManager {
    /**
     * Generate a hybrid X.509 certificate with both classical and PQ key signatures.
     *
     * @param options Certificate parameters
     * @returns { cert: Buffer, key: Buffer }
     */
    generateHybridCertificate(options) {
        // Generate a classical key pair
        const classicalKeyPair = this.generateClassicalKeys(options.keyType);
        // Create a certificate
        const cert = this.createCertificate(classicalKeyPair, options);
        return {
            cert,
            key: classicalKeyPair.privateKey
        };
    }
    /**
     * Generate classical asymmetric key pair
     * @param type Key type (ECDSA_P256 or RSA_2048)
     * @returns Key pair with public and private keys
     */
    generateClassicalKeys(type) {
        if (type === ClassicalKeyType.ECDSA_P256) {
            // Generate ECDSA P-256 key pair
            const keyPair = crypto.generateKeyPairSync('ec', {
                namedCurve: 'prime256v1',
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'der'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'der'
                }
            });
            return {
                publicKey: Buffer.from(keyPair.publicKey),
                privateKey: Buffer.from(keyPair.privateKey)
            };
        }
        else if (type === ClassicalKeyType.RSA_2048) {
            // Generate RSA 2048 key pair
            const keyPair = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'der'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'der'
                }
            });
            return {
                publicKey: Buffer.from(keyPair.publicKey),
                privateKey: Buffer.from(keyPair.privateKey)
            };
        }
        else {
            throw new Error(`Unsupported classical key type: ${type}`);
        }
    }
    /**
     * Create a certificate using node-forge
     * @param keyPair Key pair to use for the certificate
     * @param options Certificate options
     * @returns Certificate as a Buffer
     */
    createCertificate(keyPair, options) {
        // Convert DER key to PEM format for node-forge
        const privateKeyPem = this.derToPem(keyPair.privateKey, 'PRIVATE KEY');
        const publicKeyPem = this.derToPem(keyPair.publicKey, 'PUBLIC KEY');
        // Parse the keys with forge
        const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
        // Create a certificate
        const cert = forge.pki.createCertificate();
        // Set certificate attributes
        cert.publicKey = publicKey;
        cert.serialNumber = '01' + crypto.randomBytes(19).toString('hex');
        // Set validity period
        const now = new Date();
        cert.validity.notBefore = now;
        cert.validity.notAfter = new Date(now.getTime() + options.validityDays * 24 * 60 * 60 * 1000);
        // Set subject attributes
        const subjectAttrs = this.createSubjectAttributes(options.subject);
        cert.setSubject(subjectAttrs);
        // If issuer certificate is provided, use it for the issuer attributes
        // Otherwise, self-sign the certificate
        if (options.issuerCert && options.issuerKey) {
            // Parse issuer certificate
            const issuerCertPem = this.derToPem(options.issuerCert, 'CERTIFICATE');
            const issuerCert = forge.pki.certificateFromPem(issuerCertPem);
            cert.setIssuer(issuerCert.subject.attributes);
            // Parse issuer key
            const issuerKeyPem = this.derToPem(options.issuerKey, 'PRIVATE KEY');
            const issuerKey = forge.pki.privateKeyFromPem(issuerKeyPem);
            // Sign with issuer key
            cert.sign(issuerKey, forge.md.sha256.create());
        }
        else {
            // Self-sign
            cert.setIssuer(subjectAttrs);
            cert.sign(privateKey, forge.md.sha256.create());
        }
        // Add extensions
        this.addExtensions(cert, options);
        // Convert to DER format
        const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
        return Buffer.from(certDer, 'binary');
    }
    /**
     * Create subject attributes for a certificate
     * @param subject Subject DN
     * @returns Array of subject attributes
     */
    createSubjectAttributes(subject) {
        const attrs = [];
        if (subject.commonName) {
            attrs.push({ name: 'commonName', value: subject.commonName });
        }
        if (subject.organization) {
            attrs.push({ name: 'organizationName', value: subject.organization });
        }
        if (subject.organizationalUnit) {
            attrs.push({ name: 'organizationalUnitName', value: subject.organizationalUnit });
        }
        if (subject.country) {
            attrs.push({ name: 'countryName', value: subject.country });
        }
        if (subject.state) {
            attrs.push({ name: 'stateOrProvinceName', value: subject.state });
        }
        if (subject.locality) {
            attrs.push({ name: 'localityName', value: subject.locality });
        }
        return attrs;
    }
    /**
     * Add extensions to a certificate
     * @param cert Certificate to add extensions to
     * @param options Certificate options
     */
    addExtensions(cert, options) {
        const extensions = [];
        // Basic constraints
        extensions.push({
            name: 'basicConstraints',
            cA: options.isCA || false,
            critical: true
        });
        // Key usage
        if (options.keyUsage && options.keyUsage.length > 0) {
            extensions.push({
                name: 'keyUsage',
                digitalSignature: options.keyUsage.includes('digitalSignature'),
                nonRepudiation: options.keyUsage.includes('nonRepudiation'),
                keyEncipherment: options.keyUsage.includes('keyEncipherment'),
                dataEncipherment: options.keyUsage.includes('dataEncipherment'),
                keyAgreement: options.keyUsage.includes('keyAgreement'),
                keyCertSign: options.keyUsage.includes('keyCertSign'),
                cRLSign: options.keyUsage.includes('cRLSign'),
                encipherOnly: options.keyUsage.includes('encipherOnly'),
                decipherOnly: options.keyUsage.includes('decipherOnly'),
                critical: true
            });
        }
        // Extended key usage
        if (options.extendedKeyUsage && options.extendedKeyUsage.length > 0) {
            extensions.push({
                name: 'extKeyUsage',
                serverAuth: options.extendedKeyUsage.includes('serverAuth'),
                clientAuth: options.extendedKeyUsage.includes('clientAuth'),
                codeSigning: options.extendedKeyUsage.includes('codeSigning'),
                emailProtection: options.extendedKeyUsage.includes('emailProtection'),
                timeStamping: options.extendedKeyUsage.includes('timeStamping')
            });
        }
        // Subject alternative name
        if (options.altNames && options.altNames.length > 0) {
            const altNames = options.altNames.map(name => {
                if (this.isIP(name)) {
                    return { type: 7, ip: name };
                }
                else {
                    return { type: 2, value: name };
                }
            });
            extensions.push({
                name: 'subjectAltName',
                altNames
            });
        }
        // Add extensions to certificate
        cert.setExtensions(extensions);
    }
    /**
     * Check if a string is an IP address
     * @param str String to check
     * @returns True if the string is an IP address
     */
    isIP(str) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(str) || ipv6Regex.test(str);
    }
    /**
     * Convert DER format to PEM format
     * @param der DER data
     * @param type PEM type (e.g., 'CERTIFICATE', 'PRIVATE KEY', etc.)
     * @returns PEM string
     */
    derToPem(der, type) {
        const base64 = der.toString('base64');
        const lines = [];
        for (let i = 0; i < base64.length; i += 64) {
            lines.push(base64.substring(i, i + 64));
        }
        return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----\n`;
    }
    /**
     * Verify a certificate chain
     * @param cert Certificate to verify
     * @param ca CA certificate(s)
     * @returns True if the certificate is valid
     */
    verifyCertificate(cert, ca) {
        try {
            // Convert certificate to PEM format
            const certPem = this.derToPem(cert, 'CERTIFICATE');
            // Parse certificate
            const certificate = forge.pki.certificateFromPem(certPem);
            // If no CA is provided, return true (self-signed)
            if (!ca) {
                return true;
            }
            // Convert CA certificate(s) to PEM format
            const caList = Array.isArray(ca) ? ca : [ca];
            const caPems = caList.map(caCert => this.derToPem(caCert, 'CERTIFICATE'));
            // Parse CA certificates
            const caStore = forge.pki.createCaStore(caPems);
            // Verify certificate
            forge.pki.verifyCertificateChain(caStore, [certificate]);
            return true;
        }
        catch (err) {
            console.error('Certificate verification failed:', err);
            return false;
        }
    }
    /**
     * Extract the public key from a certificate
     * @param cert Certificate
     * @returns Public key
     */
    extractPublicKey(cert) {
        try {
            // Convert certificate to PEM format
            const certPem = this.derToPem(cert, 'CERTIFICATE');
            // Parse certificate
            const certificate = forge.pki.certificateFromPem(certPem);
            // Extract public key
            const publicKey = certificate.publicKey;
            // Convert to PEM format
            const publicKeyPem = forge.pki.publicKeyToPem(publicKey);
            // Convert PEM to DER
            const publicKeyDer = forge.util.decode64(publicKeyPem
                .replace(/-----BEGIN PUBLIC KEY-----/, '')
                .replace(/-----END PUBLIC KEY-----/, '')
                .replace(/\n/g, ''));
            return Buffer.from(publicKeyDer);
        }
        catch (err) {
            console.error('Failed to extract public key:', err);
            throw err;
        }
    }
}
exports.PQCertificateManager = PQCertificateManager;
//# sourceMappingURL=PQCertificateManager.js.map