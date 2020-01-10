const Rollup = require('rollup');
const RollupResolve = require('@rollup/plugin-node-resolve');
const RollupSvelte = require('rollup-plugin-svelte');

async function render (path) {
	const bundle = await Rollup.rollup({
		input: path,
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

module.exports = { render };
