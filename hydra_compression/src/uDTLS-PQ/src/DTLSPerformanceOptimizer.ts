import {DTLSSocket} from "./lib/types";

export class DTLSPerformanceOptimizer {
    constructor(private socket: DTLSSocket) {
        this.applyOptimizations();
    }

    private applyOptimizations(): void {
        // Use Buffer pools to reduce allocation overhead
        this.socket.useBufferPool({
            initialSize: 1024 * 1024, // 1 MB initial pool
            packetSizes: [512, 1024, 4096, 16384] // Common packet sizes
        });

        // Pre-compute cryptographic parameters where possible
        this.socket.enableCryptoPrecomputation({
            dhParamsCache: true,
            staticKeyCache: true
        });

        // Batch small packets when possible
        this.socket.enablePacketBatching({
            maxDelay: 5, // ms
            maxSize: 16384 // bytes
        });
    }
}