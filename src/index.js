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

document.addEventListener('DOMContentLoaded', () => {
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
});

// LOCAL GAMEPLAY:
function setupLocalGameplay() {
	const canvas = document.querySelector('canvas');
	const onResize = () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	};
	window.addEventListener('resize', onResize);

	const gl = canvas.getContext('webgl2');

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

		nextFrame = window.requestAnimationFrame(animate);
	}
	nextFrame = window.requestAnimationFrame(animate);


	return () => {
		window.removeEventListener('resize', onResize);
		window.cancelAnimationFrame(nextFrame);
	};
}

