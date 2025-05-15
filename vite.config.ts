import { defineConfig } from 'vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import rollupNodePolyfills from 'rollup-plugin-node-polyfills';

export default defineConfig({
    optimizeDeps: {
        esbuildOptions: {
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

    resolve: {
        alias: {
            // 3️⃣ Alias Node core modules to polyfilled versions
            util:    'rollup-plugin-node-polyfills/polyfills/util',
            buffer:  'rollup-plugin-node-polyfills/polyfills/buffer-es6',
            events:  'rollup-plugin-node-polyfills/polyfills/events',
            stream:  'rollup-plugin-node-polyfills/polyfills/stream',
            path:    'rollup-plugin-node-polyfills/polyfills/path',
            process: 'rollup-plugin-node-polyfills/polyfills/process-es6',
        }
    },

    build: {
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
