import * as fs from 'fs';
import * as path from 'path';
import { TemplateRenderer } from '../../core/cli/template-renderer.js';
import { RenderContext } from '../../core/types';

import chokidar from 'chokidar';

function loadContextForFile(filePath: string, defaultContextPath: string): RenderContext {
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const fileContextPath = path.join(dir, `${baseName}.context.json`);

    let globalCtx: RenderContext = {};
    let fileCtx: RenderContext = {};

    if (fs.existsSync(defaultContextPath)) {
        try {
            globalCtx = JSON.parse(fs.readFileSync(defaultContextPath, 'utf-8'));
        } catch {}
    }

    if (fs.existsSync(fileContextPath)) {
        try {
            fileCtx = JSON.parse(fs.readFileSync(fileContextPath, 'utf-8'));
        } catch {}
    }

    return { ...globalCtx, ...fileCtx };
}

async function renderFile(renderer: TemplateRenderer, filePath: string, outputDir: string, defaultCtxPath: string) {
    try {
        const context = loadContextForFile(filePath, defaultCtxPath);
        const content = fs.readFileSync(filePath, 'utf-8');
        const html = await renderer.renderWithHydration(content, context);

        const outputFile = path.join(outputDir, path.basename(filePath).replace(/\.\w+$/, '.html'));
        fs.writeFileSync(outputFile, html);
        console.log(`✅ Rendered ${filePath} → ${outputFile}`);
    } catch (err) {
        console.error(`⚠️ Error rendering ${filePath}:`, err);
    }
}

export async function runRender(input: string, outputDir: string, watch = false) {
    const isDirectory = fs.statSync(input).isDirectory();
    const defaultCtxPath = isDirectory
        ? path.join(input, 'context.default.json')
        : path.join(path.dirname(input), 'context.default.json');

    const renderer = new TemplateRenderer();
    await renderer.initialize();

    const renderAll = async () => {
        const files = isDirectory
            ? fs.readdirSync(input)
                .filter(f => f.endsWith('.archy'))
                .map(f => path.join(input, f))
            : [input];

        fs.mkdirSync(outputDir, { recursive: true });

        console.clear();
        console.log(`🔁 Rendering ${files.length} file(s)...`);
        for (const filePath of files) {
            await renderFile(renderer, filePath, outputDir, defaultCtxPath);
        }
        console.log(`✨ Done at ${new Date().toLocaleTimeString()}`);
    };

    await renderAll();

    if (watch) {
        const watchPaths = isDirectory
            ? [
                path.join(input, '**/*.archy'),
                path.join(input, '**/*.context.json'),
                defaultCtxPath,
            ]
            : [input, input.replace(/\.archy$/, '.context.json'), defaultCtxPath];

        chokidar.watch(watchPaths).on('change', async (changedPath) => {
            console.clear();
            console.log(`🔄 File changed: ${changedPath}`);
            await renderAll();
        });
    }
}
