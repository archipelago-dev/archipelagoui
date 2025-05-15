// Direct MLKEM Test
// This test directly tests the MLKEM implementation without the DTLS stack

import { MlKemAdapter } from '../mlkem-adapter';
import { PQAlgorithm } from '../lib/types';

/**
 * Test the MLKEM implementation directly
 */
async function testMlKem() {
    console.log('=== Testing MLKEM Implementation Directly ===');
    
    try {
        // Test with KYBER768
        console.log('Testing with KYBER768...');
        const algorithm = PQAlgorithm.KYBER768;
        
        // Generate key pair
        console.log('Generating key pair...');
        const keyPair = MlKemAdapter.generateKyberKeyPair(algorithm);
        console.log('Public key length:', keyPair.publicKey.length);
        console.log('Private key length:', keyPair.privateKey.length);
        
        // Encapsulate shared secret
        console.log('Encapsulating shared secret...');
        const { ciphertext, sharedSecret } = MlKemAdapter.kyberEncapsulate(keyPair.publicKey, algorithm);
        console.log('Ciphertext length:', ciphertext.length);
        console.log('Shared secret length:', sharedSecret.length);
        
        // Decapsulate shared secret
        console.log('Decapsulating shared secret...');
        const decapsulatedSecret = MlKemAdapter.kyberDecapsulate(keyPair.privateKey, ciphertext, algorithm);
        console.log('Decapsulated secret length:', decapsulatedSecret.length);
        
        // Verify shared secrets match
        const secretsMatch = Buffer.compare(sharedSecret, decapsulatedSecret) === 0;
        console.log('Shared secrets match:', secretsMatch);
        
        if (!secretsMatch) {
            throw new Error('Shared secrets do not match');
        }
        
        return true;
    } catch (error) {
        console.error('MLKEM test failed:', error);
        return false;
    }
}

// Run the test
testMlKem()
    .then(success => {
        console.log('Test result:', success ? 'PASSED' : 'FAILED');
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test error:', error);
        process.exit(1);
    });
