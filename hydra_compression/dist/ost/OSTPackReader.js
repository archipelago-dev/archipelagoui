"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OSTPackReader = void 0;
const OSTCompression_1 = require("./OSTCompression");
class OSTPackReader {
    static async extractPack(pack) {
        // Validate header
        const magic = new TextDecoder().decode(pack.slice(0, 4));
        if (magic !== 'OST1')
            throw new Error('Invalid OST pack format');
        // Extract header length
        const headerLen = (pack[4] << 24) | (pack[5] << 16) | (pack[6] << 8) | pack[7];
        const headerJson = new TextDecoder().decode(pack.slice(8, 8 + headerLen));
        const header = JSON.parse(headerJson);
        const compressedBins = new Map();
        let offset = 8 + headerLen;
        while (offset < pack.length) {
            const labelLen = (pack[offset] << 8) | pack[offset + 1];
            const label = new TextDecoder().decode(pack.slice(offset + 2, offset + 2 + labelLen));
            const dataLenOffset = offset + 2 + labelLen;
            const dataLen = (pack[dataLenOffset + 0] << 24) |
                (pack[dataLenOffset + 1] << 16) |
                (pack[dataLenOffset + 2] << 8) |
                pack[dataLenOffset + 3];
            const data = pack.slice(dataLenOffset + 4, dataLenOffset + 4 + dataLen);
            compressedBins.set(label, data);
            offset = dataLenOffset + 4 + dataLen;
        }
        const compressor = new OSTCompression_1.OSTCompression(header.config);
        return compressor.decode({ compressedBins, metadata: { ...header } });
    }
}
exports.OSTPackReader = OSTPackReader;
//# sourceMappingURL=OSTPackReader.js.map