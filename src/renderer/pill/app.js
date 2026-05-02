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
let actx = null;
let proc = null;

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

function encodeWav(chunks, sampleRate) {
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const samples = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) { samples.set(chunk, offset); offset += chunk.length; }

    const buf = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buf);

    function writeStr(o, s) { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); }

    writeStr(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, samples.length * 2, true);

    let off = 44;
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        off += 2;
    }

    return buf;
}

ipcRenderer.on("state", (_, s) => {
    lbl.textContent = msgs[s] ?? s;
    if (s !== "recording") stopAnim();
});

ipcRenderer.on("cmd", async (_, cmd) => {
    if (cmd === "start") {
        chunks = [];
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        actx = new AudioContext({ sampleRate: 16000 });
        const src = actx.createMediaStreamSource(stream);

        analyser = actx.createAnalyser();
        analyser.fftSize = 64;
        src.connect(analyser);

        proc = actx.createScriptProcessor(4096, 1, 1);
        src.connect(proc);
        proc.connect(actx.destination);
        proc.onaudioprocess = (e) => {
            chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
        };

        startAnim();

    } else if (cmd === "stop") {
        if (!proc) return;

        proc.disconnect();
        analyser.disconnect();
        await actx.close();
        stream.getTracks().forEach(t => t.stop());

        const wavBuf = encodeWav(chunks, 16000);
        fs.writeFileSync(wav, Buffer.from(wavBuf));

        chunks = []; media = null; stream = null;
        analyser = null; actx = null; proc = null;

        ipcRenderer.send("recorded");
    }
});

stop.addEventListener("click", () => ipcRenderer.send("stop"));