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
	const canvas = document.querySelector('canvas');
	const gl = canvas.getContext('webgl2');
	// TODO some kind of loading screen
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
	in vec3 a_position;
	in vec2 a_texCoord;
	in vec3 a_normal;

	out vec3 v_position;
	out vec2 v_texCoord;
	out vec3 v_normal;

	uniform mat4 u_projection;
	uniform mat4 u_view;
	uniform mat4 u_model;

	void main()
	{
		v_position = a_position;
		v_texCoord = a_texCoord;
		v_normal = a_normal;
		gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
	}
	`);
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error(`Error compiling vertex shader:\n${gl.getShaderInfoLog(vertexShader)}`);
	}

	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, `#version 300 es
	in highp vec3 v_position;
	in highp vec2 v_texCoord;
	in highp vec3 v_normal;

	out highp vec4 f_color;

	void main()
	{
		f_color = vec4(v_normal, 1.0);
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

	const positionLocation = gl.getAttribLocation(program, 'a_position');
	const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
	const normalLocation = gl.getAttribLocation(program, 'a_normal');

	let tileVao = null;
	let tileIndicesLength = -1;
	let tileIndicesType = gl.UNSIGNED_SHORT;
	let tileArrayBuffer = null;
	fetch('/static/res/tile.glb', { responseType: 'arraybuffer' })
		.then(async response => {
			const arrayBuffer = await response.arrayBuffer();
			const view = new DataView(arrayBuffer);
			const magic = view.getUint32(0, true);
			const version = view.getUint32(4, true);
			const length = view.getUint32(8, true);

			console.assert(magic == 0x46546c67, 'not a valid .glb file');
			console.assert(version == 2, 'can only parse glTF version 2');
			console.assert(length == arrayBuffer.byteLength, 'corrupted glTF file; byte length != length of array buffer');

			const chunk0Length = view.getUint32(12, true);
			const chunk0Type = view.getUint32(16, true);
			console.assert(chunk0Type == 0x4E4F534A, chunk0Type, 'expect json chunk to be first');
			console.assert(12 + chunk0Length < arrayBuffer.byteLength);

			const chunk1Length = view.getUint32(12 + 8 + chunk0Length, true);
			const chunk1Type = view.getUint32(12 + 8 + chunk0Length + 4, true);
			console.assert(chunk1Type == 0x004E4942, 'expected to find a binary chunk as the second');
			console.assert(12 + 8 + chunk0Length + 8 + chunk1Length == arrayBuffer.byteLength);

			const decoder = new TextDecoder('utf-8');
			const jsonArray = new Uint8Array(arrayBuffer, 20, chunk0Length);
			const jsonMetadata = decoder.decode(jsonArray);
			const metadata = JSON.parse(jsonMetadata);

			const primitives = metadata.meshes[0].primitives[0];
			const positionBufferView = metadata.bufferViews[primitives.attributes.POSITION];
			const texCoordBufferView = metadata.bufferViews[primitives.attributes.TEXCOORD_0];
			const normalBufferView = metadata.bufferViews[primitives.attributes.NORMAL];
			const indicesBufferView = metadata.bufferViews[primitives.indices];
			console.assert(positionBufferView.buffer == 0);
			console.assert(texCoordBufferView.buffer == 0);
			console.assert(normalBufferView.buffer == 0);
			console.assert(indicesBufferView.buffer == 0);

			const vertexArray = gl.createVertexArray();
			gl.bindVertexArray(vertexArray);

			const positionArray = new Float32Array(arrayBuffer, 12 + 8 + chunk0Length + 8 + positionBufferView.byteOffset, positionBufferView.byteLength / 4);
			const texCoordArray = new Float32Array(arrayBuffer, 12 + 8 + chunk0Length + 8 + texCoordBufferView.byteOffset, texCoordBufferView.byteLength / 4);
			const normalArray = new Float32Array(arrayBuffer, 12 + 8 + chunk0Length + 8 + normalBufferView.byteOffset, normalBufferView.byteLength / 4);
			const indicesArray = new Uint16Array(
				arrayBuffer,
				12 + 8 + chunk0Length + 8 + indicesBufferView.byteOffset,
				indicesBufferView.byteLength / 2);

			tileIndicesLength = indicesArray.length;

			const positionBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
			gl.enableVertexAttribArray(positionLocation);
			gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
			const texCoordBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, texCoordArray, gl.STATIC_DRAW);
			gl.enableVertexAttribArray(texCoordLocation);
			gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
			const normalBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, normalArray, gl.STATIC_DRAW);
			gl.enableVertexAttribArray(normalLocation);
			gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
			const indicesBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesArray, gl.STATIC_DRAW);

			tileVao = vertexArray;
		});

	const projectionLocation = gl.getUniformLocation(program, 'u_projection');
	const viewLocation = gl.getUniformLocation(program, 'u_view');
	const modelLocation = gl.getUniformLocation(program, 'u_model');

	gl.enable(gl.DEPTH_TEST);

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
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.useProgram(program);

		const theta = msSinceBegin / 1000;
		gl.uniformMatrix4fv(modelLocation, true, new Float32Array([
			Math.cos(theta), 0, Math.sin(theta), 0,
			0, 1, 0, 0,
			-Math.sin(theta), 0, Math.cos(theta), 0,
			0, 0, 0, 1,
			// 1, 0, 0, 0,
			// 0, 1, 0, 0,
			// 0, 0, 1, 0,
			// 0, 0, 0, 1,
		]));
		gl.uniformMatrix4fv(viewLocation, true, new Float32Array([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 5,
			0, 0, 0, 1,
		]));
		gl.uniformMatrix4fv(projectionLocation, true, perspectiveMatrix(75 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 100));

		if (tileVao) {
			gl.bindVertexArray(tileVao);
			gl.drawElements(gl.TRIANGLES, tileIndicesLength, gl.UNSIGNED_SHORT, 0);
		}

		nextFrame = window.requestAnimationFrame(animate);
	}
	nextFrame = window.requestAnimationFrame(animate);

	return () => {
		window.removeEventListener('resize', onResize);
		window.cancelAnimationFrame(nextFrame);
	};
}

function perspectiveMatrix(fov, aspect, near, far) {
	console.assert(fov > 0);
	console.assert(aspect !== 0);

	return new Float32Array([
		(1 / Math.tan(0.5 * fov)) / aspect, 0, 0, 0,
		0, 1 / Math.tan(0.5 * fov), 0, 0,
		0, 0, far / (far - near), - far * near / (far - near),
		0, 0, 1, 0,
	]);
}

