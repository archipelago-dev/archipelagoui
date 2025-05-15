# uDTLS-PQ

A DTLS implementation with post-quantum cryptography support.

## Features

- DTLS 1.2 and 1.3 support
- Post-quantum key exchange using Kyber
- Post-quantum signatures using Dilithium
- Hybrid classical/post-quantum certificates
- Certificate Transparency support
- OCSP stapling
- CRL distribution points
- Decentralized Identifiers (DIDs) support

## Installation

```bash
npm install u-dtls-pq
```

## Usage

```javascript
const { DTLS, SecurityLevel } = require('u-dtls-pq');

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

## Security Levels

- `SecurityLevel.STANDARD`: Classical cryptography only
- `SecurityLevel.POST_QUANTUM_MEDIUM`: Kyber-512 (NIST Level 1)
- `SecurityLevel.POST_QUANTUM_HIGH`: Kyber-768 (NIST Level 3)
- `SecurityLevel.HYBRID`: Classical + post-quantum cryptography

## Building from Source

```bash
git clone <repository-url>
cd u-dtls-pq
npm install
npm run build
```

## Testing

```bash
npm test
```

## License

ISC