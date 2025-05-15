"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OSTPackWriter = void 0;
const OSTCompression_1 = require("./OSTCompression");
class OSTPackWriter {
    static async createPack(data, config = {}) {
        const compressor = new OSTCompression_1.OSTCompression(config);
        const { compressedBins, metadata } = compressor.encode(data);
        const binSequence = Array.from(compressedBins.keys());
        const headerJson = JSON.stringify({
            config: metadata.config,
            binSequence,
            bins: binSequence
        });
        const headerBytes = new TextEncoder().encode(headerJson);
        const headerLen = headerBytes.length;
        // Header
        const headerBuf = new Uint8Array(8 + headerLen);
        headerBuf.set([0x4F, 0x53, 0x54, 0x31]); // "OST1"
        headerBuf[4] = (headerLen >> 24) & 0xff;
        headerBuf[5] = (headerLen >> 16) & 0xff;
        headerBuf[6] = (headerLen >> 8) & 0xff;
        headerBuf[7] = headerLen & 0xff;
        headerBuf.set(headerBytes, 8);
        // Bin payload
        const binParts = [headerBuf];
        // @ts-ignore
        for (const [label, data] of compressedBins.entries()) {
            const labelBytes = new TextEncoder().encode(label);
            const labelLen = labelBytes.length;
            const lenBuf = new Uint8Array(2 + labelLen + 4 + data.length);
            lenBuf[0] = (labelLen >> 8) & 0xff;
            lenBuf[1] = labelLen & 0xff;
            lenBuf.set(labelBytes, 2);
            lenBuf[2 + labelLen + 0] = (data.length >> 24) & 0xff;
            lenBuf[2 + labelLen + 1] = (data.length >> 16) & 0xff;
            lenBuf[2 + labelLen + 2] = (data.length >> 8) & 0xff;
            lenBuf[2 + labelLen + 3] = data.length & 0xff;
            lenBuf.set(data, 2 + labelLen + 4);
            binParts.push(lenBuf);
        }
        // Combine all
        const totalLen = binParts.reduce((s, b) => s + b.length, 0);
        const result = new Uint8Array(totalLen);
        let offset = 0;
        for (const buf of binParts) {
            result.set(buf, offset);
            offset += buf.length;
        }
        return result;
    }
}
exports.OSTPackWriter = OSTPackWriter;
//# sourceMappingURL=OSTPackWriter.js.map