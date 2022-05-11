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
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
const fs = require('fs')
const { Client, Server } = require('node-osc');
const net = require('net')
const socket = new net.Socket()



// export default class AppUpdater {
//   constructor() {
//     log.transports.file.level = 'info';
//     autoUpdater.logger = log;
//     autoUpdater.checkForUpdatesAndNotify();
//   }
// }

let mainWindow: BrowserWindow | null = null;

// ipcMain.on('ipc-example', async (event, arg) => {
//   const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
//   console.log(msgTemplate(arg));
//   event.reply('ipc-example', msgTemplate('pong'));
// });

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

// const isDevelopment =
//   process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

// if (isDevelopment) {
//   require('electron-debug')();
// }

// const installExtensions = async () => {
//   const installer = require('electron-devtools-installer');
//   const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
//   const extensions = ['REACT_DEVELOPER_TOOLS'];

//   return installer
//     .default(
//       extensions.map((name) => installer[name]),
//       forceDownload
//     )
//     .catch(console.log);
// };

const windowWidth = 160;
const windowHeight = 387;

const createWindow = async () => {
  // if (isDevelopment) {
  //   await installExtensions();
  // }

  // ipcMain.on('ping', (event, arg) => {
  //   console.log(arg)
  //   mainWindow.webContents.send('test', "HIIIIIII")
  // })

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
      preload: path.join(__dirname, 'preload.js')
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
 // new AppUpdater();

  let oscIpIn
  let oscPortIn
  let watchoutIpOut
  let watchoutPortOut


  // Log to Browser Console
  function logEverywhere(message) {
    if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`console.log(\`${message}\`)`);
    }
    }

// Path To Data
  const dataPath =
  process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../../data')
    : path.join(process.resourcesPath, 'data');

  //Read data from config.JSON file and handle data to renderer
  const getConfig = () => {
    const path1 = path.join(dataPath, 'config.json')
    fs.readFile(path1, null, (_, data) => {
      const jsonData = JSON.parse(data)
      oscIpIn = jsonData.iposc
      oscPortIn = jsonData.portosc
      watchoutIpOut = jsonData.ipwatchout
      watchoutPortOut = jsonData.portwatchout
      console.log(`i got the config file:`)
      console.log(jsonData)
      ipcMain.handle('configDefaults', async (_,message) => {
        return jsonData
      })
    })
  }
  getConfig()

