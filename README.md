# Hugh

Hugh is an HTML renderer. More specifically, it watches [Svelte](https://svelte.dev) components within a directory and renders them to images, re-rendering whenever the file changes.

This is just a prototype that I started because I wanted to use HTML overlays in a [video editor](https://jliljebl.github.io/flowblade) that doesn't have them built-in (which, to be fair, is a pretty big ask). I figured I'd just convert the HTML to images and import those instead.

## Usage

Run `npm run start`.

Add a component, such as `hello.svelte`, to the root of this project:

```svelte
<h1>Hello, world!</h1>
```

The corresponding `hello.png` will be generated in the same directory.

You can also go to `localhost:3000` for viewing the components.
