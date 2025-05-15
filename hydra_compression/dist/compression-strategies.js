"use strict";
// src/compression-strategies.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressAndSend = void 0;
const os = __importStar(require("node:os"));
const node_dtls_client_1 = require("node-dtls-client");
const lz4_1 = require("lz4"); // lz4 v1.10
const snappy_wasm_1 = __importDefault(require("snappy-wasm"));
const crypto = __importStar(require("node:crypto"));
// ---------- 1. Strategy Detection ----------
function detectStrategy() {
    const arch = os.arch(); // 'x64', 'arm', etc.
    const cpus = os.cpus().length;
    const memGB = os.totalmem() / (1024 ** 3);
    // First choice: LZ4 on multi-core, non-ARM or >4 cores
    if ((arch !== 'arm' && cpus >= 2) || cpus >= 4)
        return 'lz4';
    // Alternative: Zstd when we have at least 1 GB but <4 cores
    if (memGB >= 1)
        return 'zstd';
    // Legacy: Snappy on low-spec ARMv7
    return 'snappy';
}
// ---------- 2. Compressors ----------
async function compressLZ4(buffer) {
    // Multithreaded streaming compressor
    const comp = new lz4_1.LZ4CompressorStream({ blockSizeKB: 64 });
    comp.end(buffer);
    const chunks = [];
    for await (const chunk of comp)
        chunks.push(chunk);
    return Buffer.concat(chunks);
}
async function compressZstd(buffer, level = 3) {
    // constrained memory mode
    const ctx = new zstd.ZstdCompressContext();
    ctx.setParameter(zstd.parameter.windowLog, 18); // ZSTD_c_windowLog=18
    return Buffer.from(ctx.compress(buffer, level));
}
async function compressSnappy(buffer) {
    return new Promise((resolve, reject) => snappy_wasm_1.default.compress(buffer, (err, compressed) => err ? reject(err) : resolve(compressed)));
}
// ---------- 3. AES-GCM Encryption ----------
function encryptAESGCM(plain, key, iv) {
    const cipher = crypto.createCipheriv('aes-128-gcm', key, iv);
    const data = Buffer.concat([cipher.update(plain), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([data, tag]);
}
function createDTLSSocket(cfg) {
    return new Promise((resolve, reject) => {
        const opts = {
            type: 'udp4',
            port: cfg.port,
            address: cfg.host,
            psk: { [cfg.pskIdentity]: cfg.pskKey },
            handshakeTimeout: 1000,
        };
        const sock = (0, node_dtls_client_1.createSocket)(opts);
        sock.on('connected', () => resolve(sock));
        sock.on('error', reject);
    });
}
async function compressAndSend(payload, opts) {
    // 1. Pick strategy
    const strat = opts.strategy ?? detectStrategy();
    // 2. Compress
    let compressed;
    switch (strat) {
        case 'lz4':
            compressed = await compressLZ4(payload);
            break;
        case 'zstd':
            compressed = await compressZstd(payload);
            break;
        case 'snappy':
            compressed = await compressSnappy(payload);
            break;
    }
    // 3. Encrypt
    const encrypted = encryptAESGCM(compressed, opts.aesKey, opts.aesIV);
    // 4. Send over DTLS
    const dtlsSocket = await createDTLSSocket(opts.dtls);
    dtlsSocket.send(encrypted);
    dtlsSocket.close();
}
exports.compressAndSend = compressAndSend;
//# sourceMappingURL=compression-strategies.js.map