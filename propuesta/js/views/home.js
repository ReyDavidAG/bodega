import { alerts, buildPlan, CATEGORIES, DATA, fmt, projects, recoverable } from '../store.js'
import { esc, head, I, sampleBanner } from '../ui.js'
import { diskCard, internalParts } from './disk_card.js'

const alertList = () => {
	const list = alerts()
	return list.length
		? `<section class="alerts" data-reveal aria-label="Avisos">${list
				.map(a => `<div class="alert ${a.tone}">${I.alert}<div><b>${esc(a.title)}</b>${esc(a.text)}</div><a class="btn sm" href="${a.to}">${a.action}</a></div>`)
				.join('')}</section>`
		: ''
}

const topProjects = () => {
	const max = projects[0]?.size || 1
	return `<ol class="ranked">${projects
		.slice(0, 8)
		.map(
			p => `<li><a href="#/proyectos?p=${encodeURIComponent(p.name)}">
				<span class="rk-name"><span>${esc(p.name)}</span>${p.ports.length ? `<span class="badge good">${p.ports.length} abierto${p.ports.length > 1 ? 's' : ''}</span>` : ''}</span>
				<span class="rk-size">${fmt.gb(p.size)}</span>
				<span class="rk-track"><span style="width:${((p.size - p.regenSize) / max) * 100}%;--c:var(--ink-2)" data-tip="Código · ${fmt.gb(p.size - p.regenSize)}"></span><span style="width:${(p.regenSize / max) * 100}%;--c:var(--build)" data-tip="Compilados · ${fmt.gb(p.regenSize)}"></span></span>
			</a></li>`
		)
		.join('')}</ol>`
}

export const homeView = () => {
	const plan = buildPlan()
	const total = recoverable()
	const groups = plan.filter(g => g.checked)
	const k = DATA.disks.kingston
	return {
		title: 'Inicio',
		html: `
		<section class="page">
			${sampleBanner(DATA.sample)}
			${head('Inicio', 'Tu Mac, hoy', `Escaneada ${new Date(DATA.scannedAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}.`)}
			${alertList()}
			<article class="reclaim" data-reveal>
				<div>
					<div class="label">Puedes recuperar sin perder nada</div>
					<div class="big">${fmt.gb(total).replace(' ', '<small> ')}</small></div>
					<p class="why">${groups.map(g => esc(g.title)).slice(0, 4).join(', ')}${groups.length > 4 ? ` y ${groups.length - 4} más` : ''}. Todo se regenera solo o se mueve al Kingston.</p>
				</div>
				<a class="btn" href="#/limpieza">${I.clean}Revisar el plan</a>
			</article>
			<div class="disks">
				${diskCard('Macintosh HD', 'Disco interno · APFS', DATA.disks.internal, internalParts())}
				${diskCard('KINGSTON', k ? 'Externo USB · APFS · sin cifrar' : 'Externo USB', k, k ? [{ label: 'Usado', color: 'var(--ink-2)', value: k.used, text: fmt.gb(k.used) }] : [], k ? '' : '')}
			</div>
			<div class="grid wide">
				<article class="card" data-reveal>
					<header class="card-head"><div><h2>Lo que más pesa en Developer</h2><p class="cap">Gris: tu código. Naranja: compilados que se regeneran.</p></div><a class="btn sm" href="#/proyectos">Todos</a></header>
					${topProjects()}
				</article>
				<article class="card" data-reveal>
					<header class="card-head"><div><h2>Por tipo</h2><p class="cap">Lo que ocupa el disco interno.</p></div></header>
					<ol class="ranked">${CATEGORIES.map(c => {
						const v = DATA.categories[c.id]
						const max = Math.max(...CATEGORIES.map(x => DATA.categories[x.id]))
						return `<li><div><span class="rk-name"><span>${c.label}</span></span><span class="rk-size">${fmt.gb(v)}</span><span class="rk-track"><span style="width:${(v / max) * 100}%;--c:${c.color}"></span></span><small class="muted" style="grid-column:1/-1;font-size:12px">${c.hint}</small></div></li>`
					}).join('')}</ol>
				</article>
			</div>
		</section>`,
	}
}
