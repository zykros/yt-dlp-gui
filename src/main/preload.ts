import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    myPing(message: string) {
      ipcRenderer.send('ipc-example', message);
    },
    async myCli(command: string, webId: unknown) {
      ipcRenderer.send('cli', command, webId);
    },
    async ytdlpProbe(url: string) {
      ipcRenderer.send('ytdlp-probe', url);
    },
    async ytdlpDownload(ytId: string, command: any[]) {
      ipcRenderer.send('ytdlp-download', ytId, command);
    },
    getDownloadPath() {
      ipcRenderer.send('getDownloadPath');
    },
    browseDir() {
      ipcRenderer.send('browse-directory');
    },
    on(channel: string, func: (...args: unknown[]) => void) {
      // const validChannels = ['ipc-example'];
      if (channel) {
        const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
          func(...args);
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
      }
      return undefined;
    },
    once(channel: string, func: (...args: unknown[]) => void) {
      // const validChannels = ['ipc-example'];
      if (channel) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (_event, ...args) => func(...args));
      }
    },
  },
});

// contextBridge.exposeInMainWorld('electron', {
//   commandAPI: {
//     sendCommand(command) {
//       ipcRenderer.send('cli', command);
//     },
//   },
// });
