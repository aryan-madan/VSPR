const { ipcRenderer } = require("electron");
document.getElementById("quit").addEventListener("click", () => ipcRenderer.send("quit"));