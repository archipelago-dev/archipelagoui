import {superFalcon} from "superfalcon";

describe('Falcon', () => {
    test('keyPair generation', async () => {
        const keyPair = await superFalcon.keyPair();
        expect(keyPair).toBeDefined();
        expect(keyPair.publicKey).toBeDefined();
        expect(keyPair.privateKey).toBeDefined();
        
        // Check that keys are Uint8Arrays with appropriate length
        expect(keyPair.publicKey instanceof Uint8Array).toBe(true);
        expect(keyPair.privateKey instanceof Uint8Array).toBe(true);
        expect(keyPair.publicKey.length).toBeGreaterThan(0);
        expect(keyPair.privateKey.length).toBeGreaterThan(0);
    });
    
    test('sign and verify message', async () => {
        const keyPair = await superFalcon.keyPair();
        const message = "This is a test message";
        
        // Sign message
        const signature = await superFalcon.signDetached(message, keyPair.privateKey);
        expect(signature).toBeDefined();
        expect(signature instanceof Uint8Array).toBe(true);
        expect(signature.length).toBeGreaterThan(0);
        
        // Verify signature
        const isValid = await superFalcon.verifyDetached(
            signature, 
            message, 
            keyPair.publicKey
        );
        expect(isValid).toBe(true);
        
        // Test with incorrect message
        const isInvalidMessage = await superFalcon.verifyDetached(
            signature,
            "Wrong message",
            keyPair.publicKey
        );
        expect(isInvalidMessage).toBe(false);
    });
    
    test('key export and import', async () => {
        const originalKeyPair = await superFalcon.keyPair();
        const password = "test-password-123";
        
        // Export keys with password
        const exportedKeys = await superFalcon.exportKeys(originalKeyPair, password);
        expect(exportedKeys).toBeDefined();
        
        // Import keys with password
        const importedKeyPair = await superFalcon.importKeys(exportedKeys, password);
        expect(importedKeyPair).toBeDefined();
        expect(importedKeyPair.publicKey instanceof Uint8Array).toBe(true);
        expect(importedKeyPair.privateKey instanceof Uint8Array).toBe(true);
        
        // Verify that imported keys work for signing/verification
        const message = "Testing imported keys";
        const signature = await superFalcon.signDetached(message, importedKeyPair.privateKey);
        const isValid = await superFalcon.verifyDetached(
            signature,
            message,
            importedKeyPair.publicKey
        );
        expect(isValid).toBe(true);
    });
});