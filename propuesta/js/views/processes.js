import { setParams } from '../app.js'
import { DATA, fmt } from '../store.js'
import { esc, head, I, sampleBanner, segment, toast } from '../ui.js'

const SCOPES = [
	{ id: 'mine', label: 'Mis proyectos' },
	{ id: 'all', label: 'Todo' },
]

const KNOWN = { node: 'Vite / Node', dotnet: '.NET', Python: 'Python', dart: 'Dart', adb: 'Android Debug Bridge', java: 'Java' }

const confirming = new Set()

const kind = p => KNOWN[p.cmd] ?? (/\.Api$|\.Server$/.test(p.cmd) ? '.NET' : p.cmd)

const row = (p, n) => `
	<tr style="--n:${n}" data-pid="${p.pid}">
		<td><span class="port">:${p.port}</span></td>
		<td><div class="cell-main"><b>${p.project ? esc(p.project) : '<span class="muted">Sin proyecto</span>'}</b><small class="path">${esc(p.cwd || p.command)}</small></div></td>
		<td data-label="Proceso"><div class="proc"><span class="dot ping"></span>${esc(kind(p))} <span class="muted mono">pid ${p.pid}</span></div></td>
		<td class="num" data-label="Memoria">${p.mem ? fmt.gb(p.mem) : '—'}</td>
		<td class="num" data-label="Acción">${
			confirming.has(p.pid)
				? `<span class="confirm"><span>¿Detener?</span><button class="btn sm danger solid" type="button" data-kill="${p.pid}">Sí</button><button class="btn sm" type="button" data-cancel="${p.pid}">No</button></span>`
				: `<button class="btn sm danger" type="button" data-ask="${p.pid}" ${p.protected ? 'disabled title="Es Bodega"' : ''}>${I.stop}Detener</button>`
		}</td>
	</tr>`

export const processesView = ({ params }) => {
	const scope = params.get('ver') ?? 'mine'
	const ports = DATA.ports.filter(p => scope === 'all' || p.project).sort((a, b) => (a.project ?? '~').localeCompare(b.project ?? '~') || a.port - b.port)
	const daemons = DATA.daemons
	const mem = DATA.ports.filter(p => p.project).reduce((s, p) => s + p.mem, 0) + daemons.reduce((s, d) => s + d.mem, 0)
	return {
		title: 'Procesos y puertos',
		html: `
		<section class="page">
			${sampleBanner(DATA.sample)}
			${head('Procesos y puertos', 'Qué está abierto ahora', `Cada puerto con el proyecto que lo abrió (por la carpeta del proceso). Entre servidores y daemons de desarrollo se van ${fmt.gb(mem)} de memoria.`, segment('ver', SCOPES, scope, 'Mostrar'))}
			<article class="card" data-reveal>
				<header class="card-head"><div><h2>Puertos escuchando</h2><p class="cap">Detener manda una señal amable (SIGTERM) y sólo si no responde en 5 s la fuerza.</p></div><button class="btn sm" type="button" data-kill-mine>${I.stop}Detener todos los míos</button></header>
				<div class="table-wrap"><table class="table cards">
					<thead><tr><th>Puerto</th><th>Proyecto</th><th>Proceso</th><th class="num">Memoria</th><th class="num"></th></tr></thead>
					<tbody>${ports.map(row).join('') || '<tr><td colspan="5"><div class="empty"><strong>Nada abierto</strong>Ningún proyecto tiene servidores corriendo.</div></td></tr>'}</tbody>
				</table></div>
			</article>
			<article class="card" data-reveal>
				<header class="card-head"><div><h2>Daemons de compilación</h2><p class="cap">Gradle, MSBuild, Kotlin y el analizador de Dart se quedan vivos después de compilar.</p></div></header>
				${
					daemons.length
						? `<table class="table cards"><tbody>${daemons.map((d, i) => `<tr style="--n:${i}"><td><b>${esc(d.label)}</b> <span class="muted mono">pid ${d.pid}</span></td><td class="num" data-label="Memoria">${fmt.gb(d.mem)}</td><td class="num"><button class="btn sm" type="button" data-daemon="${d.pid}">${I.stop}Detener</button></td></tr>`).join('')}</tbody></table>`
						: '<div class="empty"><strong>Ninguno corriendo</strong>Aparecen aquí cuando compilas Android o .NET.</div>'
				}
			</article>
		</section>`,
		mount: root => {
			const rerender = () => import('../app.js').then(m => m.render(false))
			root.querySelectorAll('[data-ver]').forEach(b => b.addEventListener('click', () => setParams({ ver: b.dataset.ver === 'mine' ? null : b.dataset.ver })))
			root.querySelectorAll('[data-ask]').forEach(b => b.addEventListener('click', () => (confirming.add(Number(b.dataset.ask)), rerender())))
			root.querySelectorAll('[data-cancel]').forEach(b => b.addEventListener('click', () => (confirming.delete(Number(b.dataset.cancel)), rerender())))
			root.querySelectorAll('[data-kill]').forEach(b =>
				b.addEventListener('click', () => {
					const pid = Number(b.dataset.kill)
					const p = DATA.ports.find(x => x.pid === pid)
					b.closest('tr').classList.add('gone')
					setTimeout(() => {
						DATA.ports = DATA.ports.filter(x => x.pid !== pid)
						confirming.delete(pid)
						toast(`Puerto ${p.port} libre (${p.project ?? p.cmd})`)
						rerender()
					}, 420)
				})
			)
			root.querySelector('[data-kill-mine]').addEventListener('click', () => toast('En la app real: pide confirmación con la lista y detiene uno por uno'))
			root.querySelectorAll('[data-daemon]').forEach(b => b.addEventListener('click', () => toast('En la app real: gradle --stop / dotnet build-server shutdown')))
		},
	}
}
