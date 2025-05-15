import { ParsedTemplate } from '../types';

export class TemplateParser {
    constructor() {}

    parse(template: string): ParsedTemplate {
        const errors: string[] = [];
        let componentName = '';
        let attributes = {};
        let slots = {};
        let expressions: string[] = [];
        let directives;

        try {
            componentName = this.extractComponentName(template) || '';
            attributes = this.parseAttributes(template);
            slots = this.parseSlots(template);
            expressions = this.parseExpressions(template);
            directives = this.parseDirectives(attributes);
        } catch (err: any) {
            errors.push(`Parsing failed: ${err.message}`);
        }

        return { componentName, attributes, slots, expressions, directives, errors };
    }

    private extractComponentName(template: string): string | null {
        const match = template.match(/<([A-Z][a-zA-Z0-9]*)[\s>]/);
        return match ? match[1] : null;
    }

    private parseAttributes(template: string): Record<string, string> {
        const attributes: Record<string, string> = {};
        const attributeRegex = /([a-zA-Z0-9_:@\-]+)="([^"]*)"/g;
        let match;

        while ((match = attributeRegex.exec(template)) !== null) {
            const [, name, value] = match;
            attributes[name] = value;
        }

        return attributes;
    }

    private parseSlots(template: string): Record<string, string> {
        const slots: Record<string, string> = {};
        const slotRegex = /<slot name="([^"]*)"[^>]*>([\s\S]*?)<\/slot>/g;
        let match;

        while ((match = slotRegex.exec(template)) !== null) {
            const [, name, content] = match;
            slots[name] = content.trim();
        }

        return slots;
    }

    private parseExpressions(template: string): string[] {
        const expressions: string[] = [];
        const expressionRegex = /\{\{\s*([^}]+?)\s*\}\}/g;
        let match;

        while ((match = expressionRegex.exec(template)) !== null) {
            const [, expr] = match;
            expressions.push(expr.trim());
        }

        return expressions;
    }

    /**
     * Extract directives like v-if, v-for, and :bindings from attributes
     */
    private parseDirectives(attributes: Record<string, string>): ParsedTemplate['directives'] {
        const directives: ParsedTemplate['directives'] = {
            bindings: {},
        };

        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'v-if') {
                directives.vIf = value;
            } else if (key === 'v-for') {
                const match = value.match(/^([a-zA-Z0-9_$]+)\s+in\s+([a-zA-Z0-9_$.]+)$/);
                if (match) {
                    const [, item, iterable] = match;
                    directives.vFor = { item, iterable };
                }
            } else if (key.startsWith(':')) {
                const bindingName = key.slice(1);
                directives.bindings![bindingName] = value;
            }
        }

        return directives;
    }
}
