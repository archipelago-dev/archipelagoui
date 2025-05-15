import { blake3 } from '@noble/hashes/blake3';

export interface HashResult {
  readonly hash: Uint8Array;
  readonly mac?: Uint8Array;
  readonly key?: Uint8Array;
  readonly ctx?: Uint8Array;
  readonly hex: string;
  readonly base64: string;
}

export class Blake3 implements HashResult {
  readonly hash: Uint8Array;
  readonly mac?: Uint8Array;
  readonly key?: Uint8Array;
  readonly ctx?: Uint8Array;
  readonly hex: string;
  readonly base64: string;

  constructor(input: string, context?: string, key?: Uint8Array) {
    const inputBytes = new TextEncoder().encode(input);
    this.hash = blake3(inputBytes);

    this.hex = Buffer.from(this.hash).toString('hex');
    this.base64 = Buffer.from(this.hash).toString('base64');

    if (key) {
      this.key = blake3(this.hash, { key });
    }

    if (context) {
      this.ctx = blake3(this.hash, { context });
    }

    this.mac = blake3(this.hash, { key: new Uint8Array(32) }); // default MAC
  }

  /**
   * Creates a new Blake3 instance and returns only the result
   */
  static from(input: string, context?: string, key?: Uint8Array): HashResult {
    return new Blake3(input, context, key);
  }

  /**
   * Convert the result to a JSON-safe object
   */
  toJSON(): Record<string, string> {
    return {
      hex: this.hex,
      base64: this.base64,
      mac: this.mac ? Buffer.from(this.mac).toString('hex') : '',
      key: this.key ? Buffer.from(this.key).toString('hex') : '',
      ctx: this.ctx ? Buffer.from(this.ctx).toString('hex') : ''
    };
  }
}
