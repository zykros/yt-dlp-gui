/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import ytdlp from './ytdlp';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC tests: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate(arg));
});

ipcMain.on('browse-directory', async (event, arg) => {
  dialog
    .showOpenDialog({
      properties: ['openFile', 'openDirectory'],
    })
    .then((result) => {
      event.reply('browse-directory', result);
      console.log(result);
    })
    .catch((err) => {
      console.log(err);
    });
});

ipcMain.on('getDownloadPath', (event) => {
  const downloadPath = app.getPath('downloads');

  event.reply('getDownloadPath', downloadPath);
});

ipcMain.on('ytdlp-probe', async (event, url) => {
  interface returnObj {
    [key: string]: any;
  }
  let returnObj: returnObj = {};
  try {
    let metadata = await ytdlp.getVideoInfo(url);
    event.reply('ytdlp-probe', metadata);
  } catch {
    console.log('FAILED!!!!');
    event.reply('ytdlp-probe', 'failed');
  }

  //console.log(app.getPath('downloads'));

  //console.log(metadata);
});

ipcMain.on('ytdlp-download', async (event, ytId, command) => {
  interface returnObj {
    [key: string]: any;
  }
  let returnObj: returnObj = {
    id: ytId,
    status: 'Queued',
    progress: {},
    isPresent: false,
    eventType: '',
    pid: '',
  };
  let ytDlpEvent = ytdlp
    .exec(command)
    .on('progress', (progress) => {
      // let tmpObj = {
      //   id: ytId,
      //   progress,
      // };
      returnObj['status'] = 'Downloading';
      returnObj['progress'] = progress;
      //console.log(returnObj);

      event.reply('ytdlp-download', returnObj);
    })
    .on('ytDlpEvent', (eventType, eventData) => {
      //console.log(eventType, eventData);
      returnObj['eventType'] = eventType;
      let downloadedRegex = /has already been downloaded/g;
      if (downloadedRegex.test(eventData)) {
        returnObj['isPresent'] = true;
      }

      if (eventType === 'Merger') {
        returnObj['status'] = 'Merging';
      }

      if (eventType === 'ExtractAudio') {
        returnObj['status'] = 'Extract Audio';
      }

      //console.log(returnObj);
      event.reply('ytdlp-download', returnObj);
      //console.log(eventType);
    })
    .on('error', (error) => console.error(error))
    .on('close', () => {
      returnObj['status'] = 'Complete';
      event.reply('ytdlp-download', returnObj);
    });
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1300,
    height: 900,
    icon: getAssetPath('icon.png'),
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
