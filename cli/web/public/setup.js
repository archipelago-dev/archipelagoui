const moduleList = document.getElementById("module-list");
const preview = document.getElementById("project-preview");
const outputEl = document.getElementById("cli-output");

let currentStream = null;

function updatePreview(name, features, modules) {
    const tree = [
        `${name}/`,
        `├── archipelago.config.ts`,
        `├── public/`,
        `│   └── index.html`,
        `├── src/`,
        `│   ├── main.ts`,
        `│   ├── components/`,
        `│   ├── pages/`,
        `│   └── modules/`,
        ...modules.map((m) => `│   └── modules/${m}/`),
        `└── assets/`,
        `    └── global.css`
    ];
    preview.textContent = tree.join("\n");
}

window.addEventListener("DOMContentLoaded", async () => {
    // Load modules
    const res = await fetch("/api/modules");
    const mods = await res.json();
    moduleList.innerHTML = mods
        .map(
            (mod) =>
                `<label class="block"><input type="checkbox" name="modules" value="${mod.name}" />
         <strong>${mod.name}</strong>: ${mod.description}</label>`
        )
        .join("");

    // Setup form behavior
    const form = document.getElementById("setup-form");
    form.addEventListener("input", () => {
        const data = new FormData(form);
        updatePreview(
            data.get("name") || "my-app",
            data.getAll("features"),
            data.getAll("modules")
        );
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const payload = {
            name: data.get("name"),
            features: data.getAll("features"),
            modules: data.getAll("modules")
        };

        const result = await fetch("/api/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const json = await result.json();
        alert(`✅ App scaffolded to: ${json.location}`);
    });

    // CLI command buttons
    document.querySelectorAll(".cmd-button").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const cmd = btn.dataset.cmd;

            if (currentStream) {
                currentStream.close();
                outputEl.textContent += `\n🛑 Process stopped manually\n`;
                currentStream = null;
                return;
            }

            outputEl.textContent = `> pnpm run ${cmd}\n\n`;
            btn.textContent = `⏳ ${cmd}`;
            btn.disabled = true;

            const sse = new EventSource(`/api/run-stream?command=${cmd}`);
            currentStream = sse;

            sse.onmessage = (e) => {
                outputEl.textContent += e.data + "\n";
                outputEl.scrollTop = outputEl.scrollHeight;
            };

            sse.addEventListener("close", () => {
                outputEl.textContent += "\n✅ Done.\n";
                btn.textContent = cmd;
                btn.disabled = false;
                currentStream = null;
            });

            sse.addEventListener("stdout", (e) => {
                const line = document.createElement("div");
                line.className = "text-green-400";
                line.textContent = e.data;
                outputEl.appendChild(line);
                outputEl.scrollTop = outputEl.scrollHeight;
            });

            sse.addEventListener("stderr", (e) => {
                const line = document.createElement("div");
                line.className = "text-red-400";
                line.textContent = e.data;
                outputEl.appendChild(line);
                outputEl.scrollTop = outputEl.scrollHeight;
            });

            sse.onerror = () => {
                outputEl.textContent += "\n❌ Stream error.\n";
                btn.textContent = cmd;
                btn.disabled = false;
                currentStream = null;
                sse.close();
            };
        });
    });
});
