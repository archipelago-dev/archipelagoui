import { IVirtualFileSystem, FileMode } from '../types';
import { ungzip } from 'pako';
import Falcon from '../../crypto/falcon';
import { Blake3 } from '../../crypto/hash';

export async function verifyVaultSignature(
    vfs: IVirtualFileSystem,
    filePath: string
): Promise<boolean> {
    const sigPath = `${filePath}.sig.gz`;

    if (!(await vfs.exists(sigPath))) {
        console.warn(`⚠️ No signature file found for: ${filePath}`);
        return false;
    }

    const file = await vfs.open(filePath, FileMode.READ);
    const data = new Uint8Array(2048);
    const len = await file.read(data, data.length);
    await file.close();
    const fileContent = data.slice(0, len);

    const sigFile = await vfs.open(sigPath, FileMode.READ);
    const sigBuf = new Uint8Array(1024);
    const sigLen = await sigFile.read(sigBuf, sigBuf.length);
    await sigFile.close();

    const sigJson = JSON.parse(
        new TextDecoder().decode(ungzip(sigBuf.slice(0, sigLen)))
    );

    const hash = Blake3.from(Buffer.from(fileContent).toString('utf-8')).base64;

    const verified = await Falcon.FalconVerifyDetached(
        new Uint8Array(Buffer.from(sigJson.h, 'base64')),
        new Uint8Array(Buffer.from(sigJson.s, 'base64')),
        new Uint8Array(Buffer.from(sigJson.k, 'base64'))
    );

    return verified && sigJson.h === hash;
}