// Write data to config.JSON file
  const saveData = (config) => {
    const finished = (error) => {
      if(error){
        console.log(error);
        return;
      }
    }
    const jsonData = JSON.stringify(config, null, 2)
    fs.writeFile(path.join(dataPath, 'config.json'), jsonData, finished);
    console.log("saved file")
  }

  //Submit and Config Handle
  ipcMain.handle('config', async (_, message) => {
    console.log(message)
    saveData(message)
    oscIpIn = message.iposc
    oscPortIn = message.portosc
    watchoutIpOut = message.ipwatchout
    watchoutPortOut = message.portwatchout
    mainWindow.setSize((windowWidth*2+100),windowHeight)
    mainWindow.webContents.openDevTools();
    //logEverywhere("")

    socket.connect({
      host: watchoutIpOut,
      port: watchoutPortOut,
      readable: true,
      writeable: true,
    }, ()=>{
      console.log("HELOOOOO")
      logEverywhere(`[WATCHOUT] PING`)
        socket.write(`ping\n`)
        console.log(``)
        setTimeout(() => {
          socket.destroy()
        }, 100);
      }
    )

    socket.on('data', (data) => {
      console.log(data)
      console.log(data)
      let b = Buffer.from(data, 'utf8')
      console.log(JSON.stringify(b))
      let isReady = b.toString('utf8')
      if (isReady.includes("Ready")){
        let arr = isReady.split(' ')
        console.log(arr)
        logEverywhere(`[PING] [WATCHOUT IS CONNECTED!]`)
        logEverywhere(`[Version: ${arr[1]}]`)
        mainWindow.webContents.send("woconnected", true)
      }
      if (isReady.includes("true")){
        logEverywhere("[License is Active]")
      } else if (isReady.includes("false")){
        logEverywhere("[No License Found - DEMO Mode]")
      }
      //logEverywhere(isReady)
    })

    socket.on('error', (data) => {
      console.log(data);
      mainWindow.webContents.send("woconnected", false)
      logEverywhere(`[WATCHOUT IS DISCONNECTED]`)
    })

    //Connect OSC
    var oscServer = new Server(oscPortIn, oscIpIn, () => {
      console.log('OSC Server is listening');
      console.log(`OSC IP: ${oscIpIn}\n OSC Port: ${oscPortIn}`)


    });

    oscServer.on('bundle', function (bundle) {
      bundle.elements.forEach((element, i) => {
        console.log(`Timestamp: ${bundle.timetag[i]}`);
        console.log(`Message: ${element}`);
      });
      //oscServer.close();
    });

    oscServer.on('message', function (msg) {




        console.log(`Message: ${msg}`);
        let msgArray = msg[0].split("/")
        console.log(msgArray)
        if(msgArray[1] == "watchout"){
          let cueNumber
          if (msgArray[3]){
          if (msgArray[3].includes('_')) {
            cueNumber = msgArray[3].split("_").join(" ").toString()
          } else {
            cueNumber = msgArray[3]
          }
        }
        let cueNumber2
          if (msgArray[4]){
          if (msgArray[4].includes('_')) {
            cueNumber2 = msgArray[4].split("_").join(" ").toString()
          } else {
            cueNumber2 = msgArray[4]
          }
        }
          console.log(`Cue Number = ${cueNumber}`)
          let command = msgArray[2]
          console.log(`${watchoutIpOut} | ${watchoutPortOut}`)
          socket.setTimeout(1000)
          socket.on('connect', () => {
            console.log('connect')
          })
          socket.on('data', (data) => {
            console.log(data)
            console.log(data)
            let b = Buffer.from(data, 'utf8')
            console.log(JSON.stringify(b))
            let isReady = b.toString('utf8')
            if (isReady.includes("Ready")){
              logEverywhere("[PING] [WATCHOUT IS CONNECTED!]")
              mainWindow.webContents.send("woconnected", true)
            }
            logEverywhere(isReady)
          })
          socket.on('close', ()=>{
            console.log('closed')
          })
          socket.on('error', (err)=>{
            console.log(err)
            logEverywhere(err)
          })

          switch (command) {
            case "go": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                console.log("HELOOOOO")
                logEverywhere(`[OSC IN] ${msg[0]}`)
                logEverywhere(`[WATCHOUT] GO TO CUE ${cueNumber} AND RUN`)
                  socket.write(`gotoControlCue "${cueNumber}"\nrun\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "goAux": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                console.log("HELOOOOO")
                logEverywhere(`[OSC IN] ${msg[0]}`)
                logEverywhere(`[WATCHOUT] GO TO CUE "${cueNumber}" in Aux Timeline "${cueNumber}" AND RUN`)
                  socket.write(`gotoControlCue "${cueNumber2}" false "${cueNumber}"\nrun "${cueNumber}"\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "runAux": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                console.log("HELOOOOO")
                logEverywhere(`[OSC IN] ${msg[0]}`)
                logEverywhere(`[WATCHOUT] RUN Aux Timeline "${cueNumber}"`)
                  socket.write(`run "${cueNumber}"\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "run": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                console.log("HELOOOOO")
                logEverywhere(`[OSC IN] ${msg[0]}`)
                logEverywhere(`[WATCHOUT] RUN`)
                  socket.write(`run\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "goto": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                console.log("HELOOOOO")
                logEverywhere(`[OSC IN] ${msg[0]}`)
                logEverywhere(`[WATCHOUT] GO TO CUE ${cueNumber} AND HALT`)
                  socket.write(`gotoControlCue ${cueNumber}\nhalt\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "gotoAux": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                console.log("HELOOOOO")
                logEverywhere(`[OSC IN] ${msg[0]}`)
                logEverywhere(`[WATCHOUT] GO TO CUE ${cueNumber} in Aux Timeline "${cueNumber}"AND HALT`)
                  socket.write(`gotoControlCue "${cueNumber2}" false "${cueNumber}"\nhalt "${cueNumber}"\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "haltAux": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                logEverywhere(`[OSC IN] ${msg[0]}`)
                console.log("HELOOOOO")
                logEverywhere(`[WATCHOUT] HALT Aux Timeline "${cueNumber}"`)
                  socket.write(`halt "${cueNumber}"\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "halt": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                logEverywhere(`[OSC IN] ${msg[0]}`)
                console.log("HELOOOOO")
                logEverywhere(`[WATCHOUT] HALT`)
                  socket.write(`halt\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "online": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                logEverywhere(`[OSC IN] ${msg[0]}`)
                console.log("HELOOOOO")
                logEverywhere(`[WATCHOUT] ONLINE`)
                  socket.write(`online true\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "offline": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                logEverywhere(`[OSC IN] ${msg[0]}`)
                console.log("HELOOOOO")
                logEverywhere(`[WATCHOUT] OFFLINE`)
                  socket.write(`online false\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "reset": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                logEverywhere(`[OSC IN] ${msg[0]}`)
                console.log("HELOOOOO")
                logEverywhere(`[WATCHOUT] RESET`)
                  socket.write(`reset\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "killAux": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                logEverywhere(`[OSC IN] ${msg[0]}`)
                console.log("HELOOOOO")
                logEverywhere(`[WATCHOUT] KILL`)
                  socket.write(`kill "${cueNumber}"}\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "standBy": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                logEverywhere(`[OSC IN] ${msg[0]}`)
                console.log("HELOOOOO")
                logEverywhere(`[WATCHOUT] STANDBY`)
                  socket.write(`standBy true\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "load": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                logEverywhere(`[OSC IN] ${msg[0]}`)
                console.log("HELOOOOO")
                logEverywhere(`[WATCHOUT] LOAD`)
                  socket.write(`load "${msg[1].split("_").join(" ")}"\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "gotoTime": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                logEverywhere(`[OSC IN] ${msg[0]}`)
                console.log("HELOOOOO")
                logEverywhere(`[WATCHOUT] Go To Time`)
                  socket.write(`gotoTime ${msg[1].toString()})\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 1);
                }
              )
            }
            break
            case "ping": {
              socket.connect({
                host: watchoutIpOut,
                port: watchoutPortOut,
                readable: true,
                writeable: true,
              }, ()=>{
                logEverywhere(`[OSC IN] ${msg[0]}`)
                console.log("HELOOOOO")
                logEverywhere(`[WATCHOUT] PING`)
                  socket.write(`ping\n`)
                  console.log(``)
                  setTimeout(() => {
                    socket.destroy()
                  }, 100);
                }
              )
            }

          }
        } else if (msg[0].includes("/eos/out/event/")) {
          logEverywhere(`[OSC IN] ${msg[0]}`)
          //logEverywhere(`Invalid OSC Command... Try the following commands "/watchout/go/1", "/run", "/halt, "watchout/goto/2"`)
        } else if (msg[0].includes("/eos/out/")){
          return
        } else {
          logEverywhere(`[OSC IN] ${msg[0]}`)
        }
      })
    //

    return
  })

  ipcMain.handle('consoleWindow', async (_, message) => {
    console.log("I GOT THE ARROW THING")
    console.log(message)
    if (message == false){
      mainWindow.webContents.openDevTools()
      mainWindow.setSize(windowWidth*2+100,windowHeight)
    } else if (message == true){
      mainWindow.webContents.closeDevTools()
      mainWindow.setSize(windowWidth,windowHeight)
    }
    return "Hi there"
  })

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
