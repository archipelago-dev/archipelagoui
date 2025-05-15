"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHandshakeMessage = exports.parseHandshakeMessage = exports.HandshakeType = void 0;
var HandshakeType;
(function (HandshakeType) {
    HandshakeType[HandshakeType["HELLO_REQUEST"] = 0] = "HELLO_REQUEST";
    HandshakeType[HandshakeType["CLIENT_HELLO"] = 1] = "CLIENT_HELLO";
    HandshakeType[HandshakeType["SERVER_HELLO"] = 2] = "SERVER_HELLO";
    HandshakeType[HandshakeType["HELLO_VERIFY_REQUEST"] = 3] = "HELLO_VERIFY_REQUEST";
    HandshakeType[HandshakeType["CERTIFICATE"] = 11] = "CERTIFICATE";
    HandshakeType[HandshakeType["SERVER_KEY_EXCHANGE"] = 12] = "SERVER_KEY_EXCHANGE";
    HandshakeType[HandshakeType["CERTIFICATE_REQUEST"] = 13] = "CERTIFICATE_REQUEST";
    HandshakeType[HandshakeType["SERVER_HELLO_DONE"] = 14] = "SERVER_HELLO_DONE";
    HandshakeType[HandshakeType["CERTIFICATE_VERIFY"] = 15] = "CERTIFICATE_VERIFY";
    HandshakeType[HandshakeType["CLIENT_KEY_EXCHANGE"] = 16] = "CLIENT_KEY_EXCHANGE";
    HandshakeType[HandshakeType["FINISHED"] = 20] = "FINISHED";
})(HandshakeType = exports.HandshakeType || (exports.HandshakeType = {}));
function parseHandshakeMessage(data) {
    const type = data[0];
    const length = (data[1] << 16) | (data[2] << 8) | data[3];
    const messageSeq = (data[4] << 8) | data[5];
    const fragmentOffset = (data[6] << 16) | (data[7] << 8) | data[8];
    const fragmentLength = (data[9] << 16) | (data[10] << 8) | data[11];
    const body = data.slice(12, 12 + fragmentLength);
    return {
        type,
        length,
        messageSeq,
        fragmentOffset,
        fragmentLength,
        body
    };
}
exports.parseHandshakeMessage = parseHandshakeMessage;
function createHandshakeMessage(type, messageSeq, body) {
    const header = Buffer.alloc(12);
    header[0] = type;
    header[1] = (body.length >> 16) & 0xFF;
    header[2] = (body.length >> 8) & 0xFF;
    header[3] = body.length & 0xFF;
    header[4] = (messageSeq >> 8) & 0xFF;
    header[5] = messageSeq & 0xFF;
    header[6] = 0; // fragmentOffset
    header[7] = 0;
    header[8] = 0;
    header[9] = (body.length >> 16) & 0xFF;
    header[10] = (body.length >> 8) & 0xFF;
    header[11] = body.length & 0xFF;
    return Buffer.concat([header, body]);
}
exports.createHandshakeMessage = createHandshakeMessage;
//# sourceMappingURL=DTLSHandshake.js.map