/// <reference types="node" />
/// <reference types="node" />
import { DTLSSocket, EnhancedDTLSOptions } from './lib/types';
export declare class EnhancedDTLSSocket extends DTLSSocket {
    private earlyData;
    constructor(options: EnhancedDTLSOptions);
    private setupAutoRekeying;
    connectWithEarlyData(data: Buffer): Promise<void>;
    private enableZeroRTT;
    private rekey;
}
