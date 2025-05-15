import { OSTConfig } from "./types";
export declare class OSTPackWriter {
    static createPack(data: string, config?: Partial<OSTConfig>): Promise<Uint8Array>;
}
