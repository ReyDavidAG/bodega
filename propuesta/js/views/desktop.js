import { setParams } from '../app.js'
import { DATA, fmt } from '../store.js'
import { esc, head, I, sampleBanner, segment, toast } from '../ui.js'

const KINDS = {
	captura: { label: 'Capturas', to: 'Imágenes/Capturas/2026-11' },
	nota: { label: 'Notas .md', to: 'Documents/Notas' },
	pdf: { label: 'PDF', to: 'Documents/PDF' },
	carpeta: { label: 'Carpetas', to: 'KINGSTON/Escritorio/2026-11' },
	otro: { label: 'Otros', to: 'KINGSTON/Escritorio/2026-11' },
}

const picked = new Set()

export const desktopView = ({ params }) => {
	const folder = params.get('carpeta') ?? 'Desktop'
	const files = DATA.desk.filter(f => f.folder === folder)
	const groups = Object.entries(KINDS).map(([id, k]) => ({ id, ...k, files: files.filter(f => f.kind === id) })).filter(g => g.files.length)
	const size = files.filter(f => picked.has(f.name)).reduce((s, f) => s + f.size, 0)
	return {
		title: 'Escritorio',
		html: `
		<section class="page">
			${sampleBanner(DATA.sample)}
			${head('Escritorio', 'Ordenar escritorio y descargas', 'Cada tipo tiene un destino. Nada se borra: se mueve a su carpeta o al Kingston.', segment('carpeta', [{ id: 'Desktop', label: 'Escritorio' }, { id: 'Downloads', label: 'Descargas' }], folder, 'Carpeta'))}
			${groups
				.map(
					g => `<article class="card" data-reveal>
						<header class="card-head"><div><h2>${g.label} <span class="muted">· ${g.files.length}</span></h2><p class="cap">Destino: <span class="mono">${esc(g.to)}</span></p></div><button class="btn sm" type="button" data-all="${g.id}">Elegir todos</button></header>
						<div class="files">${g.files.map((f, i) => `<label class="file" style="--n:${i}"><input class="check" type="checkbox" data-file="${esc(f.name)}" ${picked.has(f.name) ? 'checked' : ''}><b title="${esc(f.name)}">${esc(f.name)}</b><small>${fmt.gb(f.size)} · ${fmt.ago(f.mtime)}</small></label>`).join('')}</div>
					</article>`
				)
				.join('') || '<div class="empty"><strong>Limpio</strong>No hay nada que ordenar aquí.</div>'}
			<div class="sticky-bar" data-reveal>
				<div class="total">${picked.size} archivos<small>${fmt.gb(size)} · cada uno va a la carpeta de su tipo</small></div>
				<button class="btn" type="button" data-move ${picked.size ? '' : 'disabled'}>${I.move}Ordenar</button>
			</div>
		</section>`,
		mount: root => {
			const rerender = () => import('../app.js').then(m => m.render(false))
			root.querySelectorAll('[data-carpeta]').forEach(b => b.addEventListener('click', () => setParams({ carpeta: b.dataset.carpeta === 'Desktop' ? null : b.dataset.carpeta })))
			root.querySelectorAll('[data-file]').forEach(c => c.addEventListener('change', () => (c.checked ? picked.add(c.dataset.file) : picked.delete(c.dataset.file), rerender())))
			root.querySelectorAll('[data-all]').forEach(b => b.addEventListener('click', () => (files.filter(f => f.kind === b.dataset.all).forEach(f => picked.add(f.name)), rerender())))
			root.querySelector('[data-move]').addEventListener('click', () => {
				const n = picked.size
				DATA.desk = DATA.desk.filter(f => !picked.has(f.name))
				picked.clear()
				DATA.history.unshift({ at: new Date().toISOString(), what: `Escritorio ordenado: ${n} archivos`, freed: 0 })
				toast(`${n} archivos ordenados`)
				rerender()
			})
		},
	}
}
