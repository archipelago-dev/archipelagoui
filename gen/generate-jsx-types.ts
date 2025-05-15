#!/usr/bin/env tsx

import ts from "typescript";
import fs from "fs";
import path from "path";
import chokidar from "chokidar";

const inputDir = path.resolve(process.argv[2] || "components");
const outDir = path.resolve("syntax");
const typeFile = path.join(outDir, "language.generated.d.ts");

const htmlTags = [
    "div", "section", "main", "header", "footer", "nav", "article", "aside",
    "ul", "li", "span", "h1", "h2", "h3", "p", "button", "input", "label", "form"
];

function normalizeTagName(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9]/g, " ")
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");
}

function toKebabCase(name: string): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
        .toLowerCase();
}

function runGeneration() {
    const tagPropTypes = new Map<string, Map<string, string>>();
    const tagsWithChildren = new Set<string>();

    function inferType(attr: ts.JsxAttribute | ts.JsxSpreadAttribute): [string, string] | null {
        if (ts.isJsxSpreadAttribute(attr)) return ["props", "Record<string, any>"];
        // @ts-ignore
        const name = attr.name.text;
        if (!attr.initializer) return [name, "boolean"];
        if (ts.isJsxExpression(attr.initializer)) {
            const expr = attr.initializer.expression;
            if (!expr) return [name, "any"];
            switch (expr.kind) {
                case ts.SyntaxKind.StringLiteral: return [name, "string"];
                case ts.SyntaxKind.NumericLiteral: return [name, "number"];
                case ts.SyntaxKind.TrueKeyword:
                case ts.SyntaxKind.FalseKeyword: return [name, "boolean"];
                default: return [name, "any"];
            }
        }
        if (ts.isStringLiteral(attr.initializer)) return [name, "string"];
        return [name, "any"];
    }

    function visit(node: ts.Node) {
        if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
            const rawTag = node.tagName.getText();
            const tagName = normalizeTagName(rawTag);

            if (!tagPropTypes.has(tagName)) tagPropTypes.set(tagName, new Map());

            const propEntries = node.attributes.properties;
            for (const attr of propEntries) {
                const inferred = inferType(attr);
                if (!inferred) continue;
                const [propName, type] = inferred;
                tagPropTypes.get(tagName)!.set(propName, type);
            }

            if (ts.isJsxOpeningElement(node) && node.parent?.children?.length) {
                tagsWithChildren.add(tagName);
            }
        }
        ts.forEachChild(node, visit);
    }

    function parseFile(filePath: string) {
        let content = fs.readFileSync(filePath, "utf-8");
        content = content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
            .replace(/<css[\s\S]*?>[\s\S]*?<\/css>/gi, "")
            .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
        const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        visit(sourceFile);
    }

    function scanDir(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) scanDir(fullPath);
            else if (entry.name.endsWith(".archy.tsx")) parseFile(fullPath);
        }
    }

    scanDir(inputDir);

    const dtsLines: string[] = [
        "// AUTO-GENERATED FILE. DO NOT EDIT.",
        "declare global {",
        "  namespace JSX {",
        "    interface IntrinsicElements {"
    ];

    const sharedPropsTypeDefs: string[] = [
        "  interface LazyImportProps { name?: string; children?: any; [key: `data-${string}`]: any; }",
        "  interface HTMLBaseProps { class?: string; id?: string; children?: any; [key: `data-${string}`]: any; }"
    ];

    for (const tag of htmlTags) {
        dtsLines.push(`      ${tag}: HTMLBaseProps;`);
    }

    for (const [tag, types] of tagPropTypes.entries()) {
        const kebab = toKebabCase(tag);
        const propEntries = Array.from(types).map(([p, t]) => `${p}?: ${t}`);
        if (tagsWithChildren.has(tag)) propEntries.push("children?: any");
        propEntries.push("[key: `data-${string}`]: any");

        const sharedType = `  interface ${tag}Props { ${propEntries.join("; ")} }`;
        sharedPropsTypeDefs.push(sharedType);

        dtsLines.push(`      ${tag}: ${tag}Props;`);
        dtsLines.push(`      \"${kebab}\": ${tag}Props;`);
    }

    dtsLines.push("      LazyImport: LazyImportProps;");
    dtsLines.push("      \"lazy-import\": LazyImportProps;");
    dtsLines.push("    }", "  }", sharedPropsTypeDefs.join("\n"), "}", "export {};");

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(typeFile, dtsLines.join("\n"));
    console.log(`✅ JSX types → ${typeFile}`);
}

if (process.argv.includes("--watch")) {
    chokidar.watch(`${inputDir}/**/*.archy.tsx`).on("change", runGeneration).on("add", runGeneration);
    console.log("👀 Watching for JSX tags...");
    runGeneration();
} else {
    runGeneration();
}
