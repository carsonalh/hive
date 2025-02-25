// ROUTER
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

// LOCAL GAMEPLAY
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
	in vec3 a_offset;

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
		vec4 pre_offset = u_model * vec4(a_position, 1.0);
		vec4 post_offset = vec4(a_offset, 0.0) + pre_offset;
		gl_Position = u_projection * u_view * post_offset;
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
	const offsetLocation = gl.getAttribLocation(program, 'a_offset');
	// console.log(coordLocation);

	let tileVao = null;
	let tileIndicesLength = -1;
	let tileIndicesType = gl.UNSIGNED_SHORT;
	let tileArrayBuffer = null;
	let coordBuffer = null;
	fetch('/static/res/tile.glb', { responseType: 'arraybuffer', mode: 'same-origin', cache: 'force-cache' })
		.then(async response => {
			const arrayBuffer = await response.arrayBuffer();
			const {
				positionArray,
				texCoordArray,
				normalArray,
				indicesArray,
			} = loadGltf(arrayBuffer);

			const vertexArray = gl.createVertexArray();
			gl.bindVertexArray(vertexArray);

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

			// We could even just preallocate the offset buffer here for future use
			const offsetBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
			const pos0 = axialToCartesian({ q: -1, r: 0 });
			const pos1 = axialToCartesian({ q: 0, r: 0 });
			const pos2 = axialToCartesian({ q: 1, r: -1 });
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([pos0.x, 0, pos0.y, pos1.x, 0, pos1.y, pos2.x, 0, -pos2.y]), gl.STATIC_DRAW);
			gl.enableVertexAttribArray(offsetLocation);
			gl.vertexAttribPointer(offsetLocation, 3, gl.FLOAT, false, 0, 0);
			gl.vertexAttribDivisor(offsetLocation, 1);
			coordBuffer = offsetBuffer;

			tileIndicesLength = indicesArray.length;
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

		gl.clearColor(0.18, 0.14, 0.19, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.useProgram(program);

		const theta = msSinceBegin / 1000;
		gl.uniformMatrix4fv(modelLocation, true, new Float32Array([
			// Math.cos(theta), 0, Math.sin(theta), 0,
			// 0, 1, 0, 0,
			// -Math.sin(theta), 0, Math.cos(theta), 0,
			// 0, 0, 0, 1,
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1,
		]));
		const cameraMatrix = new Float32Array([
			1, 0, 0, 0,
			0, 0, 1, 5,
			0, -1, 0, 0,
			0, 0, 0, 1,
		]);
		invert4x4(cameraMatrix, cameraMatrix);
		gl.uniformMatrix4fv(viewLocation, true, cameraMatrix);
		gl.uniformMatrix4fv(projectionLocation, true, perspectiveMatrix(75 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 100));

		if (tileVao) {
			gl.bindVertexArray(tileVao);
			gl.drawElementsInstanced(gl.TRIANGLES, tileIndicesLength, gl.UNSIGNED_SHORT, 0, 3);
			// gl.drawElements(gl.TRIANGLES, tileIndicesLength, gl.UNSIGNED_SHORT, 0);
		}

		nextFrame = window.requestAnimationFrame(animate);
	}
	nextFrame = window.requestAnimationFrame(animate);

	return () => {
		window.removeEventListener('resize', onResize);
		window.cancelAnimationFrame(nextFrame);
	};
}

/**
 * Looks in the negative z direction.
 */
function perspectiveMatrix(fov, aspect, near, far) {
	console.assert(fov > 0);
	console.assert(aspect !== 0);

	return new Float32Array([
		(1 / Math.tan(0.5 * fov)) / aspect, 0, 0, 0,
		0, 1 / Math.tan(0.5 * fov), 0, 0,
		0, 0, -far / (far - near), -far * near / (far - near),
		0, 0, -1, 0,
	]);
}

/**
 * This loader is _not_ meant to be a general-purpose gltf loader.
 * It simply loads a model that is in the format we need for this game, and
 * errors otherwise.
 */
