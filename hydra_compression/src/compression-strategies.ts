// src/compression-strategies.ts

import * as os from 'node:os'
import { createSocket, Socket as DTLSSocket, DtlsOptions } from 'node-dtls-client'
import { LZ4Stream, LZ4CompressorStream } from 'lz4'             // lz4 v1.10
import { init, compress as zstdCompress, decompress as zstdDecompress } from '@bokuweb/zstd-wasm';                            // zstd-wasm
import snappy from 'snappy-wasm'
import * as crypto from 'node:crypto'
import * as dgram from 'node:dgram'

// ---------- 1. Strategy Detection ----------

function detectStrategy(): 'lz4' | 'zstd' | 'snappy' {
    const arch = os.arch()           // 'x64', 'arm', etc.
    const cpus = os.cpus().length
    const memGB = os.totalmem() / (1024 ** 3)

    // First choice: LZ4 on multi-core, non-ARM or >4 cores
    if ((arch !== 'arm' && cpus >= 2) || cpus >= 4) return 'lz4'
    // Alternative: Zstd when we have at least 1 GB but <4 cores
    if (memGB >= 1) return 'zstd'
    // Legacy: Snappy on low-spec ARMv7
    return 'snappy'
}

// ---------- 2. Compressors ----------

async function compressLZ4(buffer: Buffer): Promise<Buffer> {
    // Multithreaded streaming compressor
    const comp = new LZ4CompressorStream({ blockSizeKB: 64 })
    comp.end(buffer)
    const chunks: Buffer[] = []
    for await (const chunk of comp) chunks.push(chunk as Buffer)
    return Buffer.concat(chunks)
}

async function compressZstd(buffer: Buffer, level = 3): Promise<Buffer> {
    // constrained memory mode
    const ctx = new zstd.ZstdCompressContext()
    ctx.setParameter(zstd.parameter.windowLog, 18)  // ZSTD_c_windowLog=18
    return Buffer.from(ctx.compress(buffer, level))
}

async function compressSnappy(buffer: Buffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) =>
        snappy.compress(buffer, (err, compressed) => err ? reject(err) : resolve(compressed))
    )
}

// ---------- 3. AES-GCM Encryption ----------

function encryptAESGCM(plain: Buffer, key: Buffer, iv: Buffer): Buffer {
    const cipher = crypto.createCipheriv('aes-128-gcm', key, iv)
    const data = Buffer.concat([cipher.update(plain), cipher.final()])
    const tag  = cipher.getAuthTag()
    return Buffer.concat([data, tag])
}

// ---------- 4. DTLS Transport Wrapper ----------

interface DTLSConfig {
    host: string
    port: number
    pskIdentity: string
    pskKey: Buffer
}

function createDTLSSocket(cfg: DTLSConfig): Promise<DTLSSocket> {
    return new Promise((resolve, reject) => {
        const opts: DtlsOptions = {
            type: 'udp4',
            port: cfg.port,
            address: cfg.host,
            psk: { [cfg.pskIdentity]: cfg.pskKey },
            handshakeTimeout: 1000,
        }
        const sock = createSocket(opts)
        sock.on('connected', () => resolve(sock))
        sock.on('error', reject)
    })
}

// ---------- 5. Master API ----------

export interface SendOptions {
    strategy?: 'lz4' | 'zstd' | 'snappy'
    aesKey: Buffer        // 16-byte AES key
    aesIV: Buffer         // 12-byte IV for GCM
    dtls: DTLSConfig
}

export async function compressAndSend(
    payload: Buffer,
    opts: SendOptions
): Promise<void> {
    // 1. Pick strategy
    const strat = opts.strategy ?? detectStrategy()

    // 2. Compress
    let compressed: Buffer
    switch (strat) {
        case 'lz4':    compressed = await compressLZ4(payload); break
        case 'zstd':   compressed = await compressZstd(payload); break
        case 'snappy': compressed = await compressSnappy(payload); break
    }

    // 3. Encrypt
    const encrypted = encryptAESGCM(compressed, opts.aesKey, opts.aesIV)

    // 4. Send over DTLS
    const dtlsSocket = await createDTLSSocket(opts.dtls)
    dtlsSocket.send(encrypted)
    dtlsSocket.close()
}
