import { exec } from "child_process";
import { clipboard, app } from "electron";

export function paste(text: string) {
    clipboard.writeText(text);

    if (process.platform === "darwin") {
        app.hide();
        setTimeout(() => {
            exec(`osascript -e 'tell application "System Events" to keystroke "v" using command down'`);
        }, 150);
    } else {
        setTimeout(() => {
            exec(`powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('^v')"`);
        }, 300);
    }
}