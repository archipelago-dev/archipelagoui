"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DTLSPerformanceOptimizer = void 0;
class DTLSPerformanceOptimizer {
    constructor(socket) {
        this.socket = socket;
        this.applyOptimizations();
    }
    applyOptimizations() {
        // Use Buffer pools to reduce allocation overhead
        this.socket.useBufferPool({
            initialSize: 1024 * 1024,
            packetSizes: [512, 1024, 4096, 16384] // Common packet sizes
        });
        // Pre-compute cryptographic parameters where possible
        this.socket.enableCryptoPrecomputation({
            dhParamsCache: true,
            staticKeyCache: true
        });
        // Batch small packets when possible
        this.socket.enablePacketBatching({
            maxDelay: 5,
            maxSize: 16384 // bytes
        });
    }
}
exports.DTLSPerformanceOptimizer = DTLSPerformanceOptimizer;
//# sourceMappingURL=DTLSPerformanceOptimizer.js.map