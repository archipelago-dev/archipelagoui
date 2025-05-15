// cli/commands/serve.ts

import { spawn } from 'child_process';
import * as path from 'path';

export async function runServe() {
    const entry = path.resolve('server/server.ts');

    const proc = spawn('ts-node', [entry], {
        stdio: 'inherit',
        env: {
            ...process.env,
            NODE_ENV: 'development'
        }
    });

    proc.on('close', code => {
        console.log(`🔌 Archipelago server exited with code ${code}`);
    });
}