function loadGltf(arrayBuffer) {
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

	console.assert(metadata.meshes.length === 1);
	const primitives = metadata.meshes[0].primitives[0];
	const positionAccessor = metadata.accessors[primitives.attributes.POSITION];
	console.assert(positionAccessor.type === 'VEC3'
		&& positionAccessor.componentType === WebGLRenderingContext.FLOAT);
	const texCoordAccessor = metadata.accessors[primitives.attributes.TEXCOORD_0];
	console.assert(texCoordAccessor.type === 'VEC2'
		&& texCoordAccessor.componentType === WebGLRenderingContext.FLOAT);
	const normalAccessor = metadata.accessors[primitives.attributes.NORMAL];
	console.assert(normalAccessor.type === 'VEC3'
		&& normalAccessor.componentType === WebGLRenderingContext.FLOAT);
	const indicesAccessor = metadata.accessors[primitives.indices];
	console.assert(indicesAccessor.type === 'SCALAR'
		&& indicesAccessor.componentType === WebGLRenderingContext.UNSIGNED_SHORT);

	const positionBufferView = metadata.bufferViews[primitives.attributes.POSITION];
	const texCoordBufferView = metadata.bufferViews[primitives.attributes.TEXCOORD_0];
	const normalBufferView = metadata.bufferViews[primitives.attributes.NORMAL];
	const indicesBufferView = metadata.bufferViews[primitives.indices];
	console.assert(positionBufferView.buffer == 0);
	console.assert(texCoordBufferView.buffer == 0);
	console.assert(normalBufferView.buffer == 0);
	console.assert(indicesBufferView.buffer == 0);

	const positionArray = new Float32Array(
		arrayBuffer,
		12 + 8 + chunk0Length + 8 + positionBufferView.byteOffset,
		positionBufferView.byteLength / 4
	);
	const texCoordArray = new Float32Array(
		arrayBuffer,
		12 + 8 + chunk0Length + 8 + texCoordBufferView.byteOffset,
		texCoordBufferView.byteLength / 4
	);
	const normalArray = new Float32Array(
		arrayBuffer,
		12 + 8 + chunk0Length + 8 + normalBufferView.byteOffset,
		normalBufferView.byteLength / 4
	);
	const indicesArray = new Uint16Array(
		arrayBuffer,
		12 + 8 + chunk0Length + 8 + indicesBufferView.byteOffset,
		indicesBufferView.byteLength / 2
	);

	return {
		positionArray,
		texCoordArray,
		normalArray,
		indicesArray,
	};
}

const TILE_INNER_RADIUS = 0.8;
const TILE_PLACEMENT_GAP = 0.25;

function axialToCartesian({ q, r }) {
	console.assert(Number.isInteger(q));
	console.assert(Number.isInteger(r));

	const tileScale = 2 * TILE_INNER_RADIUS + TILE_PLACEMENT_GAP;

	return {
		x: (q + 0.5 * r) * tileScale,
		y: -Math.sqrt(3) / 2 * r * tileScale,
	};
}

/**
 * Implementation copied from gl-matrix;
 * https://github.com/toji/gl-matrix.git
 */
function invert4x4(src, dst) {
	console.assert(src.length === 16);
	console.assert(dst.length === 16);

	let a00 = src[0],
	a01 = src[1],
	a02 = src[2],
	a03 = src[3];
	let a10 = src[4],
	a11 = src[5],
	a12 = src[6],
	a13 = src[7];
	let a20 = src[8],
	a21 = src[9],
	a22 = src[10],
	a23 = src[11];
	let a30 = src[12],
	a31 = src[13],
	a32 = src[14],
	a33 = src[15];

	let b00 = a00 * a11 - a01 * a10;
	let b01 = a00 * a12 - a02 * a10;
	let b02 = a00 * a13 - a03 * a10;
	let b03 = a01 * a12 - a02 * a11;
	let b04 = a01 * a13 - a03 * a11;
	let b05 = a02 * a13 - a03 * a12;
	let b06 = a20 * a31 - a21 * a30;
	let b07 = a20 * a32 - a22 * a30;
	let b08 = a20 * a33 - a23 * a30;
	let b09 = a21 * a32 - a22 * a31;
	let b10 = a21 * a33 - a23 * a31;
	let b11 = a22 * a33 - a23 * a32;

	// Calculate the determinant
	let det =
		b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

	if (!det) {
		return null;
	}
	det = 1.0 / det;

	dst[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	dst[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	dst[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	dst[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
	dst[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	dst[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	dst[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	dst[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
	dst[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	dst[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	dst[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	dst[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
	dst[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
	dst[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
	dst[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
	dst[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
}

