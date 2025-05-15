/**
 * Archipelago “Hello over DTLS” demo
 *
 * 1. Registers an in‑memory VFS and the DTLS adapter.
 * 2. Reads JSON from `dtls://hello.json` (served by your echo server).
 * 3. Builds an <Island> template string with the message.
 * 4. Parses it via TemplateParser and hydrates it with HydrationController.
 */

import { createMemoryVFS }      from "../../core/vfs/memory-vfs";
import { VfsRegistry }          from "../../core/vfs/registry";
import { DtlsVfsAdapter }       from "../../core/vfs/adapter/dtls";

import { HydrationController }  from "../../core/runtime";
import { TemplateParser }       from "../../core/renderer/template-parser";

// ────────────────────────────────────────────────────────────────
// Bootstrap
// ────────────────────────────────────────────────────────────────
(async () => {
    /* 1 ── Register default memory backend & DTLS adapter */
    VfsRegistry.register(createMemoryVFS());                     // scheme: mem://
    VfsRegistry.register(new DtlsVfsAdapter("127.0.0.1", 4444)); // scheme: dtls://

    /* 2 ── Secure‑fetch JSON over DTLS */
    const data    = await VfsRegistry.readFile("dtls://hello.json");
    const message = new TextDecoder().decode(data);

    /* 3 ── Build Island markup */
    const tplString = `<Island>Hello over DTLS: ${message}</Island>`;

    /* 4 ── Parse via TemplateParser */
    const parsed    = new TemplateParser().parse(tplString);

    const h = HydrationController.getInstance();

    /* 5 ── Hydrate into #root */
    await h.hydrateIsland(
        document.getElementById("root")!,
        parsed.toString()
    );
})();

