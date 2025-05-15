// core/devtools/hydration-dev-overlay.ts
var HydrationDevOverlay = class {
  static panel = null;
  static logList = null;
  static visible = false;
  static init() {
    if (this.panel) return;
    this.panel = document.createElement("div");
    this.panel.id = "hydration-dev-panel";
    this.panel.innerHTML = `
      <style>
        #hydration-dev-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 300px;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          color: #00ff88;
          font-family: monospace;
          font-size: 12px;
          padding: 10px;
          box-shadow: -2px 0 8px rgba(0,0,0,0.5);
          transform: translateX(100%);
          transition: transform 0.3s ease;
          z-index: 9999;
        }

        #hydration-dev-panel.open {
          transform: translateX(0);
        }

        #hydration-dev-toggle {
          position: fixed;
          top: 10px;
          right: 310px;
          z-index: 10000;
          background: #00ff88;
          color: #000;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          border-radius: 3px;
          user-select: none;
        }

        #hydration-dev-panel h3 {
          margin-top: 0;
          font-size: 14px;
          border-bottom: 1px solid #00ff88;
        }

        #hydration-dev-log {
          overflow-y: auto;
          height: 80vh;
          margin-top: 10px;
        }

        #hydration-dev-log div {
          margin-bottom: 4px;
        }
      </style>
      <h3>Hydration Debugger</h3>
      <div>Queue: <span id="hydration-queue-count">0</span></div>
      <div>Active Workers: <span id="hydration-worker-count">0</span></div>
      <div id="hydration-dev-log"></div>
    `;
    document.body.appendChild(this.panel);
    const toggle = document.createElement("div");
    toggle.id = "hydration-dev-toggle";
    toggle.textContent = "Hydration \u{1F527}";
    toggle.onclick = () => this.toggle();
    document.body.appendChild(toggle);
    this.logList = this.panel.querySelector("#hydration-dev-log");
  }
  static toggle() {
    if (!this.panel) return;
    this.visible = !this.visible;
    this.panel.classList.toggle("open", this.visible);
  }
  static updateQueueCount(count) {
    const el = document.getElementById("hydration-queue-count");
    if (el) el.textContent = String(count);
  }
  static updateWorkerCount(count) {
    const el = document.getElementById("hydration-worker-count");
    if (el) el.textContent = String(count);
  }
  static log(message) {
    if (!this.logList) return;
    const entry = document.createElement("div");
    entry.textContent = `[${(/* @__PURE__ */ new Date()).toISOString().split("T")[1].slice(0, 8)}] ${message}`;
    this.logList.prepend(entry);
  }
};

export {
  HydrationDevOverlay
};
//# sourceMappingURL=chunk-SMK2HJJW.mjs.map