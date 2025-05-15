/**
 * OST Compression - A TypeScript implementation for encoding and decoding data
 * using the Okaily-Srivastava-Tbakhi (OST) compression algorithm.
 *
 * Based on the algorithm described in the paper where data is organized into bins
 * of similar content before applying compression techniques.
 */

export let compress: (data: Uint8Array) => Promise<Uint8Array>;
export let decompress: (data: Uint8Array) => Promise<Uint8Array>;

if (typeof window === 'undefined') {
    // Node.js — use native zlib.brotliCompress / brotliDecompress
    const { brotliCompress, brotliDecompress } = await import('zlib');
    const { promisify } = await import('util');

    compress   = promisify(brotliCompress) as any;
    decompress = promisify(brotliDecompress) as any;
} else {
    // Browser stub — not supported (you can swap in a WASM Brotli if you need!)
    compress   = async () => { throw new Error('OSTCompression.compress() is not supported in the browser'); };
    decompress = async () => { throw new Error('OSTCompression.decompress() is not supported in the browser'); };
}


// Configuration for the compression algorithm
interface OSTConfig {
    windowLength: number;        // Length of each window for binning
    labelLength: number;         // Label length for bin classification
    variableWindow?: boolean;    // Whether to use variable window length
    compressionMethod: string;   // Method used to compress bins (e.g., 'huffman', 'brotli', etc.)
    subBinning?: boolean;        // Whether to apply nested binning for further compression
    subBinningDepth?: number;    // How many levels of sub-binning to apply
}

// Define the default configuration
const DEFAULT_CONFIG: OSTConfig = {
    windowLength: 1000,
    labelLength: 4,
    variableWindow: false,
    compressionMethod: 'huffman',
    subBinning: false,
    subBinningDepth: 0
};

/**
 * Represents a bin containing similar data segments
 */
class Bin {
    label: string;
    segments: string[];

    constructor(label: string) {
        this.label = label;
        this.segments = [];
    }

    addSegment(segment: string): void {
        this.segments.push(segment);
    }

    getData(): string {
        return this.segments.join('');
    }
}

/**
 * Huffman Tree Node for frequency-based encoding
 */
class HuffmanNode {
    char: string;
    frequency: number;
    left: HuffmanNode | null;
    right: HuffmanNode | null;

    constructor(char: string, frequency: number, left: HuffmanNode | null = null, right: HuffmanNode | null = null) {
        this.char = char;
        this.frequency = frequency;
        this.left = left;
        this.right = right;
    }

    isLeaf(): boolean {
        return this.left === null && this.right === null;
    }
}

/**
 * Main class for OST Compression
 */
export class OSTCompression {
    private config: OSTConfig;

