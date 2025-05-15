import { ParsedTemplate, RenderContext, RenderOptions } from '../types';

/**
 * HtmlTransformer
 * Converts a ParsedTemplate into final HTML output with context and render options.
 */
export class HtmlTransformer {
    constructor(private context: RenderContext, private options: RenderOptions = {}) {}

    public transform(template: ParsedTemplate): string {
        if (this.shouldSkip(template)) return '';

        if (template.directives?.vFor) {
            return this.renderLoop(template);
        }

        const tag = template.componentName;
        const attrs: Record<string, string> = {};

        // Bindings (:title="x")
        const bindings = template.directives?.bindings || {};
        for (const [name, expr] of Object.entries(bindings)) {
            try {
                const value = this.evalInContext(expr);
                attrs[name] = String(value);
            } catch {
                attrs[name] = '';
            }
        }

        // Static attributes
        for (const [name, value] of Object.entries(template.attributes)) {
            if (!name.startsWith(':') && name !== 'v-if' && name !== 'v-for') {
                attrs[name] = this.interpolate(value);
            }
        }

        // Hydration support
        if (this.options.hydrate) {
            attrs['data-hydrate'] = 'true';
            attrs['data-component'] = tag;
        }

        // Build attributes string
        const attrString = Object.entries(attrs)
            .map(([key, val]) => `${key}="${val}"`)
            .join(' ');

        // Render inner slot content with interpolation
        const innerHTML = Object.values(template.slots)
            .map(content => this.interpolate(content))
            .join('');

        // Client-only short circuit (no SSR)
        if (this.options.clientOnly && !this.options.ssr) {
            return `<${tag} />`;
        }

        return `<${tag}${attrString ? ' ' + attrString : ''}>${innerHTML}</${tag}>`;
    }

    private renderLoop(template: ParsedTemplate): string {
        const { item, iterable } = template.directives!.vFor!;
        const array = this.evalInContext(iterable);
        if (!Array.isArray(array)) return '';

        return array
            .map((value, index) => {
                const scopedContext = {
                    ...this.context,
                    [item]: value,
                    index,
                };
                const instance = new HtmlTransformer(scopedContext, this.options);
                const clone: ParsedTemplate = {
                    ...template,
                    directives: { ...template.directives, vFor: undefined }, // Prevent recursion
                };
                return instance.transform(clone);
            })
            .join('');
    }

    private shouldSkip(template: ParsedTemplate): boolean {
        const expr = template.directives?.vIf;
        if (!expr) return false;

        try {
            const result = this.evalInContext(expr);
            return !result;
        } catch {
            return false;
        }
    }

    private interpolate(content: string): string {
        return content.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr) => {
            try {
                const result = this.evalInContext(expr);
                return result != null ? String(result) : '';
            } catch {
                return '';
            }
        });
    }

    private evalInContext(expr: string): any {
        return Function(...Object.keys(this.context), `return (${expr})`)(
            ...Object.values(this.context)
        );
    }
}
