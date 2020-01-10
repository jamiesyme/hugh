const Electron = require('electron');

const ComponentStore = require('./component-store');
const RenderServer = require('./render-server');
const WebServer = require('./web-server');

Electron.app.disableHardwareAcceleration();
Electron.app.on('will-quit', (ev) => {
	ev.preventDefault();
});

const compStore = new ComponentStore();
const webServer = new WebServer(compStore);
webServer.listen();
const renderServer = new RenderServer(compStore);
