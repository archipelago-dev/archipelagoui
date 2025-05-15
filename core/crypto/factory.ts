// core/crypto/factory.ts

import { TransportAlgorithm, SignatureAlgorithm, TransportOptions } from '../interfaces/transport';
import { AESGCM, generateAesKey } from './aes';
import { FalconSignature } from './falcon';
import { KyberKeyExchange } from './kyber';
import { EncryptionScheme, KeyExchange, DigitalSignature } from '../interfaces/crypto';

export interface CryptoBundle {
    encryption: EncryptionScheme;
    exchange: KeyExchange;
    signature: DigitalSignature;

    /** Optional pre-generated key for verification */
    signaturePublicKey?: Uint8Array;
    signaturePrivateKey?: Uint8Array;
}


export async function createCryptoBundle(opts: TransportOptions): Promise<CryptoBundle> {
    const algorithm = opts.algorithm ?? TransportAlgorithm.AES_GCM;
    const signature = opts.signature ?? SignatureAlgorithm.FALCON;

    let encryption: EncryptionScheme;
    let exchange: KeyExchange;


    // Encryption + KEX
    switch (algorithm) {
        case TransportAlgorithm.KYBER_AES_GCM:
            const aesKey = await generateAesKey();
            encryption = new AESGCM(aesKey) as unknown as EncryptionScheme;
            exchange = new KyberKeyExchange();
            break;

        case TransportAlgorithm.AES_GCM:
        default:
            encryption = new AESGCM(await generateAesKey()) as unknown as EncryptionScheme;
            exchange = new KyberKeyExchange(); // default fallback to Kyber even if not encapsulated
            break;
    }




    const sigImpl = new FalconSignature();
    const { publicKey, privateKey } = await sigImpl.generateKeyPair();

    return {
        encryption,
        exchange,
        signature: sigImpl,
        signaturePublicKey: publicKey,
        signaturePrivateKey: privateKey
    };


}
