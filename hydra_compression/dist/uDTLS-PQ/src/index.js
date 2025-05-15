'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.dtls = void 0;
const udtls_pq_1 = require("./udtls-pq");
const dtls = new udtls_pq_1.DTLS({
    isServer: false, securityLevel: udtls_pq_1.SecurityLevel.HYBRID, cert: Buffer.from('mock-cert'), key: Buffer.from('mock-key')
});
exports.dtls = dtls;
//# sourceMappingURL=index.js.map