const { ipcRenderer } = require("electron");

const list = document.getElementById("history-list");
const empty = document.getElementById("history-empty");
const footer = document.getElementById("history-footer");
const content = document.getElementById("content");

const tabs = {
    history: document.getElementById("tab-history"),
    settings: document.getElementById("tab-settings"),
};

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        Object.values(tabs).forEach(t => t.classList.add("hidden"));
        tabs[btn.dataset.tab].classList.remove("hidden");
        fixListHeight();
    });
});

document.getElementById("btn-close").addEventListener("click", () => ipcRenderer.send("quit"));

function fixListHeight() {
    list.style.height = (content.clientHeight - footer.clientHeight) + "px";
}

window.addEventListener("resize", fixListHeight);

function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

function renderHistory(items) {
    if (!items || !items.length) {
        list.classList.add("hidden");
        empty.classList.remove("hidden");
        fixListHeight();
        return;
    }
    empty.classList.add("hidden");
    list.classList.remove("hidden");
    list.innerHTML = items.map((item, i) => `
    <div class="hist-item" data-i="${i}">
      <div class="hist-text">${item.text}</div>
      <div class="hist-time">${timeAgo(item.ts)}</div>
    </div>
  `).join("");

    list.querySelectorAll(".hist-item").forEach(el => {
        el.addEventListener("dblclick", () => {
            ipcRenderer.send("copy", items[el.dataset.i].text);
            el.style.background = "#1f1f1f";
            setTimeout(() => el.style.background = "", 300);
        });
    });

    fixListHeight();
}

document.getElementById("btn-clear").addEventListener("click", () => {
    ipcRenderer.send("clear-history");
    renderHistory([]);
});

ipcRenderer.on("history", (_, items) => renderHistory(items));
ipcRenderer.on("settings", (_, s) => {
    document.getElementById("sel-model").value = s.model;
    document.getElementById("inp-hotkey").value = s.hotkey;
});

ipcRenderer.send("get-history");
ipcRenderer.send("get-settings");

document.getElementById("sel-model").addEventListener("change", (e) => {
    ipcRenderer.send("set-model", e.target.value);
});

let capturing = false;
const inpHotkey = document.getElementById("inp-hotkey");

inpHotkey.addEventListener("click", () => {
    inpHotkey.value = "Press keys...";
    inpHotkey.style.borderColor = "#fff";
    capturing = true;
});

inpHotkey.addEventListener("blur", () => {
    if (capturing) {
        capturing = false;
        inpHotkey.style.borderColor = "";
        ipcRenderer.send("get-settings");
    }
});

document.addEventListener("keydown", (e) => {
    if (!capturing) return;
    e.preventDefault();

    const mods = [];
    if (e.metaKey) mods.push("Command");
    if (e.altKey) mods.push("Alt");
    if (e.ctrlKey) mods.push("Control");
    if (e.shiftKey) mods.push("Shift");

    if (["Meta", "Alt", "Control", "Shift"].includes(e.key)) return;

    const keyMap = {
        " ": "Space",
        "\u00a0": "Space",
        "ArrowUp": "Up",
        "ArrowDown": "Down",
        "ArrowLeft": "Left",
        "ArrowRight": "Right",
    };

    const key = keyMap[e.key] ?? (e.code === "Space" ? "Space" : e.key.toUpperCase());
    const hotkey = [...mods, key].join("+");

    inpHotkey.value = hotkey;
    inpHotkey.style.borderColor = "";
    capturing = false;
    ipcRenderer.send("set-hotkey", hotkey);
});

fixListHeight();