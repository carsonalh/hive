import { assert } from './assert'
import { setupLocalGameplay } from './local'

function router() {
	assert(main != null)

	let match = views.find(v => v.path === window.location.pathname)
	if (!match) {
		match = views[0]
	}

	viewTeardown()
	main.replaceChildren(...match.nodes)
	viewTeardown = match.viewFn()
}

function navigate(url: string) {
	if (url !== window.location.pathname) {
		history.pushState({}, '', url)
		router()
	}
}

type ViewFn = () => () => unknown

const views: { path: string, viewFn: ViewFn, nodes: any[] }[] = []
const viewFns = {
	'/local': setupLocalGameplay,
}
let viewTeardown = () => {}

let main: HTMLElement | null = null

function setupDom() {
	main = document.querySelector('main')
	assert(main != null)
	// begin by making a list of all our routes for easy access
	for (const html of document.querySelectorAll('[data-path]')) {
		const path = html.getAttribute('data-path')
		assert(path != null)

		let viewFn = () => () => {}
		if (path in viewFns) {
			viewFn = viewFns[path as keyof typeof viewFns]
		}

		if (html.matches('template')) {
			assert(html instanceof HTMLTemplateElement)
			views.push({
				path,
				viewFn,
				nodes: Array.from(html.content.cloneNode(true).childNodes),
			})
		} else {
			views.push({
				path,
				viewFn,
				nodes: Array.from(html.childNodes),
			})
		}
	}

	document.body.addEventListener('click', (e) => {
		const { target } = e
		assert(target instanceof HTMLElement)
		if (!target.matches('[data-link]')) {
			return
		}
		assert('href' in target)
		assert(typeof target.href == 'string')

		e.preventDefault()
		navigate(target.href)
	})

	// We dont store any state in the history
	window.addEventListener('popstate', router)

	router()
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', setupDom)
} else {
	setupDom()
}

