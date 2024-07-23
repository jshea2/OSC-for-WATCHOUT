import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import log from 'electron-log';
import fs from 'fs';
import { Server } from 'node-osc';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import WatchoutSocket from './WatchoutSocket';

let mainWindow: BrowserWindow | null = null;

// Utility function to log messages to the Browser Console
function logEverywhere(message) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`console.log(\`${message}\`)`);
  }
}

const windowWidth = 160;
const windowHeight = 387;

const createWindow = async () => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: windowWidth,
    height: windowHeight,
    autoHideMenuBar: true,
    backgroundColor: '#081421', // background color
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // WatchoutSocket instance
  let watchoutSocket;
  let oscIpIn;
  let oscPortIn;
  let watchoutIpOut;
  let watchoutPortOut;

  // Path to data
  const dataPath =
    process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../../data')
      : path.join(process.resourcesPath, 'data');

  // Read data from config.JSON file and handle data to renderer
  const getConfig = () => {
    const path1 = path.join(dataPath, 'config.json');
    fs.readFile(path1, null, (_, data) => {
      const jsonData = JSON.parse(data);
      oscIpIn = jsonData.iposc;
      oscPortIn = jsonData.portosc;
      watchoutIpOut = jsonData.ipwatchout;
      watchoutPortOut = jsonData.portwatchout;
      watchoutSocket = new WatchoutSocket(watchoutIpOut, watchoutPortOut);
      console.log(`I got the config file:`);
      console.log(jsonData);
      ipcMain.handle('configDefaults', async (_, message) => {
        return jsonData;
      });
    });
  };
  getConfig();

  // Write data to config.JSON file
  const saveData = (config) => {
    const finished = (error) => {
      if (error) {
        console.log(error);
      }
    };
    const jsonData = JSON.stringify(config, null, 2);
    fs.writeFile(path.join(dataPath, 'config.json'), jsonData, finished);
    console.log('saved file');
  };

  // Submit and Config Handle
  ipcMain.handle('config', async (_, message) => {
    console.log(message);
    saveData(message);
    oscIpIn = message.iposc;
    oscPortIn = message.portosc;
    watchoutIpOut = message.ipwatchout;
    watchoutPortOut = message.portwatchout;
    mainWindow.setSize(windowWidth * 2 + 100, windowHeight);
    mainWindow.webContents.openDevTools();

    watchoutSocket = new WatchoutSocket(watchoutIpOut, watchoutPortOut);

    watchoutSocket.conditional('[WATCHOUT] Initial PING', 'ping', '');

    const oscServer = new Server(oscPortIn, oscIpIn, () => {
      console.log('OSC Server is listening');
      console.log(`OSC IP: ${oscIpIn}\n OSC Port: ${oscPortIn}`);
    });

    oscServer.on('bundle', function (bundle) {
      bundle.elements.forEach((element, i) => {
        console.log(`Timestamp: ${bundle.timetag[i]}`);
        console.log(`Message: ${element}`);
      });
    });

    oscServer.on('message', function (msg) {
      console.log(`Message: ${msg}`);
      const msgArray = msg[0].split('/');
      console.log(msgArray);
      if (msgArray[1] == 'watchout') {
        let cueNumber;
        if (msgArray[3]) {
          if (msgArray[3].includes('_')) {
            cueNumber = msgArray[3].split('_').join(' ').toString();
          } else {
            cueNumber = msgArray[3];
          }
        }
        let cueNumber2;
        if (msgArray[4]) {
          if (msgArray[4].includes('_')) {
            cueNumber2 = msgArray[4].split('_').join(' ').toString();
          } else {
            cueNumber2 = msgArray[4];
          }
        }
        console.log(`Cue Number = ${cueNumber}`);
        const command = msgArray[2];
        console.log(`${watchoutIpOut} | ${watchoutPortOut}`);

        switch (command) {
          case 'go':
            watchoutSocket.gotoControlCue(cueNumber);
            break;
          case 'goAux':
            watchoutSocket.auxGotoControlCue(cueNumber2, cueNumber);
            break;
          case 'runAux':
            watchoutSocket.runAux(cueNumber);
            break;
          case 'run':
            watchoutSocket.run();
            break;
          case 'goto':
            watchoutSocket.gotoControlCue(cueNumber);
            break;
          case 'gotoAux':
            watchoutSocket.auxGotoControlCue(cueNumber2, cueNumber);
            break;
          case 'haltAux':
            watchoutSocket.haltAux(cueNumber);
            break;
          case 'halt':
            watchoutSocket.halt();
            break;
          case 'online':
            watchoutSocket.online();
            break;
          case 'offline':
            watchoutSocket.offline();
            break;
          case 'reset':
            watchoutSocket.reset();
            break;
          case 'killAux':
            watchoutSocket.killAux(cueNumber);
            break;
          case 'standBy':
            watchoutSocket.standBy();
            break;
          case 'load':
            watchoutSocket.load(msg[1].split('_').join(' '));
            break;
          case 'gotoTime':
            watchoutSocket.gotoTime(msg[1].toString());
            break;
          case 'ping':
            watchoutSocket.ping();
            break;
        }
      } else if (msg[0].includes('/eos/out/event/')) {
        logEverywhere(`[OSC IN] ${msg[0]}`);
      } else if (msg[0].includes('/eos/out/')) {
      } else {
        logEverywhere(`[OSC IN] ${msg[0]}`);
      }
    });
  });

  ipcMain.handle('consoleWindow', async (_, message) => {
    if (message === false) {
      mainWindow.webContents.openDevTools();
      mainWindow.setSize(windowWidth * 2 + 100, windowHeight);
    } else if (message === true) {
      mainWindow.webContents.closeDevTools();
      mainWindow.setSize(windowWidth, windowHeight);
    }
    return 'Hi there';
  });

  ipcMain.handle('sendWatchoutCommand', async (_, command, cue) => {
    switch (command) {
      case 'run':
        watchoutSocket.run();
        break;
      case 'halt':
        watchoutSocket.halt();
        break;
      case 'gotoControlCue':
        watchoutSocket.gotoControlCue(cue);
        break;
      case 'auxGotoControlCue':
        watchoutSocket.auxGotoControlCue(cue, 'auxTimeline');
        break;
      default:
        console.log(`Unknown command: ${command}`);
    }
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
