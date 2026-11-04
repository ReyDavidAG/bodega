import { setParams } from '../app.js'
import { DATA, fmt, projects, STACKS } from '../store.js'
import { esc, head, I, sampleBanner, segment, toast } from '../ui.js'

const FILTERS = [{ id: 'all', label: 'Todos' }, ...Object.entries(STACKS).map(([id, s]) => ({ id, label: s.label }))]
const SORTS = [
	{ id: 'size', label: 'Tamaño' },
	{ id: 'regen', label: 'Recuperable' },
	{ id: 'last', label: 'Inactivos' },
]

const stackChips = p => p.stacks.map(s => `<span class="stack"><i style="--c:${STACKS[s].color}"></i>${STACKS[s].label}</span>`).join(' ')

const row = (p, max, n) => `
	<tr style="--n:${n}" data-open="${esc(p.name)}">
		<td><div class="cell-main"><b>${esc(p.name)}</b><small>${stackChips(p)} · ${p.active ? `<span class="badge good">activo</span> ` : ''}${fmt.ago(p.last)}</small></div></td>
		<td class="num" data-label="Total">${fmt.gb(p.size)}<div class="mini" aria-hidden="true"><span style="width:${((p.size - p.regenSize) / max) * 100}%;--c:var(--ink-2)"></span><span style="width:${(p.regenSize / max) * 100}%;--c:var(--build)"></span></div></td>
		<td class="num" data-label="Recuperable">${p.regenSize ? fmt.gb(p.regenSize) : '—'}</td>
		<td data-label="Abierto">${p.ports.length ? p.ports.map(x => `<span class="badge good">:${x.port}</span>`).join(' ') : '<span class="muted">—</span>'}</td>
		<td data-label="Secretos">${p.secrets.some(s => s.kind === 'firma') ? `<span class="badge bad">${I.key.replace('width="20" height="20"', 'width="12" height="12"')} ${p.secrets.filter(s => s.kind === 'firma').length}</span>` : p.secrets.length ? `<span class="badge">${p.secrets.length}</span>` : '<span class="muted">—</span>'}</td>
	</tr>`

const drawer = p => {
	if (!p) return ''
	return `
	<div class="scrim open" data-close></div>
	<aside class="drawer open" aria-label="Detalle de ${esc(p.name)}">
		<div class="toolbar" style="justify-content:space-between;margin-bottom:14px"><span class="eyebrow">Proyecto</span><button class="icon-btn ghost" type="button" data-close title="Cerrar">${I.close}<span class="sr-only">Cerrar</span></button></div>
		<h2>${esc(p.name)}</h2>
		<p class="cap" style="margin:6px 0 16px">${stackChips(p)} · último cambio ${fmt.ago(p.last)}</p>
		<dl class="kv">
			<div><dt>Total</dt><dd>${fmt.gb(p.size)}</dd></div>
			<div><dt>Tu código</dt><dd>${fmt.gb(p.size - p.regenSize)}</dd></div>
			<div><dt>Compilados</dt><dd>${fmt.gb(p.regenSize)}</dd></div>
			<div><dt>Puertos abiertos</dt><dd>${p.ports.map(x => x.port).join(', ') || '—'}</dd></div>
			<div><dt>Archivos de secretos</dt><dd>${p.secrets.length}</dd></div>
		</dl>
		<h3 style="margin:20px 0 8px;font-size:14px">Carpetas que se regeneran</h3>
		${p.regen.length ? `<div class="plan-items" style="border-radius:12px;border:1px solid var(--line)">${p.regen.map((r, i) => `<div class="plan-item" style="padding-left:14px;--n:${i}"><span></span><span class="path">${esc(r.path.replace(`~/Developer/${p.name}/`, ''))}</span><span class="gb">${fmt.gb(r.size)}</span></div>`).join('')}</div>` : '<p class="muted">Nada que limpiar.</p>'}
		<div class="toolbar" style="margin-top:18px">
			<button class="btn primary" type="button" data-clean ${p.regenSize ? '' : 'disabled'}>${I.clean}Limpiar compilados</button>
			<button class="btn" type="button" data-archive>${I.move}Archivar al Kingston</button>
		</div>
		<p class="cap" style="margin-top:10px">Archivar mueve la carpeta completa al Kingston y deja un acceso en Developer; se regresa con un clic.</p>
	</aside>`
}

export const projectsView = ({ params }) => {
	const filter = params.get('stack') ?? 'all'
	const sort = params.get('orden') ?? 'size'
	const q = (params.get('q') ?? '').toLowerCase()
	const open = projects.find(p => p.name === params.get('p'))
	const list = projects
		.filter(p => filter === 'all' || p.stacks.includes(filter))
		.filter(p => !q || p.name.toLowerCase().includes(q))
		.sort((a, b) => (sort === 'regen' ? b.regenSize - a.regenSize : sort === 'last' ? a.last.localeCompare(b.last) : b.size - a.size))
	const max = Math.max(...projects.map(p => p.size), 1)
	const total = projects.reduce((s, p) => s + p.size, 0)
	const regen = projects.reduce((s, p) => s + p.regenSize, 0)
	return {
		title: 'Proyectos',
		html: `
		<section class="page">
			${sampleBanner(DATA.sample)}
			${head('Proyectos', `${projects.length} proyectos en Developer`, `${fmt.gb(total)} en total; ${fmt.gb(regen)} son compilados que se regeneran.`)}
			<div class="toolbar" data-reveal>
				<label class="search">${I.search}<span class="sr-only">Buscar proyecto</span><input type="search" value="${esc(q)}" placeholder="Buscar proyecto" data-search></label>
				${segment('stack', FILTERS, filter, 'Tecnología')}
				${segment('orden', SORTS, sort, 'Ordenar')}
			</div>
			<article class="card" data-reveal>
				<div class="table-wrap"><table class="table cards">
					<thead><tr><th>Proyecto</th><th class="num">Total</th><th class="num">Recuperable</th><th>Abierto</th><th>Secretos</th></tr></thead>
					<tbody>${list.map((p, i) => row(p, max, i)).join('') || '<tr><td colspan="5"><div class="empty"><strong>Sin coincidencias</strong></div></td></tr>'}</tbody>
				</table></div>
			</article>
			${drawer(open)}
		</section>`,
		mount: root => {
			root.querySelectorAll('[data-stack]').forEach(b => b.addEventListener('click', () => setParams({ stack: b.dataset.stack === 'all' ? null : b.dataset.stack })))
			root.querySelectorAll('[data-orden]').forEach(b => b.addEventListener('click', () => setParams({ orden: b.dataset.orden === 'size' ? null : b.dataset.orden })))
			root.querySelectorAll('[data-open]').forEach(r => r.addEventListener('click', () => setParams({ p: r.dataset.open })))
			root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => setParams({ p: null })))
			root.querySelector('[data-clean]')?.addEventListener('click', () => (location.hash = '#/limpieza'))
			root.querySelector('[data-archive]')?.addEventListener('click', () => toast('En la app real: mover al Kingston con verificación de checksum'))
			let t
			const input = root.querySelector('[data-search]')
			input.addEventListener('input', () => {
				clearTimeout(t)
				t = setTimeout(() => {
					setParams({ q: input.value.trim() })
					const next = document.querySelector('[data-search]')
					next.focus()
					next.setSelectionRange(next.value.length, next.value.length)
				}, 300)
			})
		},
	}
}
