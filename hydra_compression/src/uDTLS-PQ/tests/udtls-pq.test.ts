'use strict';

const { DTLS, SecurityLevel } = require('../dist/src/uDTLS-PQ/src/udtls-pq');

describe('DTLS-PQ Module', () => {
  test('DTLS class should be defined', () => {
    expect(DTLS).toBeDefined();
  });

  test('SecurityLevel enum should be defined', () => {
    expect(SecurityLevel).toBeDefined();
    expect(SecurityLevel.STANDARD).toBe('standard');
    expect(SecurityLevel.POST_QUANTUM_MEDIUM).toBe('pq-medium');
    expect(SecurityLevel.POST_QUANTUM_HIGH).toBe('pq-high');
    expect(SecurityLevel.HYBRID).toBe('hybrid');
  });

  test('DTLS constructor should handle options', () => {
    // This test will use the mock implementation since we don't have actual certificates
    const options = {
      isServer: false,
      securityLevel: SecurityLevel.HYBRID,
      cert: Buffer.from('mock-cert'),
      key: Buffer.from('mock-key')
    };
    
    // This should not throw an error with our mock implementation
    const dtls = new DTLS(options);
    expect(dtls).toBeDefined();
  });
});