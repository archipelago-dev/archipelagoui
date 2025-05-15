export interface OSTConfig {
    windowLength: number;
    labelLength: number;
    variableWindow?: boolean;
    compressionMethod: 'huffman' | 'brotli' | 'zstd' | 'raw';
    subBinning?: boolean;
    subBinningDepth?: number;
}
