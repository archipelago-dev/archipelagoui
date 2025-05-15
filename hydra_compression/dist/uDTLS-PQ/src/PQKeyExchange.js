"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PQKeyExchange = void 0;
// src/PQKeyExchange.ts
const types_1 = require("./lib/types");
const bindings_1 = __importDefault(require("./lib/bindings")); // default export = nativeBindings
class PQKeyExchange {
    /** Which Kyber flavour to use (default: KYBER768) */
    constructor(algorithm = types_1.PQAlgorithm.KYBER768) {
        this.algorithm = algorithm;
    }
    /** Generate a Kyber public / secret key pair */
    generateKeyPair() {
        return bindings_1.default.generateKyberKeyPair(this.algorithm);
    }
    /** Create a ciphertext + shared‑secret for the peer’s public key */
    encapsulate(publicKey) {
        return bindings_1.default.kyberEncapsulate(publicKey, this.algorithm);
    }
    /** Recover the shared secret from our private key and the peer’s ciphertext */
    decapsulate(privateKey, ciphertext) {
        return bindings_1.default.kyberDecapsulate(privateKey, ciphertext, this.algorithm);
    }
}
exports.PQKeyExchange = PQKeyExchange;
//# sourceMappingURL=PQKeyExchange.js.map