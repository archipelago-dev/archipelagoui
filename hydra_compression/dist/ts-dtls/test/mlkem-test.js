"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Test file to understand the MLKEM API
const mlkem_1 = require("mlkem");
async function testMlKem() {
    try {
        console.log('Creating MlKem768 instance...');
        const mlkem = new mlkem_1.MlKem768();
        // Test key generation
        console.log('\n--- Testing Key Generation ---');
        const keyPair = await mlkem.generateKeyPair();
        console.log('Key pair generated:');
        console.log('Public key length:', keyPair[0].length);
        console.log('Private key length:', keyPair[1].length);
        // Test encapsulation
        console.log('\n--- Testing Encapsulation ---');
        const encapResult = await mlkem.encap(keyPair[0]);
        console.log('Encapsulation result:');
        console.log('Ciphertext length:', encapResult[0].length);
        console.log('Shared secret length:', encapResult[1].length);
        // Test decapsulation
        console.log('\n--- Testing Decapsulation ---');
        const sharedSecret = await mlkem.decap(encapResult[0], keyPair[1]);
        console.log('Decapsulation result:');
        console.log('Shared secret length:', sharedSecret.length);
        // Verify shared secrets match
        console.log('\n--- Verifying Shared Secrets ---');
        const encapSharedSecret = Buffer.from(encapResult[1]).toString('hex');
        const decapSharedSecret = Buffer.from(sharedSecret).toString('hex');
        console.log('Shared secrets match:', encapSharedSecret === decapSharedSecret);
    }
    catch (error) {
        console.error('Error testing MLKEM:', error);
    }
}
testMlKem().catch(console.error);
//# sourceMappingURL=mlkem-test.js.map