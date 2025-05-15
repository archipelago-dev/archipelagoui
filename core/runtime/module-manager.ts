type LifecycleContext = Record<string, any>;
type LifecyclePhase =
    | "onInitGlobal"
    | "onBeforeParse"
    | "onParsed"
    | "onBeforeResolve"
    | "onAfterResolve"
    | "onBeforeRender"
    | "onAfterRender"
    | "onDestroy"
    | "onError";

type Module = Partial<Record<LifecyclePhase, (ctx: LifecycleContext) => void | Promise<void>>>;

const registeredModules: Module[] = [];

export function registerModule(mod: Module) {
    registeredModules.push(mod);
}

export async function callLifecycle(phase: LifecyclePhase, context: LifecycleContext) {
    for (const mod of registeredModules) {
        try {
            if (mod[phase]) {
                await mod[phase]!(context);
            }
        } catch (err) {
            console.warn(`[ModuleManager] Error in module during ${phase}:`, err);
        }
    }
}
