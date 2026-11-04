export const esc = v => String(v).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

const svg = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`

export const I = {
	home: svg('<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>'),
	projects: svg('<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/>'),
	clean: svg('<path d="M14 4 20 10M5 21l4-1 10.5-10.5a2.1 2.1 0 0 0-3-3L6 17l-1 4z"/><path d="M3 4h6M5 2v4"/>'),
	ports: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M7 9h.01M11 9h6"/>'),
	disk: svg('<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 14h.01M11 14h6"/>'),
	desk: svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><path d="m8 11 2.5 2.5L16 8"/>'),
	vault: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5V7M15.5 12H17M7 20v1M17 20v1"/>'),
	history: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>'),
	how: svg('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.5M12 17h.01"/>'),
	moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
	refresh: svg('<path d="M20 11a8 8 0 0 0-14.6-4.5M4 13a8 8 0 0 0 14.6 4.5"/><path d="M5 3v4h4M19 21v-4h-4"/>'),
	alert: svg('<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4M12 17h.01"/>'),
	check: svg('<path d="m5 12 4.5 4.5L19 7"/>'),
	stop: svg('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
	folder: svg('<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/>'),
	key: svg('<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>'),
	file: svg('<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/>'),
	lock: svg('<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>'),
	move: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
	search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>'),
	eject: svg('<path d="M12 5 5 13h14z"/><path d="M5 18h14"/>'),
	close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
}

export const NAV = [
	{ href: '#/', label: 'Inicio', icon: 'home' },
	{ href: '#/limpieza', label: 'Limpieza', icon: 'clean' },
	{ href: '#/proyectos', label: 'Proyectos', icon: 'projects' },
	{ href: '#/procesos', label: 'Procesos y puertos', short: 'Procesos', icon: 'ports' },
	{ href: '#/boveda', label: 'Bóveda', icon: 'vault', group: 'Guardar' },
	{ href: '#/discos', label: 'Discos', icon: 'disk', desktop: true },
	{ href: '#/escritorio', label: 'Escritorio', icon: 'desk', desktop: true },
	{ href: '#/historial', label: 'Historial', icon: 'history', desktop: true, group: 'Sistema' },
	{ href: '#/como-funciona', label: 'Cómo funciona', icon: 'how', desktop: true },
]

export const head = (eyebrow, title, text = '', side = '') => `
	<header class="head" data-reveal>
		<div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${text ? `<p>${text}</p>` : ''}</div>
		${side ? `<div>${side}</div>` : ''}
	</header>`

export const segment = (name, options, active, label) => `
	<div class="segment" role="radiogroup" aria-label="${esc(label)}" data-segment="${name}">
		<span class="segment-thumb" aria-hidden="true"></span>
		${options.map(o => `<button type="button" role="radio" aria-checked="${o.id === active}" data-${name}="${o.id}">${esc(o.label)}</button>`).join('')}
	</div>`

export const legend = items => `<div class="legend">${items.map(i => `<span><i style="--c:${i.color}"></i>${esc(i.label)}${i.value ? ` <em>${i.value}</em>` : ''}</span>`).join('')}</div>`

export const bar = (parts, total, cls = '') =>
	`<div class="bar ${cls}" role="img" aria-label="${esc(parts.map(p => `${p.label} ${p.text}`).join(', '))}">${parts
		.map(p => `<span style="flex-grow:${(p.value / total) * 1000};--c:${p.color}" data-tip="${esc(`${p.label} · ${p.text}`)}"></span>`)
		.join('')}<span class="free" style="flex-grow:${Math.max(0, (1 - parts.reduce((s, p) => s + p.value, 0) / total) * 1000)}"></span></div>`

export const sampleBanner = sample => (sample ? `<p class="sample" data-reveal>Datos de ejemplo: nombres y tamaños ficticios. En tu Mac se llena con el escaneo real.</p>` : '')

export const slideThumbs = root =>
	root.querySelectorAll('[data-segment]').forEach(group => {
		const thumb = group.querySelector('.segment-thumb')
		const active = group.querySelector('[aria-checked="true"]')
		if (!active) return (thumb.style.opacity = '0')
		thumb.style.width = `${active.offsetWidth}px`
		thumb.style.transform = `translateX(${active.offsetLeft - 3}px)`
	})

export const reveal = root => {
	const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach(e => (e.target.classList.add('in'), io.unobserve(e.target))), { rootMargin: '0px 0px -6% 0px' })
	root.querySelectorAll('[data-reveal]').forEach((el, i) => {
		el.style.setProperty('--i', String(Math.min(i, 8)))
		io.observe(el)
	})
}

export const toast = message => {
	const el = document.querySelector('.toast')
	el.textContent = message
	el.classList.add('show')
	clearTimeout(toast.t)
	toast.t = setTimeout(() => el.classList.remove('show'), 2600)
}

export const bindTips = root => {
	const tip = document.querySelector('.tip')
	root.addEventListener('pointerover', e => {
		const t = e.target.closest('[data-tip]')
		if (!t) return
		const r = t.getBoundingClientRect()
		tip.textContent = t.dataset.tip
		tip.style.left = `${r.left + r.width / 2}px`
		tip.style.top = `${r.top}px`
		tip.classList.add('show')
	})
	root.addEventListener('pointerout', e => e.target.closest('[data-tip]') && tip.classList.remove('show'))
}
