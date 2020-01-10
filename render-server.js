const Electron = require('electron');
const Fs = require('fs').promises;
const Path = require('path');

const ComponentRenderer = require('./component-renderer');

class RenderServer {
	constructor (compStore) {
		this.compStore = compStore;
		this.compImgPaths = {};

		this.waitForElectron = new Promise(resolve => {
			Electron.app.on('ready', resolve);
		});

		this.compStore.on('add', (compName) => {
			this.updateRender(compName);
		});
		this.compStore.on('change', (compName) => {
			this.updateRender(compName);
		});
		this.compStore.on('remove', (compName) => {
			this.removeRender(compName);
		});
	}

	async updateRender (compName) {
		const path = this.compStore.getComponentPath(compName);
		await this.waitForElectron;

		const win = new Electron.BrowserWindow({
			width: 1920,
			height: 1080,
			show: false,
			webPreferences: {
				offscreen: true,
			},
		});
		win.loadURL(`http://localhost:3000/components/${compName}`);
		await new Promise(r => win.on('ready-to-show', r));

		const img = await win.capturePage();
		const imgBuffer = img.toPNG();
		const imgPathObj = Path.parse(path);
		delete imgPathObj.base;
		imgPathObj.ext = '.png';
		const imgPath = Path.format(imgPathObj);
		this.compImgPaths[compName] = imgPath;

		await Fs.writeFile(imgPath, imgBuffer);
		win.close();
	}

	async removeRender (compName) {
		const imgPath = this.compImgPaths[compName];
		if (!imgPath) {
			return;
		}
		await Fs.unlink(imgPath);
	}
}

module.exports = RenderServer;
