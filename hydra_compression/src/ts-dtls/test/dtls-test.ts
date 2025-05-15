import * as fs from 'fs';
import * as path from 'path';
import { DTLS, SecurityLevel } from '../DTLS';

// Create a simple test for our DTLS implementation
async function runClientServerTest() {
  console.log('Starting DTLS client-server test...');

  // Generate self-signed certificates for testing
  // In a real application, you would use proper certificates
  const certPath = path.join(__dirname, 'server-cert.pem');
  const keyPath = path.join(__dirname, 'server-key.pem');

  // Check if certificates exist, if not, generate them
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('Generating self-signed certificates...');
    await generateSelfSignedCertificates(certPath, keyPath);
  }

  const cert = fs.readFileSync(certPath);
  const key = fs.readFileSync(keyPath);

  // Create server
  const server = new DTLS({
    isServer: true,
    cert,
    key,
    securityLevel: SecurityLevel.HYBRID,
    debug: true
  });

  // Handle server events
  server.on('listening', () => {
    console.log('DTLS server listening on port 8443');
    
    // Start client after server is listening
    startClient(cert, key);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });

  server.on('data', (data) => {
    console.log('Server received:', data.toString());
    
    // Echo back to client
    server.send(Buffer.from('Server echo: ' + data.toString()));
  });

  // Start server
  server.listen(8443, '127.0.0.1');
}

function startClient(cert: Buffer, key: Buffer) {
  console.log('Starting DTLS client...');

  // Create client
  const client = new DTLS({
    isServer: false,
    cert,
    key,
    securityLevel: SecurityLevel.HYBRID,
    debug: true
  });

  // Handle client events
  client.on('connect', () => {
    console.log('Client connected to server');
    
    // Send test message
    client.send(Buffer.from('Hello, DTLS server!'));
  });

  client.on('error', (err) => {
    console.error('Client error:', err);
  });

  client.on('data', (data) => {
    console.log('Client received:', data.toString());
    
    // Close connection after receiving response
    setTimeout(() => {
      console.log('Closing connections...');
      client.close(() => {
        console.log('Client closed');
      });
    }, 1000);
  });

  // Connect to server
  client.connect(8443, '127.0.0.1');
}

