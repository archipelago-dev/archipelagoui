// vite.config.ts
import { defineConfig } from 'vite';

import tailwindcss from "@tailwindcss/vite";
import archipelagoPlugin from "./vite-plugin-archipelago";

// @ts-ignore
import * as fs from 'browserify-fs';
// @ts-ignore
import { Buffer } from 'buffer';
// @ts-ignore
import path from 'path-browserify';
// @ts-ignore
import crypto from 'crypto-browserify';
import inject from '@rollup/plugin-inject';
import nodePolyfills from "rollup-plugin-polyfill-node";
import {NodeGlobalsPolyfillPlugin} from "@esbuild-plugins/node-globals-polyfill";


export default defineConfig({
    // 1) Tell Vite not to pre‐bundle or resolve bsdiff-node
    optimizeDeps: {
        exclude: ['bsdiff-node','superfalcon', 'node:module', 'chokidar', 'node:fs/promises', 'fs/promises', 'process', '@/vite/env'],
        include: [ 'stream-browserify', 'util', 'path-browserify', 'browserify-fs', 'crypto-browserify', 'os-browserify'],
        esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
                global: 'globalThis'
            },
            // Enable esbuild polyfill plugins
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    buffer: true
                })
            ]
        }
    },
    ssr: {
        noExternal: ['@archipelagoui/core'],
        external: ['/@vite/env']
    },
    resolve: {
        alias: {
            // 2) If any code does import('bsdiff-node'), redirect it to an empty shim
            'bsdiff-node': path.resolve(__dirname, 'src/empty-shim.js'),
            '/core/crypto/falcon.ts': path.resolve(__dirname, 'src/shims/falcon-shims.js'),
            'node:events': 'events',
            'events':     'events',
            'zlib':      'zlib',

            'node:fs/promises': path.resolve(__dirname, 'src/shims/fs-promises-shim.js'),
            'fs/promises':      path.resolve(__dirname, 'src/shims/fs-promises-shim.js'),

            'node:buffer':    'buffer/',
            'node:stream':    'stream-browserify',
            'node:util':     'util',
            'path':         'path-browserify',
            'node:path':    'path-browserify',

            'node:process':  path.resolve(__dirname, 'src/shims/process-shim.js'),
            'fs': 'browserify-fs',
            'node:fs': 'browserify-fs',
            'global': path.resolve(__dirname, 'src/shims/global-shim.js'),
            'util': 'rollup-plugin-node-polyfills/polyfills/util',
            process: 'rollup-plugin-node-polyfills/polyfills/process-es6',
            'process/cwd': 'process/cwd',
            stream: 'stream-browserify',
            buffer: 'buffer/',
            os: 'os-browserify/browser',
            crypto: 'crypto-browserify',
            'node:crypto': 'crypto-browserify',


        }
    },
    build: {
        rollupOptions: {
            external: [
                // 3) Treat any .node import as external
                'bsdiff-node',
                /\.node$/,
                'superfalcon',
                'node:module',
                'events',
                'process'
            ],
            plugins: [
                inject({Buffer: ['buffer/', 'Buffer'], util: ['util', 'util'], os: ['os', 'os']}),
nodePolyfills(),
            ]
        }
    },
    plugins: [
        tailwindcss(),
        archipelagoPlugin()],
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        global: 'window',

    }
});
