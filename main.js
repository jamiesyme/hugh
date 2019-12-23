const Electron = require('electron');

const WebServer = require('./web-server');

const webServer = new WebServer();
webServer.listen();

/*
let win;

function createWindow () {
	win = new Electron.BrowserWindow({
		width: 800,
		height: 600,
		frame: false,
		backgroundColor: '#2c3e50',
		webPreferences: {
			nodeIntegration: true,
		},
	});

	win.loadFile('index.html');

	win.on('closed', () => {
		app.quit();
	});
}

Electron.app.on('ready', createWindow);
*/
