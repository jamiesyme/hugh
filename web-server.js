const Chokidar = require('chokidar');
const Koa = require('koa');
const Fs = require('fs');
const Path = require('path');
const Rollup = require('rollup');
const RollupResolve = require('@rollup/plugin-node-resolve');
const RollupSvelte = require('rollup-plugin-svelte');

function hashString (str) {
	let hash = 0, i, chr;
	if (str.length === 0) return hash;
	for (i = 0; i < str.length; i++) {
		chr = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}

async function renderComponent (filename) {
	const bundle = await Rollup.rollup({
		input: filename,
		plugins: [
			RollupSvelte({
				customElement: true,
				tag: 'hugh-element',
			}),
			RollupResolve(),
		],
	});
	const { output } = await bundle.generate({
		format: 'es',
	});
	return output[0].code;
}

class ComponentStore {
	constructor (dir = '.') {
		this.dir = dir;
		this.components = [];
		this.etagByComponent = {};

		const fileToCompRegex = /^(.*)\.svelte$/;
		this.watcher = Chokidar.watch('*.svelte', {
			cwd: dir,
			ignored: /(^|[\/\\])\../, // Ignore dotfiles
			persistent: true,
		});
		this.watcher.on('add', (path, stats) => {
			const comp = fileToCompRegex.exec(path)[1];
			this.components.push(comp);
			this.etagByComponent[comp] = stats.mtime;
		});
		this.watcher.on('change', (path, stats) => {
			const comp = fileToCompRegex.exec(path)[1];
			this.etagByComponent[comp] = stats.mtime;
		});
		this.watcher.on('unlink', (path) => {
			const comp = fileToCompRegex.exec(path)[1];
			this.components = this.components.filter(c => c !== comp);
			delete this.etagByComponent[comp];
		});
	}

	listComponents () {
		return this.components.slice();
	}

	hasComponent (name) {
		return this.components.includes(name);
	}

	getComponentEtag (name) {
		return this.etagByComponent[name];
	}

	getComponentFilename (name) {
		return Path.resolve(this.dir, name + '.svelte');
	}
}

class WebServer {
	constructor () {
		this.app = new Koa();
		this.compStore = new ComponentStore();

		this.app.use(async ctx => {
			const compRegex = /\/components\/([^\/]+)/;

			const route_getWebClient = async () => {
				ctx.body = Fs.readFileSync('./web-client.html');
				ctx.set('Content-Type', 'text/html');
			};

			const route_listComponents = async () => {
				const components = this.compStore.listComponents();
				const componentsJson = JSON.stringify(components);

				const compHash = hashString(componentsJson);
				const compEtag = compHash.toString();
				ctx.set('ETag', compEtag);

				if (ctx.method === 'HEAD') {
					ctx.status = 204;
					return;
				}

				ctx.body = componentsJson;
				ctx.set('Content-Type', 'application/json');
			};

			const route_getComponent = async () => {
				const match = ctx.path.match(compRegex);
				const compName = match[1];

				if (!this.compStore.hasComponent(compName)) {
					ctx.status = 404;
					return;
				}

				const compEtag = this.compStore.getComponentEtag(compName);
				ctx.set('ETag', compEtag);

				if (ctx.method === 'HEAD') {
					ctx.status = 204;
					return;
				}

				const compStore = this.compStore;
				const compFilename = compStore.getComponentFilename(compName);
				const compMjs = await renderComponent(compFilename);

				ctx.body = `
					<style>
						body {
							margin: 0;
							height: 100vh;
						}
					</style>
					<script type="module">
						${compMjs}
					</script>
					<hugh-element />
				`;
				ctx.set('Content-Type', 'text/html');
			};

			if (ctx.path === '/') {
				return await route_getWebClient();
			}

			if (ctx.path === '/components') {
				return await route_listComponents();
			}

			if (compRegex.test(ctx.path)) {
				return await route_getComponent();
			}

			ctx.status = 404;
		});
	}

	listen () {
		this.app.listen(3000);
	}
}

module.exports = WebServer;
