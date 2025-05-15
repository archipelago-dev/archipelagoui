import { DTLSSocket } from './lib/types';
import { NegotiatedParameters } from './DTLSHandshake';
export declare class CompatibilityManager {
    negotiateCapabilities(socket: DTLSSocket): Promise<NegotiatedParameters>;
    private createClientHello;
    private parseServerCapabilities;
    private detectDowngrade;
    private verifyDowngradeToken;
}
