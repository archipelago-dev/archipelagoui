import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import {fileURLToPath} from "node:url";
import * as path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [tsconfigPaths()],
    resolve: {
        alias: {
            "@archipelagoui/ui": path.resolve(__dirname, "../core-libs/ui/src"),
        },
    },
});
