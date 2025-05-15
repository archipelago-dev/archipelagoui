import { startArchipelago } from "../../core/runtime/main.js";

export async function runHydrate(opts: { debug?: boolean }) {
    await startArchipelago({ debug: !!opts.debug });
}
