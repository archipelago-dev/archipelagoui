// ../types.ts

/**
 * Context passed into the renderer for expression evaluation and interpolation.
 * Keys are variable names, values are any serializable content.
 */
export type RenderContext = Record<string, any>;

/**
 * Rendering options to control behavior (e.g. hydration, SSR toggles).
 */
export interface RenderOptions {
    hydrate?: boolean;
    ssr?: boolean;
    clientOnly?: boolean;
}

/**
 * Options for the template parser (e.g. custom directive handling in the future).
 */
export interface TemplateParserOptions {
    // Placeholder for future enhancements
}

/**
 * The parsed template AST used by HtmlTransformer
 */
export interface ParsedTemplate {
    componentName: string;
    attributes: Record<string, string>;
    slots: Record<string, string>;
    expressions: string[];
    directives?: {
        vIf?: string;
        vFor?: { item: string; iterable: string };
        bindings?: Record<string, string>;
    };
    errors?: string[];
}

