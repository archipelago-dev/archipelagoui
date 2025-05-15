export async function runDev() {
    const { spawn } = await import("child_process");
    const dev = spawn("vite", ["dev"], { stdio: "inherit", shell: true });

    dev.on("exit", (code) => {
        if (code !== 0) console.error(`❌ Dev server exited with code ${code}`);
    });
}
