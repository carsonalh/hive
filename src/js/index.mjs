// ROUTING:

function router() {
	let match = views.find(v => v.path === window.location.pathname);
	if (!match) {
		match = views[0];
	}

	viewTeardown();
	main.replaceChildren(...match.nodes);
	viewTeardown = match.viewFn();
}

function navigate(url) {
	if (url !== window.location.pathname) {
		history.pushState({}, '', url);
		router();
	}
}

const views = [];
const viewFns = {
	'/local': setupLocalGameplay,
};
let viewTeardown = () => {};

const main = document.querySelector('main');

function setupDom() {
	// begin by making a list of all our routes for easy access
	for (const html of document.querySelectorAll('[data-path]')) {
		const path = html.getAttribute('data-path');

		let viewFn = () => () => {};
		if (path in viewFns) {
			viewFn = viewFns[path];
		}

		if (html.matches('template')) {
			views.push({
				path,
				viewFn,
				nodes: Array.from(html.content.cloneNode(true).childNodes),
			});
		} else {
			views.push({
				path,
				viewFn,
				nodes: Array.from(html.childNodes),
			});
		}
	}

	document.body.addEventListener('click', e => {
		if (!e.target.matches('[data-link]')) {
			return;
		}

		e.preventDefault();
		navigate(e.target.href);
	});

	// We dont store any state in the history
	window.addEventListener('popstate', router);

	router();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', setupDom);
} else {
	setupDom();
}

// LOCAL GAMEPLAY:
function setupLocalGameplay() {
	// TODO some kind of loading screen
	const canvas = document.querySelector('canvas');
	const gl = canvas.getContext('webgl2');
	const onResize = () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		canvas.width = width;
		canvas.height = height;
		gl.viewport(0, 0, width, height);
	};
	onResize();
	window.addEventListener('resize', onResize);

	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, `#version 300 es
	in vec2 a_position;

	out vec2 v_position;

	void main()
	{
		v_position = a_position;
		gl_Position = vec4(a_position, 0.0, 1.0);
	}
	`);
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error(`Error compiling vertex shader:\n${gl.getShaderInfoLog(vertexShader)}`);
	}

	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, `#version 300 es
	in highp vec2 v_position;

	out highp vec4 f_color;

	void main()
	{
		f_color = vec4(v_position + .5, 1.0, 1.0);
	}
	`);
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error(`Error compiling fragment shader:\n${gl.getShaderInfoLog(fragmentShader)}`);
	}

	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(`Error linking the program:\n${gl.getProgramInfoLog(program)}`);
	}

	gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);

	const tileBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tileBuffer);
	// just a simple 2d quad for now
	const array = new Float32Array([
		-0.5, 0.5,
		0.5, 0.5,
		-0.5, -0.5,
		0.5, 0.5,
		-0.5, -0.5,
		0.5, -0.5,
	]);
	gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);

	const vao = gl.createVertexArray();
	const positionLocation = gl.getAttribLocation(program, 'a_position');
	gl.bindVertexArray(vao);
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, gl.FALSE, 0, 0);

	let nextFrame;
	let lastFrame;
	const DEFAULT_FRAME_TIME_MS = 1000 / 60;
	function animate(msSinceBegin) {
		let dt = DEFAULT_FRAME_TIME_MS;
		if (lastFrame) {
			dt = msSinceBegin - lastFrame;
		}
		lastFrame = msSinceBegin;

		gl.clearColor(.5 * Math.sin(msSinceBegin / 1000) + .5, 0.5, 0.5, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(program);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		nextFrame = window.requestAnimationFrame(animate);
	}
	nextFrame = window.requestAnimationFrame(animate);

	return () => {
		window.removeEventListener('resize', onResize);
		window.cancelAnimationFrame(nextFrame);
	};
}
