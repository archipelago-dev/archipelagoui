// core/workers/render.worker.ts

import { TemplateParser } from '../renderer/template-parser';
import { HtmlTransformer } from '../renderer/html-transformer';
import type { ParsedTemplate, RenderContext, RenderOptions } from '../types';




self.onmessage = async (e) => {

    const { id, template, context, options } = e.data as {
        id: string;
        template: string;
        context: RenderContext;
        options: RenderOptions;
    };

    try {
        const parser = new TemplateParser();
        const parsed: ParsedTemplate = parser.parse(template);

        const transformer = new HtmlTransformer(context, options);
        const html = transformer.transform(parsed);

        self.postMessage({ id, html });
    } catch (err: any) {
        self.postMessage({ id, error: err.message });
    }
};
