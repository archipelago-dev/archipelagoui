# TypeScript DTLS Implementation

A pure TypeScript implementation of DTLS with post-quantum cryptography support using the `mlkem` package for Kyber 768.

## Features

- DTLS 1.2 and 1.3 support
- Post-quantum key exchange using Kyber 768
- Multiple security levels (standard, post-quantum medium, post-quantum high, hybrid)
- Client and server modes
- Simple API similar to the original uDTLS-PQ module

## Usage

```typescript
import { DTLS, SecurityLevel } from './ts-dtls';
import fs from 'fs';

// Create a DTLS client with post-quantum security
const dtls = new DTLS({
  isServer: false,
  cert: fs.readFileSync('client-cert.pem'),
  key: fs.readFileSync('client-key.pem'),
  securityLevel: SecurityLevel.HYBRID,
  minVersion: '1.2',
  maxVersion: '1.3',
  verifyPeer: true
});

// Connect to a DTLS server
dtls.connect(4433, 'example.com', () => {
  console.log('Connected!');
  
  // Send data
  dtls.send('Hello, secure world!');
});

// Handle incoming data
dtls.on('message', (data) => {
  console.log('Received:', data.toString());
});

// Handle errors
dtls.on('error', (err) => {
  console.error('DTLS error:', err);
});

// Close the connection when done
dtls.close();
```

## Server Mode

```typescript
import { DTLS, SecurityLevel } from './ts-dtls';
import fs from 'fs';

// Create a DTLS server
const server = new DTLS({
  isServer: true,
  cert: fs.readFileSync('server-cert.pem'),
  key: fs.readFileSync('server-key.pem'),
  securityLevel: SecurityLevel.HYBRID
});

// Listen for connections
server.listen(4433, '0.0.0.0', () => {
  console.log('DTLS server listening on port 4433');
});

// Handle incoming connections
server.on('connection', (client) => {
  console.log('Client connected');
  
  client.on('message', (data) => {
    console.log('Received from client:', data.toString());
    client.send('Hello from server!');
  });
  
  client.on('close', () => {
    console.log('Client disconnected');
  });
});
```

## Security Levels

- `SecurityLevel.STANDARD`: Classical cryptography only
- `SecurityLevel.POST_QUANTUM_MEDIUM`: Kyber-512 (NIST Level 1)
- `SecurityLevel.POST_QUANTUM_HIGH`: Kyber-768 (NIST Level 3)
- `SecurityLevel.HYBRID`: Classical + post-quantum cryptography

## Implementation Notes

This is a TypeScript reimplementation of the uDTLS-PQ module that eliminates the dependency on native bindings and liboqs. It uses the `mlkem` package for Kyber 768 post-quantum key exchange.

The implementation includes:
- DTLS protocol handling
- Post-quantum key exchange
- Basic encryption/decryption (using XOR for demonstration)

For production use, this implementation should be extended with:
- Proper DTLS record layer implementation
- More robust handshake protocol
- Proper symmetric encryption using established shared secrets
- Certificate validation
- Support for additional post-quantum algorithms

## Testing

The implementation includes comprehensive tests using Jest:

```bash
npm test
```

## License

ISC
