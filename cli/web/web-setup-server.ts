// @ts-nocheck
import express from "express";
// @ts-ignore
import fs from "fs-extra";
import path from "path";
import open from "open";
import bodyParser from "body-parser";

const PORT = 8822;
const app = express();
const TEMPLATE_DIR = path.resolve("scaffolding/default");

app.use(bodyParser.json());
app.use(express.static(path.resolve("cli/web/public"))); // frontend

// List available modules (mocked for now)
app.get("/api/modules", (req, res) => {
    res.json([
        { name: "auth-bridge", description: "ZKP auth module" },
        { name: "edge-share", description: "Edge mesh loader" },
        { name: "analytics", description: "Privacy-first analytics" }
    ]);
});

// Handle scaffold submission
app.post("/api/create", async (req, res) => {
    const { name, features, modules } = req.body;
    const dest = path.resolve(name);

    await fs.copy(TEMPLATE_DIR, dest);

    const config = {
        name,
        features,
        modules
    };

    await fs.writeFile(
        path.join(dest, "archipelago.config.ts"),
        `export default ${JSON.stringify(config, null, 2)}`
    );

    res.json({ status: "ok", location: dest });
});

app.post("/api/run", async (req: any, res: any): Promise<void>=> {
    const { command } = req.body;
    const commands = ["dev", "build", "verify", "pre-compile", "start"];
    if (!commands.includes(command)) return res.status(400).json({ status: "invalid" });

    try {
        const { spawn } = await import("child_process");
        const proc = spawn("pnpm", ["run", command], {
            cwd: process.cwd(),
            stdio: "inherit",
            shell: true
        });

        proc.on("exit", (code) => {
            res.json({ status: code === 0 ? "ok" : "fail", code });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", error: err });
    }
});

app.get("/api/run-stream", (req, res) => {
    const { command } = req.query;
    if (!command || typeof command !== "string") {
        return res.status(400).send("Missing command");
    }

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
    });

    const { spawn } = require("child_process");
    const child = spawn("pnpm", ["run", command], {
        cwd: process.cwd(),
        shell: true
    });

    child.stdout.on("data", (data) => {
        res.write(`event: stdout\ndata: ${data.toString().trim()}\n\n`);
    });

    child.stderr.on("data", (data) => {
        res.write(`event: stderr\ndata: ${data.toString().trim()}\n\n`);
    });

    child.on("exit", (code) => {
        res.write(`event: stdout\ndata: ❌ process exited with code ${code}\n\n`);
        res.write("event: close\ndata: done\n\n");
        res.end();
    });

    req.on("close", () => {
        child.kill("SIGTERM");
    });
});




app.listen(PORT, () => {
    console.log(`🚀 Graphical setup ready at http://localhost:${PORT}`);

});
