const { ipcRenderer } = require('electron');

const dot = document.getElementById("dot");
const label = docuemnt.getElementById("label");
const quit = document.getElementById("quit");

const msgs: Record<string, string> = {
    idle: "Hold ⌥ Space to speak",
    recording: "Listening...",
    transcribing: "Transcribing...",
    cleaning: "Cleaning up...",
    done: "Pasted.",
};

ipcRenderer.on("state", (_: unknown, s: string) => {
        label.textContent = msgs[s] ?? s;
        dot.classList.toggle("on", s === "recording");
});