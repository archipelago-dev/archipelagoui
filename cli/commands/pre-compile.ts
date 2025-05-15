export async function runPreCompile() {
    console.log("🧪 Running JSX pre-compile and stub generation...");
    const { execSync } = await import("child_process");
    try {
        execSync("pnpm exec tsx src/gen/generate-jsx-types.ts", { stdio: "inherit" });
        execSync("pnpm exec tsx src/gen/generate-glob-imports.ts", { stdio: "inherit" });
    } catch (err) {
        console.error("❌ Pre-compile failed:", err);
    }
}
