'use strict';


import { DTLS, SecurityLevel } from './udtls-pq';

const dtls = new DTLS({
    isServer: false, securityLevel: SecurityLevel.HYBRID, cert: Buffer.from('mock-cert'), key: Buffer.from('mock-key')});
export { dtls };