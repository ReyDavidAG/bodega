import { DATA } from './store.js'
import { bindTips, esc, I, NAV, reveal, slideThumbs } from './ui.js'
import { cleanView } from './views/clean.js'
import { desktopView } from './views/desktop.js'
import { disksView } from './views/disks.js'
import { historyView } from './views/history.js'
import { homeView } from './views/home.js'
import { howView } from './views/how.js'
import { processesView } from './views/processes.js'
import { projectsView } from './views/projects.js'
import { vaultView } from './views/vault.js'

const ROUTES = {
	'/': homeView,
	'/limpieza': cleanView,
	'/proyectos': projectsView,
	'/procesos': processesView,
	'/boveda': vaultView,
	'/discos': disksView,
	'/escritorio': desktopView,
	'/historial': historyView,
	'/como-funciona': howView,
}

export const here = () => {
	const [path, q = ''] = location.hash.slice(1).split('?')
	return { path: path || '/', params: new URLSearchParams(q) }
}

export const setParams = patch => {
	const { path, params } = here()
	for (const [k, v] of Object.entries(patch)) (v === null || v === '' ? params.delete(k) : params.set(k, v))
	const q = params.toString()
	history.replaceState(null, '', `#${path}${q ? `?${q}` : ''}`)
	render(false)
}

const counts = {
	'#/procesos': () => DATA.ports.filter(p => p.project).length,
	'#/boveda': () => DATA.vault.filter(v => v.kind === 'firma').length,
}

const links = mobile =>
	NAV.filter(n => !(mobile && n.desktop))
		.map(n => {
			const c = counts[n.href]?.()
			const group = !mobile && n.group ? `<span class="nav-group">${n.group}</span>` : ''
			return `${group}<a href="${n.href}" data-path="${n.href.slice(1)}">${I[n.icon]}<span>${esc(mobile ? (n.short ?? n.label) : n.label)}</span>${c ? `<span class="count ${n.href === '#/boveda' ? 'alert' : ''}">${c}</span>` : ''}</a>`
		})
		.join('')

const shell = () => `
	<div class="shell">
		<header class="topbar">
			<a class="brand" href="#/"><span class="crate" aria-hidden="true"></span>Bodega</a>
			<span class="spacer"></span>
			<a class="live" href="#/discos" title="Último escaneo">
				<span class="dot ping"></span><span><span class="long">Escaneado · </span>${new Date(DATA.scannedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
			</a>
			<button class="icon-btn" type="button" data-rescan title="Volver a escanear">${I.refresh}<span class="sr-only">Volver a escanear</span></button>
			<button class="icon-btn" type="button" data-theme title="Cambiar tema">${I.moon}<span class="sr-only">Cambiar tema</span></button>
		</header>
		<aside class="sidebar"><nav class="nav" aria-label="Secciones"><span class="nav-pill" aria-hidden="true"></span>${links(false)}</nav></aside>
		<main id="main" tabindex="-1"></main>
		<footer class="tabbar"><nav class="nav" aria-label="Secciones"><span class="nav-pill" aria-hidden="true"></span>${links(true)}</nav></footer>
		<div class="toast" role="status"></div>
		<div class="tip" aria-hidden="true"></div>
	</div>`

const pill = () =>
	document.querySelectorAll('.nav').forEach(nav => {
		const p = nav.querySelector('.nav-pill')
		const a = nav.querySelector('[aria-current="page"]')
		if (!a) return (p.style.opacity = '0')
		Object.assign(p.style, { opacity: '1', width: `${a.offsetWidth}px`, height: `${a.offsetHeight}px`, transform: `translate(${a.offsetLeft}px, ${a.offsetTop}px)` })
	})

let last = null

export const render = (navigate = true) => {
	const { path, params } = here()
	const view = (ROUTES[path] ?? homeView)({ params })
	const main = document.getElementById('main')
	const changed = path !== last
	last = path
	const update = () => {
		main.innerHTML = view.html
		document.querySelectorAll('.nav a').forEach(a => (a.dataset.path === path ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')))
		pill()
		document.title = `${view.title} · Bodega`
		view.mount?.(main)
		slideThumbs(main)
		main.classList.toggle('static', !changed)
		if (changed) return reveal(main)
		main.querySelectorAll('[data-reveal]').forEach(el => {
			el.style.transition = 'none'
			el.classList.add('in')
		})
	}
	if (navigate && changed && !document.hidden && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(update)
	else update()
	if (changed) scrollTo({ top: 0 })
	return Promise.resolve()
}

document.getElementById('app').innerHTML = shell()
bindTips(document.body)
document.addEventListener('click', e => {
	if (e.target.closest('[data-theme]')) {
		const r = document.documentElement
		const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
		r.dataset.theme = dark ? 'light' : 'dark'
	}
	if (e.target.closest('[data-rescan]')) {
		const b = e.target.closest('[data-rescan]')
		b.classList.add('busy')
		b.querySelector('svg').style.animation = 'spin .9s linear infinite'
		setTimeout(() => (b.querySelector('svg').style.animation = ''), 1600)
	}
})
addEventListener('keydown', e => e.key === 'Escape' && here().params.has('p') && setParams({ p: null }))
addEventListener('hashchange', () => render())
addEventListener('resize', pill)
render()
