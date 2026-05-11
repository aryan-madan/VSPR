const { ipcRenderer } = require("electron");

const screens = {
  pick:     document.getElementById("screen-pick"),
  progress: document.getElementById("screen-progress"),
  done:     document.getElementById("screen-done"),
};

function show(name) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

let model = "base.en";

document.querySelectorAll(".model-row").forEach(row => {
  row.addEventListener("click", () => {
    document.querySelectorAll(".model-row").forEach(r => r.classList.remove("selected"));
    row.classList.add("selected");
    model = row.dataset.model;
  });
});

document.getElementById("btn-download").addEventListener("click", () => {
  show("progress");
  ipcRenderer.send("setup-start", model);
});

const els = {
  fillBinary: document.getElementById("fill-binary"),
  pctBinary:  document.getElementById("pct-binary"),
  msgBinary:  document.getElementById("msg-binary"),
  fillModel:  document.getElementById("fill-model"),
  pctModel:   document.getElementById("pct-model"),
  msgModel:   document.getElementById("msg-model"),
  err:        document.getElementById("err"),
};

ipcRenderer.on("progress", (_, p) => {
  if (p.step === "binary") {
    els.fillBinary.style.width = p.pct + "%";
    els.pctBinary.textContent  = p.pct + "%";
    els.msgBinary.textContent  = p.message;
  }
  if (p.step === "model") {
    els.fillModel.style.width = p.pct + "%";
    els.pctModel.textContent  = p.pct + "%";
    els.msgModel.textContent  = p.message;
  }
});

ipcRenderer.on("setup-done",  ()        => show("done"));
ipcRenderer.on("setup-error", (_, msg)  => {
  els.err.textContent = msg;
  els.err.classList.remove("hidden");
});

document.getElementById("btn-start").addEventListener("click", () => {
  ipcRenderer.send("setup-complete");
});