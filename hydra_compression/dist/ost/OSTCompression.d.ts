/**
 * OST Compression - A TypeScript implementation for encoding and decoding data
 * using the Okaily-Srivastava-Tbakhi (OST) compression algorithm.
 *
 * Based on the algorithm described in the paper where data is organized into bins
 * of similar content before applying compression techniques.
 */
interface OSTConfig {
    windowLength: number;
    labelLength: number;
    variableWindow?: boolean;
    compressionMethod: string;
    subBinning?: boolean;
    subBinningDepth?: number;
}
/**
 * Main class for OST Compression
 */
export declare class OSTCompression {
    private config;
    constructor(config?: Partial<OSTConfig>);
    /**
     * Encodes the input data using the OST algorithm
     *
     * @param data The data to be compressed
     * @returns An object containing the compressed data and metadata
     */
    encode(data: string): Promise<{
        compressedBins: Map<string, Uint8Array>;
        metadata: {
            windowLengths?: number[];
            config: OSTConfig;
        };
    }>;
    /**
     * Decodes the compressed data back to its original form
     *
     * @param compressedData The object containing compressed bins and metadata
     * @returns The original uncompressed data
     */
    decode(compressedData: {
        compressedBins: Map<string, Uint8Array>;
        metadata: {
            windowLengths?: number[];
            config: OSTConfig;
        };
    }): Promise<string>;
    /**
     * Divides the input data into windows of specified length
     *
     * @param data The input data
     * @returns Array of windows
     */
    private divideIntoWindows;
    /**
     * Generates a label for a window using the Huffman encoding strategy
     *
     * @param window The window to generate a label for
     * @returns The label string
     */
    private generateLabel;
    /**
     * Builds a Huffman tree from a frequency map
     *
     * @param frequencyMap Map of character frequencies
     * @returns The root node of the Huffman tree
     */
    private buildHuffmanTree;
    /**
     * Recursively generates Huffman codes for each character
     *
     * @param node Current node in the Huffman tree
     * @param code Current code
     * @param huffmanCodes Map to store character codes
     */
    private generateHuffmanCodes;
    /**
     * Groups labeled windows into bins with the same label
     *
     * @param labeledWindows Array of windows with their labels
     * @returns Map of bins by label
     */
    private groupIntoBins;
    /**
     * Compresses a bin using the configured compression method
     *
     * @param bin The bin to compress
     * @returns Compressed data as Uint8Array
     */
    private compressBin;
    /**
     * Decompresses a bin using the configured compression method
     *
     * @param compressedData The compressed data
     * @returns Decompressed data as string
     */
    private decompressBin;
    /**
     * Compresses data using Huffman coding
     *
     * @param data The data to compress
     * @returns Compressed data as Uint8Array
     */
    private huffmanCompress;
    /**
     * Decompresses data using Huffman coding
     *
     * @param compressedData The compressed data
     * @returns Decompressed data as string
     */
    private huffmanDecompress;
}
/**
 * Helper functions for OST compression
 */
export declare const OSTHelper: {
    /**
     * Creates a binary encoder/decoder for integers using universal codes
     * @param type The type of universal code to use
     */
    createUniversalCodec(type: 'elias-gamma' | 'elias-delta' | 'fibonacci' | 'unary'): {
        encode: (n: number) => string;
        decode: (bits: string) => {
            value: number;
            bitsRead: number;
        };
    };
};
export {};
