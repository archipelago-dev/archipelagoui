import { describe, it, expect } from '@jest/globals';
import { HtmlTransformer } from '../../core/renderer/html-transformer';
import type { ParsedTemplate, RenderContext, RenderOptions } from '../../core/types';

function makeTemplate(partial: Partial<ParsedTemplate>): ParsedTemplate {
    return {
        componentName: partial.componentName || 'TestComponent',
        attributes: partial.attributes || {},
        slots: partial.slots || {},
        expressions: partial.expressions || [],
        directives: partial.directives || {},
        errors: [],
    };
}

describe('HtmlTransformer', () => {
    const defaultContext: RenderContext = {
        user: { name: 'Nicolas', active: true },
        year: 2025,
        products: [
            { id: 1, title: 'Shirt' },
            { id: 2, title: 'Pants' },
        ],
    };
    const options: RenderOptions = {};

    it('renders expressions correctly', () => {
        const tpl = makeTemplate({
            attributes: { title: '{{ user.name }}' },
            expressions: ['user.name'],
        });

        const transformer = new HtmlTransformer(defaultContext, options);
        const html = transformer.transform(tpl);
        expect(html).toContain('title="Nicolas"');
    });

    it('renders slot content with expressions', () => {
        const tpl = makeTemplate({
            slots: {
                footer: '© {{ year }} Hydra',
            },
            expressions: ['year'],
        });

        const transformer = new HtmlTransformer(defaultContext, options);
        const html = transformer.transform(tpl);
        expect(html).toContain('© 2025 Hydra');
    });

    it('respects v-if = false and skips rendering', () => {
        const tpl = makeTemplate({
            attributes: { 'v-if': 'user.active' },
            directives: { vIf: 'false' }, // override active state
        });

        const transformer = new HtmlTransformer(defaultContext, options);
        const html = transformer.transform(tpl);
        expect(html).toBe('');
    });

    it('renders multiple v-for items with bindings and expressions', () => {
        const tpl = makeTemplate({
            attributes: {
                ':title': 'item.title',
                'v-for': 'item in products',
            },
            directives: {
                vFor: { item: 'item', iterable: 'products' },
                bindings: { title: 'item.title' },
            },
            expressions: ['item.title'],
        });

        const transformer = new HtmlTransformer(defaultContext, options);
        const html = transformer.transform(tpl);
        expect(html).toContain('title="Shirt"');
        expect(html).toContain('title="Pants"');
    });

    it('renders hydration attributes if enabled', () => {
        const tpl = makeTemplate({ componentName: 'Hydratable' });

        const transformer = new HtmlTransformer(defaultContext, { hydrate: true });
        const html = transformer.transform(tpl);
        expect(html).toContain('data-hydrate');
        expect(html).toContain('data-component="Hydratable"');
    });

    it('skips SSR output if clientOnly is true', () => {
        const tpl = makeTemplate({ componentName: 'ClientOnly' });

        const transformer = new HtmlTransformer(defaultContext, { clientOnly: true, ssr: false });
        const html = transformer.transform(tpl);
        expect(html).toContain('<ClientOnly');
        expect(html).not.toContain('</ClientOnly>');
    });
});
