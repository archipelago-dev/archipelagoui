// tsup.config.ts
import { defineConfig } from 'tsup';

function asMjs() {
    return {
        // change every “.js” that esbuild would write for ESM build‑targets
        esbuildOptions(options) {
            options.outExtension = { '.js': '.mjs' };
        },
    };
}

export default defineConfig([
    /* ─── bundle for the browser / demo page ────────────────────────── */
    {
        entry: ['main.ts'],
        outDir: 'dist',
        format: ['esm'],
        shims: true,              //  ← injects `require()` + __dirname/__filename
        dts: true,
        clean: true,
        sourcemap: true,
        target: 'node2022',
        external: ["falcon-crypto", "mlkem", "superfalcon", "@archipelagoui/ui", "bsdiff-node", "hydra-compression", "node:module", "events"],
        ...asMjs(), //  ← add this line

    },

    /* ─── CLI bundle ────────────────────────────────────────────────── */
    {
        entry: ['cli/cli.ts'],
        outDir: 'dist',
        format: ['esm'],
        shims: true,              //  ← same here
        splitting: false,
        dts: false,
        clean: false,
        sourcemap: true,
        target: 'es2020',
        external: [
            '@archipelagoui/core',
            '@archipelagoui/ui',
            'mlkem',
            'superfalcon'
        ]
    }
]);
