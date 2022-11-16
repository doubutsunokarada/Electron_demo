import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("preload", {
  createArchive: (states: Object) =>
    ipcRenderer.invoke("create-archive", states),
  toZip: (dirName: string) => ipcRenderer.invoke("to-zip", dirName),
});
