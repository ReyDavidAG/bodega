import { DATA, buildPlan, fmt } from '../store.js'
import { esc, head, I, sampleBanner, toast } from '../ui.js'

const state = { picked: null, open: new Set(), running: false, done: new Set() }

const init = plan => {
	if (state.picked) return
	state.picked = new Map(plan.map(g => [g.id, new Set(g.checked ? g.items.map((_, i) => i) : [])]))
}

const selectedSize = plan => plan.reduce((s, g) => s + g.items.reduce((a, it, i) => a + (state.picked.get(g.id).has(i) ? it.size : 0), 0), 0)

const group = (g, n) => {
	const picked = state.picked.get(g.id)
	const all = picked.size === g.items.length
	const some = picked.size > 0 && !all
	const open = state.open.has(g.id)
	return `<section class="plan-group" style="--n:${n}">
		<div class="plan-head" data-toggle="${esc(g.id)}">
			<input class="check" type="checkbox" data-group="${esc(g.id)}" ${all ? 'checked' : ''} ${some ? 'data-indeterminate' : ''} aria-label="Incluir ${esc(g.title)}">
			<span class="swatch" style="--c:${g.color}"></span>
			<span class="what"><b>${esc(g.title)} ${g.move ? '<span class="badge">se mueve</span>' : ''}</b><small>${esc(g.group)} · ${esc(g.note)}</small></span>
			<span class="gb">${fmt.gb(g.size)}</span>
		</div>
		${
			open
				? `<p class="safety">${esc(g.safety)}</p><div class="plan-items">${g.items
						.map(
							(it, i) => `<label class="plan-item ${state.done.has(`${g.id}:${i}`) ? 'done' : ''}" style="--n:${i}">
								<input class="check" type="checkbox" data-item="${esc(g.id)}" data-i="${i}" ${picked.has(i) ? 'checked' : ''}>
								<span>${esc(it.label)} <span class="muted">· ${esc(it.back)}</span></span>
								<span class="gb">${state.done.has(`${g.id}:${i}`) ? 'listo' : fmt.gb(it.size)}</span>
								<code>${esc(it.cmd)}</code>
							</label>`
						)
						.join('')}</div>`
				: ''
		}
	</section>`
}

export const cleanView = () => {
	const plan = buildPlan()
	init(plan)
	const size = selectedSize(plan)
	const count = [...state.picked.values()].reduce((s, x) => s + x.size, 0)
	return {
		title: 'Limpieza',
		html: `
		<section class="page">
			${sampleBanner(DATA.sample)}
			${head('Limpieza', 'Plan de limpieza', 'Marcado por omisión sólo lo seguro: proyectos sin cambios en dos semanas, Xcode, cachés y emuladores al Kingston. Abre cada grupo para ver carpeta por carpeta y el comando exacto.')}
			${[...new Set(plan.map(g => g.group))]
				.map(name => {
					const gs = plan.filter(g => g.group === name)
					return gs.length === 1 ? `<section class="plan-section" data-reveal>${group(gs[0], 0)}</section>` : `<section class="plan-section" data-reveal><h2 class="section-title">${esc(name === 'Compilados' ? 'Compilados de proyectos' : name)}<span class="mono muted">${fmt.gb(gs.reduce((s, g) => s + g.size, 0))}</span></h2>${gs.map(group).join('')}</section>`
				})
				.join('')}
			<div class="sticky-bar" data-reveal>
				<div class="total">${fmt.gb(size)}<small>${count} carpetas seleccionadas · nada se borra sin pasar por la Papelera</small></div>
				<button class="btn" type="button" data-apply ${size && !state.running ? '' : 'disabled'}>${state.running ? I.refresh : I.clean}${state.running ? 'Limpiando…' : 'Aplicar plan'}</button>
				<div class="progress" aria-hidden="true"><span data-progress></span></div>
			</div>
		</section>`,
		mount: root => {
			root.querySelectorAll('[data-indeterminate]').forEach(c => (c.indeterminate = true))
			const rerender = () => import('../app.js').then(m => m.render(false))
			root.querySelectorAll('[data-toggle]').forEach(h =>
				h.addEventListener('click', e => {
					if (e.target.closest('input')) return
					const id = h.dataset.toggle
					state.open.has(id) ? state.open.delete(id) : state.open.add(id)
					rerender()
				})
			)
			root.querySelectorAll('[data-group]').forEach(c =>
				c.addEventListener('change', () => {
					const g = plan.find(x => x.id === c.dataset.group)
					state.picked.set(g.id, new Set(c.checked ? g.items.map((_, i) => i) : []))
					rerender()
				})
			)
			root.querySelectorAll('[data-item]').forEach(c =>
				c.addEventListener('change', () => {
					const set = state.picked.get(c.dataset.item)
					c.checked ? set.add(Number(c.dataset.i)) : set.delete(Number(c.dataset.i))
					rerender()
				})
			)
			root.querySelector('[data-apply]').addEventListener('click', () => {
				const queue = plan.flatMap(g => g.items.map((it, i) => ({ g, it, i })).filter(x => state.picked.get(g.id).has(x.i)))
				state.running = true
				queue.forEach(x => state.open.add(x.g.id))
				rerender()
				let n = 0
				const step = () => {
					if (n >= queue.length) {
						state.running = false
						DATA.history.unshift({ at: new Date().toISOString(), what: `Plan aplicado: ${queue.length} carpetas`, freed: size })
						toast(`Listo: ${fmt.gb(size)} recuperados`)
						return rerender()
					}
					const { g, i } = queue[n++]
					state.done.add(`${g.id}:${i}`)
					state.picked.get(g.id).delete(i)
					document.querySelector('[data-progress]').style.width = `${(n / queue.length) * 100}%`
					rerender().then(() => {
						const bar = document.querySelector('[data-progress]')
						if (bar) bar.style.width = `${(n / queue.length) * 100}%`
						setTimeout(step, 220)
					})
				}
				setTimeout(step, 300)
			})
		},
	}
}
