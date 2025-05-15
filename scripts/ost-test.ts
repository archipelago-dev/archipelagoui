import * as fs from 'fs/promises';
import * as path from 'path';
import { OSTEncoder } from '../hydra_compression/src/ost/OSTEncoder';
import { OSTDecoder } from '../hydra_compression/src/ost/OSTDecoder';

const encoder = new OSTEncoder({
    classify: true,
    compression: 'deflate',
    windowSize: 512
});

const decoder = new OSTDecoder();

async function runOSTTest(filePath: string) {
    const input = await fs.readFile(filePath);
    console.log(`📥 Loaded: ${input.length} bytes from ${filePath}`);

    const compressed = await encoder.encode(input);
    console.log(`🗜 Compressed to: ${compressed.length} bytes`);

    const decompressed = await decoder.decode(compressed);
    console.log(`📤 Decoded: ${decompressed.length} bytes`);

    const match = Buffer.compare(input, decompressed) === 0;
    console.log(match ? '✅ Roundtrip success!' : '❌ Data mismatch!');

    if (!match) {
        const diffIndex = input.findIndex((b, i) => b !== decompressed[i]);
        console.log(`⚠️ Difference starts at byte: ${diffIndex}`);
    }
}

const file = process.argv[2];
if (!file) {
    console.error('❗ Usage: pnpm tsx scripts/ost-test.ts ./file.txt');
    process.exit(1);
}

runOSTTest(path.resolve(file)).catch(console.error);
