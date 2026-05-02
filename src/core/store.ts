import Store from "electron-store";
import fs from "fs";
import os from "os";
import path from "path";

interface Schema {
    model: string;
    hotkey: string;
    history: { text: string; ts: number }[];
}

const store = new Store<Schema>({
    defaults: {
        model: "base.en",
        hotkey: "Alt+Space",
        history: [],
    },
});

export function getModel(): string { return store.get("model"); }
export function setModel(m: string) { store.set("model", m); }

export function getHotkey(): string { return store.get("hotkey"); }
export function setHotkey(h: string) { store.set("hotkey", h); }

export function getHistory(): { text: string; ts: number }[] { return store.get("history"); }

export function addHistory(text: string) {
    const prev = store.get("history").slice(0, 49);
    store.set("history", [{ text, ts: Date.now() }, ...prev]);
}

export function clearHistory() { store.set("history", []); }

const ROOT = path.join(__dirname, "../../vendor/whisper");

export function binPath(): string {
    return os.platform() === "win32"
        ? path.join(ROOT, "whisper-cli.exe")
        : path.join(ROOT, "build", "bin", "whisper-cli");
}

export function modelPath(model?: string): string {
    return path.join(ROOT, "models", `ggml-${model ?? getModel()}.bin`);
}

export function isReady(): boolean {
    return fs.existsSync(binPath()) && fs.existsSync(modelPath());
}