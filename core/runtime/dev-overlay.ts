type HydrationLog = {
    id: string;
    tag: string;
    priority: number;
    time: number;
};

const log: HydrationLog[] = [];
let overlay: HTMLElement | null = null;
let visible = true;

export function recordHydration(tag: string, id: string, priority: number) {
    const entry = {
        tag,
        id,
        priority,
        time: performance.now()
    };
    log.push(entry);
    if (overlay && visible) {
        appendToOverlay(entry);
    }
}

function appendToOverlay(entry: HydrationLog) {
    const line = document.createElement("div");
    line.className = "hydration-log-line";
    line.textContent = `[${entry.id}] ${entry.tag} @ ${entry.priority}`;
    overlay?.appendChild(line);
}

export function setupHydrationOverlay() {
    if (typeof window === "undefined") return;

    overlay = document.createElement("div");
    overlay.id = "archipelago-hydration-overlay";
    Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        right: "0",
        background: "rgba(0,0,0,0.85)",
        color: "#0f0",
        font: "12px monospace",
        padding: "0.5em",
        zIndex: "9999",
        maxHeight: "40vh",
        overflow: "auto",
        borderLeft: "2px solid lime",
        borderBottom: "2px solid lime"
    });

    document.body.appendChild(overlay);
    window.addEventListener("keydown", (e) => {
        if (e.shiftKey && e.key === "A") {
            visible = !visible;
            overlay!.style.display = visible ? "block" : "none";
        }
    });
}
