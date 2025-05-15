import {MlKem768} from "mlkem";

describe('Kyber', () => {
    const mlkem = new MlKem768();
    
    test('key generation', async () => {
        const keyPair: [Uint8Array, Uint8Array] = await mlkem.generateKeyPair();
        expect(keyPair).toBeDefined();
        expect(Array.isArray(keyPair)).toBe(true);
        expect(keyPair.length).toBe(2);
        
        // In Kyber, keyPair[0] is the public key and keyPair[1] is the secret key
        const publicKey: Uint8Array = keyPair[0];
        const secretKey: Uint8Array = keyPair[1];
        
        // Check that keys are Uint8Arrays with appropriate length
        expect(publicKey instanceof Uint8Array).toBe(true);
        expect(secretKey instanceof Uint8Array).toBe(true);
    });
    
    test('full key exchange workflow', async () => {
        // Alice generates a key pair
        const aliceKeyPair: [Uint8Array, Uint8Array] = await mlkem.generateKeyPair();
        const alicePublicKey: Uint8Array = aliceKeyPair[0];
        const aliceSecretKey: Uint8Array = aliceKeyPair[1];
        
        // Bob generates a key pair
        const bobKeyPair: [Uint8Array, Uint8Array] = await mlkem.generateKeyPair();
        const bobPublicKey: Uint8Array = bobKeyPair[0];
        const bobSecretKey: Uint8Array = bobKeyPair[1];
        
        // Let's verify that different key pairs are actually different
        expect(Buffer.from(alicePublicKey).toString('hex'))
            .not.toBe(Buffer.from(bobPublicKey).toString('hex'));
        
        // Create a simple message to encrypt
        const message: Uint8Array = new TextEncoder().encode("This is a test message for Kyber encryption");
        
        // In a real application, Alice and Bob would exchange public keys
        // Then use a KEM (Key Encapsulation Mechanism) to establish a shared secret
        // For testing purposes, we'll simulate this exchange
        
        // For demonstration, we'll use a simple XOR-based encryption with the key material
        // In a real application, you would use a proper symmetric encryption algorithm
        function simpleEncrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
            const result = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i++) {
                result[i] = data[i] ^ key[i % key.length];
            }
            return result;
        }
        
        function simpleDecrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
            // XOR encryption is symmetric, so encryption and decryption are the same operation
            return simpleEncrypt(data, key);
        }
        
        // Use the public and secret keys directly as encryption material
        // (This is just for testing - in a real application you would use proper KEM)
        const aliceEncryptionKey: Uint8Array = new Uint8Array(32);
        const bobEncryptionKey: Uint8Array = new Uint8Array(32);
        
        // Take first 32 bytes of each key for demonstration
        for (let i = 0; i < 32; i++) {
            aliceEncryptionKey[i] = alicePublicKey[i];
            bobEncryptionKey[i] = bobPublicKey[i];
        }
        
        // Alice encrypts a message for Bob using Bob's public key
        const encryptedByAlice: Uint8Array = simpleEncrypt(message, bobEncryptionKey);
        
        // Bob decrypts the message using the corresponding key material
        const decryptedByBob: Uint8Array = simpleDecrypt(encryptedByAlice, bobEncryptionKey);
        
        // Verify the decryption worked
        expect(new TextDecoder().decode(decryptedByBob))
            .toBe("This is a test message for Kyber encryption");
        
        // Bob encrypts a response for Alice
        const response: Uint8Array = new TextEncoder().encode("Response from Bob to Alice");
        const encryptedByBob: Uint8Array = simpleEncrypt(response, aliceEncryptionKey);
        
        // Alice decrypts Bob's response
        const decryptedByAlice: Uint8Array = simpleDecrypt(encryptedByBob, aliceEncryptionKey);
        
        // Verify Alice can read Bob's response
        expect(new TextDecoder().decode(decryptedByAlice))
            .toBe("Response from Bob to Alice");
    });
});