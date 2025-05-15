export async function runBuild() {
    const { spawn } = await import("child_process");
    const build = spawn("vite", ["build"], { stdio: "inherit", shell: true });

    build.on("exit", (code) => {
        if (code !== 0) console.error(`❌ Build failed with code ${code}`);
    });
}
