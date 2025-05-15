export async function runStart() {
    const { spawn } = await import("child_process");
    const start = spawn("vite", ["preview"], { stdio: "inherit", shell: true });

    start.on("exit", (code) => {
        if (code !== 0) console.error(`❌ Preview exited with code ${code}`);
    });
}
