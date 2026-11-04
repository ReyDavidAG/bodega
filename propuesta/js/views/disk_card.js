import { CATEGORIES, DATA, fmt } from '../store.js'
import { bar, esc, I, legend } from '../ui.js'

export const internalParts = () => {
	const d = DATA.disks.internal
	const known = CATEGORIES.map(c => ({ ...c, value: DATA.categories[c.id] }))
	const rest = Math.max(0, d.used - known.reduce((s, c) => s + c.value, 0))
	return [...known, { id: 'rest', label: 'macOS, apps y resto', color: 'var(--rest)', value: rest }].map(p => ({ ...p, text: fmt.gb(p.value) }))
}

export const diskCard = (name, meta, disk, parts, extra = '') => `
	<article class="card disk" data-reveal>
		<div class="disk-top">
			<span class="disk-icon">${I.disk}</span>
			<div><div class="disk-name">${esc(name)}</div><div class="disk-meta">${meta}</div></div>
			${disk ? `<div class="disk-free"><b>${fmt.gb(disk.free)}</b><small>libres de ${fmt.gb(disk.size)}</small></div>` : '<div class="disk-free"><span class="badge">Desconectado</span></div>'}
		</div>
		${disk ? bar(parts, disk.size, 'tall') : ''}
		${parts.length ? legend(parts.map(p => ({ label: p.label, color: p.color, value: p.text }))) : ''}
		${extra}
	</article>`
