import { defineConfig } from 'vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import rollupNodePolyfills from 'rollup-plugin-node-polyfills';
import archipelagoPlugin from './vite-plugin-archipelago';
import tailwindcss from '@tailwindcss/vite';
import path from "node:path";


export default defineConfig({
    optimizeDeps: {
        include: ['@archipelagoui/archipelago/core/vfs/memory-vfs', '@archipelagoui/archipelago/core/vfs/registry', '@archipelagoui/archipelago/core/renderer/template-parser', '@archipelagoui/archipelago/core/runtime', '@archipelagoui/archipelago/core/runtime/ArchipelagoRenderer'],
        exclude: [
            'chokidar',
            'fs',
            'crypto',
            'node:fs',
            'node:crypto',
            '@archipelagoui/archipelago/core/vfs/adapter/disk-safe-vfs', 'bsdiff-node'
        ],
        esbuildOptions: {
            target: 'esnext',
            // 1️⃣ Define globals so esbuild knows about them in dev
            define: {
                global: 'globalThis',
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            },
            // 2️⃣ Add esbuild plugins to shim process, Buffer, etc.
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    process: true,
                    buffer:  true,
                }),
                NodeModulesPolyfillPlugin()
            ]
        }
    },
    plugins: [archipelagoPlugin(), tailwindcss()],
    resolve: {
        alias: {
            '@archipelagoui/core': path.resolve(
                __dirname,
                'node_modules/@archipelagoui/archipelago/core'
            ),
            '@archipelagoui/archipelago/vite-plugin-archipelago': path.resolve(
                __dirname,
                'node_modules/@archipelagoui/archipelago/vite-plugin-archipelago'
            ),
            util:    'rollup-plugin-node-polyfills/polyfills/util',
//            buffer:  'rollup-plugin-node-polyfills/polyfills/buffer-es6',
//            events:  'rollup-plugin-node-polyfills/polyfills/events',
//            stream:  'rollup-plugin-node-polyfills/polyfills/stream',
//            path:    'rollup-plugin-node-polyfills/polyfills/path',
//            process: 'rollup-plugin-node-polyfills/polyfills/process-es6',
            fs: 'rollup-plugin-node-polyfills/polyfills/fs',
            crypto: 'rollup-plugin-node-polyfills/polyfills/crypto'
        }
    },

    build: {
        target: 'esnext',
        commonjsOptions: {
            transformMixedEsModules: true
        },
        rollupOptions: {
            // 4️⃣ Include the Rollup‐level polyfills plugin
            plugins: [
                rollupNodePolyfills()
            ]
        }
    }
});
