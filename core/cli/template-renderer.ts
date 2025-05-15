
import { TemplateParser } from '../renderer/template-parser';
import { HtmlTransformer } from '../renderer/html-transformer';
import {ParsedTemplate, RenderContext, RenderOptions, TemplateParserOptions} from '../types';

import * as path from 'path';
import * as fs from 'fs';

/**
 * Template renderer for Archipelago Framework
 */
export class TemplateRenderer  {
    private readonly parser: TemplateParser;

    private readonly parserOptions: TemplateParserOptions;
    private initialized = false;

    constructor(parserOptions: TemplateParserOptions = {}) {
        this.parser = new TemplateParser();
        this.parserOptions = parserOptions;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;



        this.initialized = true;
    }



    private resolveArchipelagoDir(base: string): string {
        if (base.endsWith('archipelago')) return base;
        if (fs.existsSync(path.join(base, 'archipelago'))) return path.join(base, 'archipelago');
        if (path.basename(base) === 'Archipelago_Framework') return path.join(base, 'archipelago');
        return base;
    }

    public async render(template: string, context: RenderContext = {}, options: RenderOptions = {}): Promise<string> {
        if (!this.initialized) await this.initialize();
        return this.processTemplate(template, context, options);
    }

    public renderSync(template: string, context: RenderContext = {}, options: RenderOptions = {}): string {
        return this.processTemplate(template, context, options);
    }

    public async renderWithHydration(template: string, context: RenderContext = {}, options: RenderOptions = {}): Promise<string> {
        return this.render(template, context, { ...options, hydrate: true });
    }

    public renderWithHydrationSync(template: string, context: RenderContext = {}, options: RenderOptions = {}): string {
        return this.renderSync(template, context, { ...options, hydrate: true });
    }

    public async renderClientOnly(template: string, context: RenderContext = {}, options: RenderOptions = {}): Promise<string> {
        return this.render(template, context, { ...options, clientOnly: true, ssr: false });
    }

    public renderClientOnlySync(template: string, context: RenderContext = {}, options: RenderOptions = {}): string {
        return this.renderSync(template, context, { ...options, clientOnly: true, ssr: false });
    }

    public async renderFile(filePath: string, context: RenderContext = {}, options: RenderOptions = {}): Promise<string> {
        try {
            const template = fs.readFileSync(filePath, 'utf-8');
            return this.render(template, context, options);
        } catch (error) {
            console.error(`Error rendering file: ${filePath}`, error);
            return `<!-- Error rendering file: ${filePath} -->`;
        }
    }

    private preprocess(template: string): string {
        return template;
    }

    private processTemplate(template: string, context: RenderContext, options: RenderOptions): string {
        const preprocessed = this.preprocess(template);
        const ast: ParsedTemplate = this.parser.parse(preprocessed);


        const transformer = new HtmlTransformer(context, options);
        return transformer.transform(ast);
    }
}
