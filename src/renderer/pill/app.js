const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

const bars = document.querySelectorAll(".bar");
const lbl = document.getElementById("lbl");
const stop = document.getElementById("stop");
const wav = path.join(os.tmpdir(), "vspr.wav");

const msgs = {
    recording: "Listening...",
    transcribing: "Transcribing...",
    idle: "Done ✓",
};

let animId = 0;
let chunks = [];
let media = null;
let stream = null;
let analyser = null;

function startAnim() {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const step = Math.floor(data.length / bars.length);
    function frame() {
        analyser.getByteFrequencyData(data);
        bars.forEach((b, i) => {
            const val = data[i * step] / 255;
            b.style.height = (4 + val * 22) + "px";
        });
        animId = requestAnimationFrame(frame);
    }
    frame();
}

function stopAnim() {
    cancelAnimationFrame(animId);
    bars.forEach(b => b.style.height = "4px");
}

ipcRenderer.on("state", (_, s) => {
    lbl.textContent = msgs[s] ?? s;
    if (s !== "recording") stopAnim();
});

ipcRenderer.on("cmd", async (_, cmd) => {
    if (cmd === "start") {
        chunks = [];
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        src.connect(analyser);

        media = new MediaRecorder(stream);
        media.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        media.start(100);
        startAnim();

    } else if (cmd === "stop") {
        if (!media) return;
        media.onstop = async () => {
            const blob = new Blob(chunks);
            const arr = await blob.arrayBuffer();
            fs.writeFileSync(wav, Buffer.from(arr));
            stream.getTracks().forEach(t => t.stop());
            ipcRenderer.send("recorded");
        };
        media.stop();
    }
});

stop.addEventListener("click", () => ipcRenderer.send("stop"));