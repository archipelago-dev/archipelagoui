// @ts-ignore
export * from "./lazy-import.js";
// @ts-ignore
export * from "./hydration-controller.js";
// @ts-ignore
export * from "./pubsub.js";
// @ts-ignore
export * from "./utils.js";
if (typeof window !== "undefined") {
    // @ts-ignore
    window.__archipelago__ = {
        version: "0.1.0",
        name: "Archipelago",
        description: "A framework for building distributed applications."
    };

}