    constructor(config: Partial<OSTConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Encodes the input data using the OST algorithm
     *
     * @param data The data to be compressed
     * @returns An object containing the compressed data and metadata
     */
    async encode(data: string):Promise< {
        compressedBins: Map<string, Uint8Array>,
        metadata: {
            windowLengths?: number[],
            config: OSTConfig
        }
    }> {
        // Step 1: Divide the input data into windows
        const windows = this.divideIntoWindows(data);

        // Step 2: Generate a label for each window
        const labeledWindows = windows.map(window => ({
            window,
            label: this.generateLabel(window)
        }));

        // Step 3: Group windows by their labels (binning)
        const bins = this.groupIntoBins(labeledWindows);

        // Step 4: Compress each bin
        const compressedBins = new Map<string, Uint8Array>();

        // @ts-ignore
        for (const [label, bin] of bins.entries()) {
            const compressedData = this.compressBin(bin);
            compressedBins.set(label, await compressedData);
        }

        // Return the compressed data with metadata
        return {
            compressedBins,
            metadata: {
                config: this.config
            }
        };
    }

    /**
     * Decodes the compressed data back to its original form
     *
     * @param compressedData The object containing compressed bins and metadata
     * @returns The original uncompressed data
     */
    async decode(compressedData: {
        compressedBins: Map<string, Uint8Array>,
        metadata: {
            windowLengths?: number[],
            config: OSTConfig
        }
    }): Promise<string> {
        const { compressedBins, metadata } = compressedData;
        const { windowLengths } = metadata;

        // List of bins in their original order
        const binOrder: string[] = [];

        // If we used variable window length, get the window lengths array
        const variableWindow = windowLengths !== undefined;

        // Decompress each bin
        const decompressedBins = new Map<string, string>();

        // @ts-ignore
        for (const [label, compressedBin] of compressedBins.entries()) {
            const decompressedData = await this.decompressBin(compressedBin);
            decompressedBins.set(label, decompressedData);
        }

        // TODO: Reconstruct the original data using the bin order and window lengths
        // This part would require more information about how the encoding process preserves the order

        // For now, we'll return a placeholder
        return "Decompression process would reconstruct the original data here";
    }

    /**
     * Divides the input data into windows of specified length
     *
     * @param data The input data
     * @returns Array of windows
     */
    private divideIntoWindows(data: string): string[] {
        const windows: string[] = [];
        const { windowLength, variableWindow } = this.config;

        if (!variableWindow) {
            // Fixed window length
            for (let i = 0; i < data.length; i += windowLength) {
                const end = Math.min(i + windowLength, data.length);
                windows.push(data.substring(i, end));
            }
        } else {
            // Variable window length
            // This would require a more sophisticated algorithm to determine
            // the optimal window size for each segment
            // For now, we'll use a simple implementation
            let i = 0;
            while (i < data.length) {
                let currentWindowLength = windowLength;
                // Extend window until we find a matching bin label
                // This is a simplified placeholder implementation
                const end = Math.min(i + currentWindowLength, data.length);
                windows.push(data.substring(i, end));
                i = end;
            }
        }

        return windows;
    }

    /**
     * Generates a label for a window using the Huffman encoding strategy
     *
     * @param window The window to generate a label for
     * @returns The label string
     */
    private generateLabel(window: string): string {
        // Count frequency of each character
        const frequencyMap = new Map<string, number>();

        for (const char of window) {
            const count = frequencyMap.get(char) || 0;
            frequencyMap.set(char, count + 1);
        }

        // Build Huffman tree
        const tree = this.buildHuffmanTree(frequencyMap);

        // Generate Huffman codes for each character
        const huffmanCodes = new Map<string, string>();
        this.generateHuffmanCodes(tree, "", huffmanCodes);

        // Create label based on the Huffman encoding
        // The label is created by sorting characters by their encoding length
        // and taking the first n characters, where n is the label length
        const charsByEncodingLength: { char: string, encodingLength: number }[] = [];

        // @ts-ignore
        for (const [char, code] of huffmanCodes.entries()) {
            charsByEncodingLength.push({ char, encodingLength: code.length });
        }

        // Sort by encoding length (shorter codes appear first, as they're more frequent)
        charsByEncodingLength.sort((a, b) => a.encodingLength - b.encodingLength);

        // Generate the label based on the config's labelLength
        let label = "";
        let encodingLengths = "";

        for (let i = 0; i < Math.min(this.config.labelLength, charsByEncodingLength.length); i++) {
            const { char, encodingLength } = charsByEncodingLength[i];
            label += char;
            encodingLengths += encodingLength;
        }

        return `${label} ${encodingLengths}`;
    }

    /**
     * Builds a Huffman tree from a frequency map
     *
     * @param frequencyMap Map of character frequencies
     * @returns The root node of the Huffman tree
     */
    private buildHuffmanTree(frequencyMap: Map<string, number>): HuffmanNode {
        // Create a leaf node for each character
        const nodes: HuffmanNode[] = [];

        // @ts-ignore
        for (const [char, frequency] of frequencyMap.entries()) {
            nodes.push(new HuffmanNode(char, frequency));
        }

        // Build the Huffman tree by combining nodes
        while (nodes.length > 1) {
            // Sort nodes by frequency (ascending)
            nodes.sort((a, b) => a.frequency - b.frequency);

            // Take the two nodes with lowest frequencies
            const left = nodes.shift()!;
            const right = nodes.shift()!;

            // Create a new internal node with these two nodes as children
            // and with frequency equal to the sum of the two nodes' frequencies
            const newNode = new HuffmanNode('\0', left.frequency + right.frequency, left, right);

            // Add the new node back to the queue
            nodes.push(newNode);
        }

        // The last remaining node is the root of the Huffman tree
        return nodes[0];
    }

    /**
     * Recursively generates Huffman codes for each character
     *
     * @param node Current node in the Huffman tree
     * @param code Current code
     * @param huffmanCodes Map to store character codes
     */
    private generateHuffmanCodes(
        node: HuffmanNode,
        code: string,
        huffmanCodes: Map<string, string>
    ): void {
        if (node === null) return;

        // If this is a leaf node, store the code
        if (node.isLeaf()) {
            huffmanCodes.set(node.char, code);
            return;
        }

        // Traverse left and right children
        this.generateHuffmanCodes(node.left!, code + "0", huffmanCodes);
        this.generateHuffmanCodes(node.right!, code + "1", huffmanCodes);
    }

    /**
     * Groups labeled windows into bins with the same label
     *
     * @param labeledWindows Array of windows with their labels
     * @returns Map of bins by label
     */
    private groupIntoBins(
        labeledWindows: Array<{ window: string, label: string }>
    ): Map<string, Bin> {
        const bins = new Map<string, Bin>();

        for (const { window, label } of labeledWindows) {
            if (!bins.has(label)) {
                bins.set(label, new Bin(label));
            }

            bins.get(label)!.addSegment(window);
        }

        return bins;
    }

    /**
     * Compresses a bin using the configured compression method
     *
     * @param bin The bin to compress
     * @returns Compressed data as Uint8Array
     */
    private async compressBin(bin: Bin): Promise<Uint8Array> {
        const data = new TextEncoder().encode(bin.getData());

        switch (this.config.compressionMethod) {
            case 'huffman':
                return this.huffmanCompress(bin.getData());
            case 'brotli':
                return brotliCompress(data);
            case 'zstd':
                let result;
             zstdCompress(data, (error, result): Uint8Array => {
                    if (error) {
                        console.error('ZSTD compression error:', error);
                        return new Uint8Array(0);
                    } else {
                        return result;
                    }
                });

            case 'raw':
            default:
                return data;
        }
    }



    /**
     * Decompresses a bin using the configured compression method
     *
     * @param compressedData The compressed data
     * @returns Decompressed data as string
     */
    private async decompressBin(compressedData: Uint8Array): Promise<string> {
        switch (this.config.compressionMethod) {
            case 'huffman':
                return this.huffmanDecompress(compressedData);
            case 'brotli':
                return new TextDecoder().decode(await brotliDecompress(compressedData));
            case 'zstd':
                zstdDecompress(compressedData, (error, result): Uint8Array => {
                    return result;
                });
            case 'raw':
            default:
                return new TextDecoder().decode(compressedData);
        }
    }

    /**
     * Compresses data using Huffman coding
     *
     * @param data The data to compress
     * @returns Compressed data as Uint8Array
     */
    private huffmanCompress(data: string): Uint8Array {
        // Count frequency of each character
        const frequencyMap = new Map<string, number>();

        for (const char of data) {
            const count = frequencyMap.get(char) || 0;
            frequencyMap.set(char, count + 1);
        }

        // Build Huffman tree
        const tree = this.buildHuffmanTree(frequencyMap);

        // Generate Huffman codes for each character
        const huffmanCodes = new Map<string, string>();
        this.generateHuffmanCodes(tree, "", huffmanCodes);

        // Encode the data
        let encodedBits = "";
        for (const char of data) {
            encodedBits += huffmanCodes.get(char);
        }

        // Convert bit string to bytes
        const bytes = new Uint8Array(Math.ceil(encodedBits.length / 8));

        for (let i = 0; i < encodedBits.length; i += 8) {
            const byte = encodedBits.slice(i, i + 8).padEnd(8, '0');
            bytes[i / 8] = parseInt(byte, 2);
        }

        // We need to store the Huffman tree for decompression
        // This is a simplified approach - in a real implementation,
        // we would serialize the tree or the frequency table
        const treeData = JSON.stringify(Array.from(frequencyMap.entries()));
        const treeBytes = new TextEncoder().encode(treeData);

        // Combine tree data and encoded bytes
        const result = new Uint8Array(treeBytes.length + 4 + bytes.length);

        // Store tree data length (4 bytes)
        const treeLength = treeBytes.length;
        result[0] = (treeLength >> 24) & 0xFF;
        result[1] = (treeLength >> 16) & 0xFF;
        result[2] = (treeLength >> 8) & 0xFF;
        result[3] = treeLength & 0xFF;

        // Copy tree data
        result.set(treeBytes, 4);

        // Copy encoded bytes
        result.set(bytes, 4 + treeBytes.length);

        return result;
    }

    /**
     * Decompresses data using Huffman coding
     *
     * @param compressedData The compressed data
     * @returns Decompressed data as string
     */
    private huffmanDecompress(compressedData: Uint8Array): string {
        // Extract tree data length
        const treeLength = (compressedData[0] << 24) |
            (compressedData[1] << 16) |
            (compressedData[2] << 8) |
            compressedData[3];

        // Extract tree data
        const treeBytes = compressedData.slice(4, 4 + treeLength);
        const treeData = new TextDecoder().decode(treeBytes);
        const frequencyMap = new Map<string, number>(JSON.parse(treeData));

        // Rebuild Huffman tree
        const tree = this.buildHuffmanTree(frequencyMap);

        // Extract encoded bytes
        const encodedBytes = compressedData.slice(4 + treeLength);

        // Convert bytes to bit string
        let encodedBits = "";
        // @ts-ignore
        for (const byte of encodedBytes) {
            encodedBits += byte.toString(2).padStart(8, '0');
        }

        // Decode the bit string using the Huffman tree
        let decodedData = "";
        let currentNode = tree;

        for (const bit of encodedBits) {
            if (bit === '0') {
                currentNode = currentNode.left!;
            } else {
                currentNode = currentNode.right!;
            }

            if (currentNode.isLeaf()) {
                decodedData += currentNode.char;
                currentNode = tree;
            }
        }

        return decodedData;
    }
}

/**
 * Helper functions for OST compression
 */
export const OSTHelper = {
    /**
     * Creates a binary encoder/decoder for integers using universal codes
     * @param type The type of universal code to use
     */
    createUniversalCodec(type: 'elias-gamma' | 'elias-delta' | 'fibonacci' | 'unary'): {
        encode: (n: number) => string;
        decode: (bits: string) => { value: number, bitsRead: number };
    } {
        switch (type) {
            case 'elias-gamma':
                return {
                    encode: (n: number): string => {
                        if (n <= 0) throw new Error("Elias Gamma can only encode positive integers");

                        // Convert to binary, remove leading '0b'
                        const binary = n.toString(2).slice(0);

                        // Number of bits in the binary representation minus 1
                        const unaryLength = binary.length - 1;

                        // Unary encoding of the length
                        const unary = '0'.repeat(unaryLength) + '1';

                        // Return the unary code followed by the binary value without its leading 1
                        return unary + binary.slice(1);
                    },
                    decode: (bits: string): { value: number, bitsRead: number } => {
                        // Find the position of the first '1'
                        const firstOnePos = bits.indexOf('1');

                        if (firstOnePos === -1) {
                            throw new Error("Invalid Elias Gamma code: no terminating '1' found");
                        }

                        // Length of the binary part
                        const binaryLength = firstOnePos + 1;

                        // Not enough bits remaining
                        if (bits.length < firstOnePos + binaryLength) {
                            throw new Error("Invalid Elias Gamma code: not enough bits");
                        }

                        // Extract binary part including the implicit leading '1'
                        const binary = '1' + bits.slice(firstOnePos + 1, firstOnePos + binaryLength);

                        // Convert binary to integer
                        const value = parseInt(binary, 2);

                        return { value, bitsRead: firstOnePos + binaryLength };
                    }
                };

            case 'elias-delta':
                return {
                    encode: (n: number): string => {
                        if (n <= 0) throw new Error("Elias Delta can only encode positive integers");

                        // Convert to binary, remove leading '0b'
                        const binary = n.toString(2).slice(0);

                        // Length of the binary representation
                        const binaryLength = binary.length;

                        // Elias gamma code for the length
                        const gammaCodec = OSTHelper.createUniversalCodec('elias-gamma');
                        const gamma = gammaCodec.encode(binaryLength);

                        // Return the gamma code for the length followed by the binary value without its leading 1
                        return gamma + binary.slice(1);
                    },
                    decode: (bits: string): { value: number, bitsRead: number } => {
                        // Use Elias Gamma to decode the length
                        const gammaCodec = OSTHelper.createUniversalCodec('elias-gamma');
                        const { value: length, bitsRead } = gammaCodec.decode(bits);

                        // Not enough bits remaining
                        if (bits.length < bitsRead + length - 1) {
                            throw new Error("Invalid Elias Delta code: not enough bits");
                        }

                        // Extract binary part including the implicit leading '1'
                        const binary = '1' + bits.slice(bitsRead, bitsRead + length - 1);

                        // Convert binary to integer
                        const value = parseInt(binary, 2);

                        return { value, bitsRead: bitsRead + length - 1 };
                    }
                };

            case 'fibonacci':
                return {
                    encode: (n: number): string => {
                        if (n <= 0) throw new Error("Fibonacci code can only encode positive integers");

                        // Generate Fibonacci numbers up to n
                        const fibs: number[] = [1, 2];
                        while (fibs[fibs.length - 1] < n) {
                            fibs.push(fibs[fibs.length - 1] + fibs[fibs.length - 2]);
                        }

                        // Find the representation
                        let remaining = n;
                        let code = '';

                        // Start from the largest Fibonacci number less than or equal to n
                        for (let i = fibs.length - 1; i >= 0; i--) {
                            if (fibs[i] <= remaining) {
                                code = '1' + code;
                                remaining -= fibs[i];
                            } else {
                                code = '0' + code;
                            }
                        }

                        // Add the final '1' (Fibonacci coding requires consecutive 1s at the end)
                        return code + '1';
                    },
                    decode: (bits: string): { value: number, bitsRead: number } => {
                        // Find the end of the code (two consecutive '1's)
                        let endPos = bits.indexOf('11');

                        if (endPos === -1) {
                            throw new Error("Invalid Fibonacci code: no terminating '11' found");
                        }

                        // Include the second '1'
                        endPos += 2;

                        // Generate necessary Fibonacci numbers
                        const fibs: number[] = [1, 2];
                        for (let i = 2; i < endPos - 1; i++) {
                            fibs.push(fibs[i - 1] + fibs[i - 2]);
                        }

                        // Decode
                        let value = 0;
                        for (let i = 0; i < endPos - 1; i++) {
                            if (bits[i] === '1') {
                                value += fibs[endPos - i - 2];
                            }
                        }

                        return { value, bitsRead: endPos };
                    }
                };

            case 'unary':
                return {
                    encode: (n: number): string => {
                        if (n <= 0) throw new Error("Unary code can only encode positive integers");
                        return '1'.repeat(n) + '0';
                    },
                    decode: (bits: string): { value: number, bitsRead: number } => {
                        const zeroPos = bits.indexOf('0');

                        if (zeroPos === -1) {
                            throw new Error("Invalid unary code: no terminating '0' found");
                        }

                        return { value: zeroPos, bitsRead: zeroPos + 1 };
                    }
                };

            default:
                throw new Error(`Unsupported universal code type: ${type}`);
        }
    }
};

// Example usage:
/*
const ostCompressor = new OSTCompression({
  windowLength: 500,
  labelLength: 2,
  compressionMethod: 'huffman'
});

const testData = "ACGTACGTACGTACGTACGTACGT"; // Example DNA sequence
const compressed = ostCompressor.encode(testData);
const decompressed = ostCompressor.decode(compressed);

console.log("Original size:", testData.length);
console.log("Compressed size:", Array.from(compressed.compressedBins.values())
  .reduce((acc, val) => acc + val.length, 0));
console.log("Decompressed:", decompressed);
*/