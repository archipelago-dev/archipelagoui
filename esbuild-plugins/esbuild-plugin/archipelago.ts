import { Plugin } from "esbuild";
import fs from "fs";
import path from "path";

const SYNTAX_DIR = path.resolve("syntax");
const STUB_DIR = path.join(SYNTAX_DIR, "stubs");
const COMPONENTS_JSON = path.join(SYNTAX_DIR, "components.json");

export default function ArchipelagoPlugin(): Plugin {
    return {
        name: "esbuild-plugin-archipelago",
        setup(  build: any) {
            const virtualId = "virtual:archipelago-runtime";

            build.onResolve({ filter: /^virtual:archipelago-runtime$/ }, (args:any) => {
                return {path: virtualId, namespace: "archipelago-runtime"};
            });

            build.onLoad({filter: /.*/, namespace: "archipelago-runtime"}, () => {
                const meta = JSON.parse(fs.readFileSync(COMPONENTS_JSON, "utf-8"));
                const imports: string[] = [];
                const cases: string[] = [];

                for (const tag in meta) {
                    const stubFile = `./stubs/${tag}.ts`;
                    if (fs.existsSync(path.join(STUB_DIR, `${tag}.ts`))) {
                        imports.push(`import { ${tag} } from "${stubFile}";`);
                        cases.push(`case "${tag}": return ${tag}(props);`);
                    }
                }

                // LazyImport split
                imports.push(`import { LazyImportAsync } from "./stubs/LazyImportAsync";`);
                imports.push(`import { LazyImportSync } from "./stubs/LazyImportSync";`);
                cases.push(`case "LazyImportAsync": return LazyImportAsync(props);`);
                cases.push(`case "LazyImportSync": return LazyImportSync(props);`);

                const code = `
${imports.join("\n")}

export function ArchipelagoRenderer(tag, props, target) {
  let result;
  switch (tag) {
    ${cases.join("\n    ")}
    default:
      console.warn("Unknown tag:", tag);
      return;
  }

  if (typeof result === "string") {
    target.innerHTML = result;
  } else if (result instanceof HTMLElement) {
    target.replaceChildren(result);
  } else {
    console.warn("Invalid render output for tag:", tag);
  }
}

function datasetToProps(el) {
  const out = {};
  for (const [key, value] of Object.entries(el.dataset)) {
    if (key !== "tag") {
      try {
        out[key] = JSON.parse(value);
      } catch {
        out[key] = value;
      }
    }
  }
  return out;
}

export function hydrateDomAutomatically() {
  const nodes = document.querySelectorAll("[data-tag]");
  nodes.forEach(el => {
    const tag = el.dataset.tag;
    const props = datasetToProps(el);
    ArchipelagoRenderer(tag, props, el);
  });
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hydrateDomAutomatically);
  } else {
    hydrateDomAutomatically();
  }
}

`;

                return {
                    contents: code,
                    loader: "ts"
                };
            });
        }
    };
}
