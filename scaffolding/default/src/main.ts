async function main() {
    if (typeof window !== "undefined") {
        // ——— 1) Only here do we pull in Vite’s env shim ———
        const { MODE } = await import("/@vite/env");
        console.log("Running in browser, MODE =", MODE);
        console.log("Environment check, window is", typeof window === 'undefined' ? "undefined (SSR)" : "defined (browser)");


        // ——— 2) Dynamically import any Archipelago runtime that might touch import.meta.env ———
        const { createMemoryVFS }      = await import("@archipelagoui/core/vfs/memory-vfs");
        const { VfsRegistry }          = await import("@archipelagoui/core/vfs/registry");
        const { TemplateParser }       = await import("@archipelagoui/core/renderer/template-parser");
        const { HydrationController }  = await import("@archipelagoui/core/runtime");
        const { initializeArchipelago }= await import("@archipelagoui/core/runtime/ArchipelagoRenderer");

        // Now do your normal bootstrap:
        VfsRegistry.register(createMemoryVFS());
        await initializeArchipelago({ autoHydrate: true, debug: true });

        // Seed and read your file…
        const initial = { msg: "world" };
        await VfsRegistry.writeFile("mem://hello.json", new TextEncoder().encode(JSON.stringify(initial)));
        const buf = await VfsRegistry.readFile("mem://hello.json");
        const { msg } = JSON.parse(new TextDecoder().decode(buf));

        // Build & hydrate…
        const tplString = `<Island>Hello over VFS: ${msg}</Island>`;
        const parsed    = new TemplateParser().parse(tplString);
        const root = document.getElementById("root");
        if (!root) throw new Error("#root element not found");
        await HydrationController.getInstance().hydrateIsland(root, parsed.toString());
    } else {
        console.log("Running in non-browser (SSR) mode—skipping client bits.");
    }
}

main().catch(err => console.error(err));
