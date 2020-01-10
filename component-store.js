const Chokidar = require('chokidar');
const EventEmitter = require('events');

class ComponentStore extends EventEmitter {
	constructor (dir = '.') {
		super();

		this.dir = dir;
		this.components = [];

		function getNameFromPath (path) {
			const regex = /^(.*)\.svelte$/;
			return regex.exec(path)[1];
		}

		this.watcher = Chokidar.watch('*.svelte', {
			cwd: dir,
			ignored: /(^|[\/\\])\../, // Ignore dotfiles
			persistent: true,
		});
		this.watcher.on('add', (path) => {
			const name = getNameFromPath(path);
			this.components.push({ name, path });
			this.emit('add', name);
		});
		this.watcher.on('change', (path) => {
			const comp = this.components.find(c => c.path === path);
			this.emit('change', comp.name);
		});
		this.watcher.on('unlink', (path) => {
			const comp = this.components.find(c => c.path === path);
			this.components = this.components.filter(c => c.path !== path);
			this.emit('remove', comp.name);
		});
	}

	listComponents () {
		return this.components.map(c => c.name);
	}

	hasComponent (name) {
		return !!this.components.find(c => c.name === name);
	}

	getComponentPath (name) {
		const comp = this.components.find(c => c.name === name);
		return comp.path.slice();
	}
}

module.exports = ComponentStore;
