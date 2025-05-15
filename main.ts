/**
 * Archipelago “Hello over DTLS” demo
 *
 * 1. Registers an in‑memory VFS and the DTLS adapter.
 * 2. Reads JSON from `dtls://hello.json` (served by your echo server).
 * 3. Builds an <Island> template string with the message.
 * 4. Parses it via TemplateParser and hydrates it with HydrationController.
 */

import { createMemoryVFS }      from "./core/vfs/memory-vfs";
import { VfsRegistry }          from "./core/vfs/registry";


import { HydrationController }  from "./core/runtime";
import { TemplateParser }       from "./core/renderer/template-parser";
import * as path                     from "path";
import * as fs                       from "fs";
import {createDiskSafeVFS} from "./core/vfs/adapter/disk-safe-vfs";
import {IVirtualFileSystem} from "./core/vfs/types";



const cert = fs.readFileSync(
    // @ts-ignore
    path.resolve(import.meta.dirname, "./certs/client.crt")
);
const key  = fs.readFileSync(
    // @ts-ignore
    path.resolve(import.meta.dirname, "./certs/client.key")
);
// ────────────────────────────────────────────────────────────────
// Bootstrap
// ────────────────────────────────────────────────────────────────
(async () => {
    /* 1 ── Register default memory backend  */
    VfsRegistry.register(createMemoryVFS());


    VfsRegistry.register(
      createDiskSafeVFS('./data') as unknown as IVirtualFileSystem // scheme: disk-safe://

    );
    /* 2 ── Secure‑fetch JSON over DTLS */
    const data    = await VfsRegistry.readFile("disk-safe://hello.json");
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

