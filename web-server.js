const Koa = require('koa');
const Fs = require('fs').promises;

const ComponentRenderer = require('./component-renderer');

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

class WebServer {
	constructor (compStore) {
		this.app = new Koa();
		this.compStore = compStore;
		this.compEtags = {};

		this.compStore.on('add', (compName) => {
			this.compEtags[compName] = (new Date).getTime().toString();
		});
		this.compStore.on('change', (compName) => {
			this.compEtags[compName] = (new Date).getTime().toString();
		});
		this.compStore.on('remove', (compName) => {
			delete this.compEtags[compName];
		});

		this.app.use(async ctx => {
			const compRegex = /\/components\/([^\/]+)/;

			const route_getWebClient = async () => {
				ctx.body = await Fs.readFile('./web-client.html');
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

				const compEtag = this.compEtags[compName];
				ctx.set('ETag', compEtag);

				if (ctx.method === 'HEAD') {
					ctx.status = 204;
					return;
				}

				const compPath = this.compStore.getComponentPath(compName);
				const compMjs = await ComponentRenderer.render(compPath);

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
