"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CompatibilityLayer_1 = require("./CompatibilityLayer");
const DTLSConnection_1 = require("./DTLSConnection");
const EnhancedDTLSSocket_1 = require("./EnhancedDTLSSocket");
const PQKeyExchange_1 = require("./PQKeyExchange");
const PQCertificateManager_1 = require("./PQCertificateManager");
// Just a simple function to verify that everything compiles
function checkCompilation() {
    console.log('All modules imported successfully!');
    // Create instances of each class to verify they compile
    const compatManager = new CompatibilityLayer_1.CompatibilityManager();
    const connection = new DTLSConnection_1.DTLSConnection({
        socket: null,
        context: { id: 1 },
        peerAddress: '127.0.0.1',
        peerPort: 5684
    });
    const socket = new EnhancedDTLSSocket_1.EnhancedDTLSSocket({
        address: '127.0.0.1',
        port: 5684
    });
    const keyExchange = new PQKeyExchange_1.PQKeyExchange();
    const certManager = new PQCertificateManager_1.PQCertificateManager();
    console.log('All classes instantiated successfully!');
}
checkCompilation();
//# sourceMappingURL=check-errors.js.map