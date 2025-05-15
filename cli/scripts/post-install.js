import { execSync } from 'child_process';

try {
    require.resolve('@archipelagoui/archipelago');
} catch {
    console.log('📦 Auto-installing @archipelagoui/archipelago...');
    execSync('pnpm add -D @archipelagoui/archipelago', { stdio: 'inherit' });
}
