"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedDTLSSocket = void 0;
const types_1 = require("./lib/types");
class EnhancedDTLSSocket extends types_1.DTLSSocket {
    // Auto-rekeying based on time or data volume
    constructor(options) {
        super(options);
        this.earlyData = null;
        if (options.autoRekey) {
            this.setupAutoRekeying(options.rekeyInterval || 3600000, // Default: 1 hour
            options.rekeyDataLimit || 1024 * 1024 * 100 // Default: 100 MB
            );
        }
        if (options.earlyData) {
            this.enableZeroRTT(options.earlyDataSize || 16384); // Default: 16 KB max
        }
    }
    // Forward secrecy with ephemeral keys
    setupAutoRekeying(timeInterval, dataLimit) {
        let lastRekeyTime = Date.now();
        let bytesSinceRekey = 0;
        this.on('data', (data) => {
            bytesSinceRekey += data.length;
            const timeElapsed = Date.now() - lastRekeyTime;
            if (timeElapsed > timeInterval || bytesSinceRekey > dataLimit) {
                this.rekey()
                    .then(() => {
                    lastRekeyTime = Date.now();
                    bytesSinceRekey = 0;
                })
                    .catch((err) => this.emit('error', new Error(`Rekeying failed: ${err.message}`)));
            }
        });
    }
    // Zero-RTT resumption with safety mechanisms
    async connectWithEarlyData(data) {
        if (!this.hasValidSessionTicket()) {
            // Fall back to regular handshake if no valid session ticket
            await this.connect();
            await this.send(data);
            return;
        }
        // Send early data during handshake
        this.earlyData = data;
        await this.connect({
            earlyData: true,
            antiReplay: true, // Protect against replay attacks
        });
    }
    // Enable Zero-RTT (0-RTT) data
    enableZeroRTT(maxSize) {
        // Implementation would configure the DTLS stack to support 0-RTT
        // This is a placeholder for the actual implementation
    }
    // Rekey the connection
    async rekey() {
        // Implementation would trigger a key update in the DTLS connection
        // This is a placeholder for the actual implementation
        return Promise.resolve();
    }
}
exports.EnhancedDTLSSocket = EnhancedDTLSSocket;
//# sourceMappingURL=EnhancedDTLSSocket.js.map