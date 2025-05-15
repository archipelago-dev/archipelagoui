// This file imports all the modules we've fixed to check for TypeScript errors
import { DTLSSocket, DTLSVersion, VerifyMode, ConnectionState, DTLSConnectionOptions, EnhancedDTLSOptions } from './lib/types';
import { CompatibilityManager } from './CompatibilityLayer';
import { ClientHello, ServerHello, NegotiatedParameters } from './DTLSHandshake';
import { PQCipherSuite } from './PQCipherSuite';
import { DTLSConnection } from './DTLSConnection';
import { EnhancedDTLSSocket } from './EnhancedDTLSSocket';
import { PQKeyExchange } from './PQKeyExchange';
import { PQCertificateManager } from './PQCertificateManager';

// Just a simple function to verify that everything compiles
function checkCompilation() {
    console.log('All modules imported successfully!');
    
    // Create instances of each class to verify they compile
    const compatManager = new CompatibilityManager();
    const connection = new DTLSConnection({
        socket: null as any,
        context: { id: 1 },
        peerAddress: '127.0.0.1',
        peerPort: 5684
    });
    const socket = new EnhancedDTLSSocket({
        address: '127.0.0.1',
        port: 5684
    });
    const keyExchange = new PQKeyExchange();
    const certManager = new PQCertificateManager();
    
    console.log('All classes instantiated successfully!');
}

checkCompilation();