// MLKEM Key Exchange Example
// This example demonstrates the MLKEM key exchange process

import { PQKeyExchange, PQAlgorithm } from '../PQKeyExchange';

/**
 * Simulates a complete MLKEM key exchange between two parties
 */
async function simulateKeyExchange() {
  try {
    console.log('=== MLKEM Key Exchange Simulation ===\n');
    
    // Create PQKeyExchange instances for both parties
    console.log('Creating PQKeyExchange instances...');
    const aliceKeyExchange = new PQKeyExchange(PQAlgorithm.KYBER768);
    const bobKeyExchange = new PQKeyExchange(PQAlgorithm.KYBER768);
    console.log('Using algorithm: KYBER768\n');
    
    // Step 1: Alice generates a key pair
    console.log('Step 1: Alice generates a key pair');
    const aliceKeyPair = await aliceKeyExchange.generateKeyPair();
    console.log(`  Public key size: ${aliceKeyPair.publicKey.length} bytes`);
    console.log(`  Private key size: ${aliceKeyPair.privateKey.length} bytes\n`);
    
    // Step 2: Alice sends her public key to Bob (simulated)
    console.log('Step 2: Alice sends her public key to Bob\n');
    
    // Step 3: Bob encapsulates a shared secret using Alice's public key
    console.log('Step 3: Bob encapsulates a shared secret using Alice\'s public key');
    const { ciphertext, sharedSecret: bobSharedSecret } = await bobKeyExchange.encapsulate(aliceKeyPair.publicKey);
    console.log(`  Ciphertext size: ${ciphertext.length} bytes`);
    console.log(`  Bob's shared secret size: ${bobSharedSecret.length} bytes\n`);
    
    // Step 4: Bob sends the ciphertext to Alice (simulated)
    console.log('Step 4: Bob sends the ciphertext to Alice\n');
    
    // Step 5: Alice decapsulates the shared secret using the ciphertext and her private key
    console.log('Step 5: Alice decapsulates the shared secret');
    const aliceSharedSecret = await aliceKeyExchange.decapsulate(ciphertext, aliceKeyPair.privateKey);
    console.log(`  Alice's shared secret size: ${aliceSharedSecret.length} bytes\n`);
    
    // Step 6: Verify that both parties have the same shared secret
    console.log('Step 6: Verifying shared secrets match');
    const bobSharedSecretHex = bobSharedSecret.toString('hex');
    const aliceSharedSecretHex = aliceSharedSecret.toString('hex');
    
    console.log(`  Bob's shared secret: ${bobSharedSecretHex.substring(0, 16)}...`);
    console.log(`  Alice's shared secret: ${aliceSharedSecretHex.substring(0, 16)}...`);
    
    if (bobSharedSecretHex === aliceSharedSecretHex) {
      console.log('\n✅ Success! Both parties have derived the same shared secret.');
      console.log('  This shared secret can now be used to derive symmetric encryption keys.');
    } else {
      console.log('\n❌ Error! Shared secrets do not match.');
    }
    
  } catch (error) {
    console.error('Error during key exchange simulation:', error);
  }
}

// Run the simulation
console.log('Starting MLKEM key exchange simulation...\n');
simulateKeyExchange().catch(console.error);