async function generateSelfSignedCertificates(certPath: string, keyPath: string): Promise<void> {
  // This is a placeholder. In a real implementation, you would use
  // a library like node-forge to generate self-signed certificates.
  // For this example, we'll just create dummy files.
  
  // In a real implementation, you would use:
  // const forge = require('node-forge');
  // const pki = forge.pki;
  // const keys = pki.rsa.generateKeyPair(2048);
  // const cert = pki.createCertificate();
  // ... set certificate attributes ...
  // const certPem = pki.certificateToPem(cert);
  // const keyPem = pki.privateKeyToPem(keys.privateKey);
  
  // For this example, we'll just use dummy data
  const certPem = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUJFBBmUJpR9zCo4jzKQRNzIgT+ZIwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yMzA1MTMxNDUzNTlaFw0yNDA1
MTIxNDUzNTlaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQC7VJTUt9Us8cKjMzEfXrn3npN/3JzNwxsV4qA7zL0R
hZuqUDYcONlLI8xDvOTcWMCZ5Z+8yS6j8PGP+SBtNzOVUbgFULloTBcA9xHzLFjI
arP87XRFwQvPcZB0CXkAJ5SG2kmkC5AoL4bX9XVpKGP9jbvq2MbvAEY2vZnXQMVe
8KKMUPbkXd3+QWI0WXmPRYJmkJu50Fy2I+OwgVMcfMYxBYwEsCQ0KLgmGmr4+w8t
W4+lZW9M2TQxJULZU9KNUQxZWTMYwlVXGvxEgzk1RTm0ZBp5C/wAQoGE0MQxyBzA
JIJNhqMRKKG402jVk5HBYr5nj9aNszD4JmbQ3Tn5AgMBAAGjUzBRMB0GA1UdDgQW
BBQNnYhQMa+UJC+tQZR/kAUkW6xmRDAfBgNVHSMEGDAWgBQNnYhQMa+UJC+tQZR/
kAUkW6xmRDAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCgOCCJ
E+KNdP0utTTQKXqmKLw7o5MhXV5GgCGfWNVUYvYtHmGHr2bRYzGRNR67q+Q0QR0X
L7lvrZvH8Tz53FnFwO1K5xbTLkgGb+joj8fcFQWWFIUqgNN8PTn6PfbYvYwbXLrM
9OzxC2npJmzyhDb5GGvpJXwzWAjxNqKaUvHxOJqfQK0G9SdReDbka5Vf8NJB8J/+
Kh/6YLXg9uvfYkHCfnwY7FsFSSsGgQx9H8Lp5jBZJRcls8Aey0SkAeMn8PTNNWqU
TlkEjPnFGcZGxKjZ0ICK8HFP7hpnQd2WsYxAXKYK4YxHzLfbImLLJCmjjTaAGTLs
QFrPU0OmPjRZZk1v
-----END CERTIFICATE-----`;

  const keyPem = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC7VJTUt9Us8cKj
MzEfXrn3npN/3JzNwxsV4qA7zL0RhZuqUDYcONlLI8xDvOTcWMCZ5Z+8yS6j8PGP
+SBtNzOVUbgFULloTBcA9xHzLFjIarP87XRFwQvPcZB0CXkAJ5SG2kmkC5AoL4bX
9XVpKGP9jbvq2MbvAEY2vZnXQMVe8KKMUPbkXd3+QWI0WXmPRYJmkJu50Fy2I+Ow
gVMcfMYxBYwEsCQ0KLgmGmr4+w8tW4+lZW9M2TQxJULZU9KNUQxZWTMYwlVXGvxE
gzk1RTm0ZBp5C/wAQoGE0MQxyBzAJIJNhqMRKKG402jVk5HBYr5nj9aNszD4JmbQ
3Tn5AgMBAAECggEBAKBPXiKRdahMzlJ9elyRyrmnihX7Cr41k7hwAS+qSetCVt3p
BB+W8jQrMi5dVKO9w8kBYDjf0pIMutvmWgF4bUfWzxQdgGIGJwWXIWVuAsgRC6c8
qRz8zMYUW4Oc6VzSw+B0qZE2Y5e4ZQEYlgCQ0KNGdRwwuCvYNFmTrjAQZPSQ+zbP
qOy/qZUYdO3v4GB1/g5KGJ3mj+FYqHpwuwD2Rzj5pZQO5D5hwqNWVNjY5HV9p0zx
NSQfXwPqEwXJC1vW8yw7PgkxQrAhhkQ0MDh6gJjOOjkXb+dQecQhojWkFU7TFT0c
tDrJZ+28XEcS3OVDi1bM3Jt9Jq6Brj1KgOjWXxkCgYEA6FtQ0cfh8/Ta9WFMWaYz
yxMWvYNUMa4s7HRxr/5OcXHuRntXwmWmOTLvvjwjWm6L5rG9x1JpF0QRTaEZFiQC
6Mu4fLtEAP8aUYvHGz0RkJKSljKPz4Fsr9VQQ1GhgILIBiWY1UECBzqJECFkIf4R
dcR68yDnQptzfUXEgC+8GLsCgYEAzqZCFJxMDj1TVSN0lxRn+YXPHGxKFzsNqTQe
K0EHFxiV2lbJo8UVZ2PCx0Mv6WHPPfNAZYHJitlFONt0iKZmPenOYMKmDbkW3EGK
13Vwq3H4CfHxQ1l5u5bQFQzRSHFTGrLKeeZkNpDQV0F0jpNdAU5N6aQrfB0M0bKs
lX2/2rsCgYEAqghgxCfwI9XUYeSXVoHQmZY8vgZEEX23WQmLITnLYXLJQGQPPGX5
6DOXtcdXqnfcK8J2Kqn8UHBzKa9Hl+I+QcXGGiPYJiLjgKdYMGWFBMYEI1qnGaJM
SGVFWF5wnVj0Dxe5NfGnEEV5TfpvCZNcRcbUXlFRaNO0/hHx8zqWlMECgYEAzJdJ
/cFJSY8+C6BRb+5GcZjB6c+RlcUwdQ6kzLWDZqNMkGLcSCVGvZUBeTI9XH+yGz2V
y0SfFE5jYbVl9HVqYhSv97DXjYiM8F8UfzJFsJrt2l0/8lk94QKjYJuxQwNkKCj8
UJKLqmHHv+4LnCY6Sjq1XELTrNLwyzq6+7aBLmsCgYAXgbxTf8HZ/W/X7Jl9xkQF
BDnOIJVTGYXHRurZVdWFUNYFEbFxBAxnwFyLJPc0hcQMJ9qUQHUZSQGQSLFLzYv1
ImAPXmAW1ZUT+SiKWH+l7RuHRKP7C7Sn2/VYwdRfLCzVDUZ/WnKd5aO8FHGx5wcI
+zQIBTlxqEYZ4/KhHQnYFQ==
-----END PRIVATE KEY-----`;

  fs.writeFileSync(certPath, certPem);
  fs.writeFileSync(keyPath, keyPem);
}

// Run the test
runClientServerTest().catch(err => {
  console.error('Test failed:', err);
});
