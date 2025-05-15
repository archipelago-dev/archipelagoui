/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'events';
import { DTLSConnectionOptions } from './lib/types';
export declare class DTLSConnection extends EventEmitter {
    private socket;
    private context;
    private state;
    private handshakeBuffer;
    private sequenceNumber;
    private peerAddress;
    private peerPort;
    private nativeBinding;
    constructor(options: DTLSConnectionOptions);
    handshake(): Promise<void>;
    send(data: Buffer): Promise<void>;
    private encryptRecord;
    private createClientHello;
    private sendDTLSPacket;
    private fragmentData;
    private constructNonce;
    private constructAAD;
}
