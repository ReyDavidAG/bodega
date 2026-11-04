import type { Config } from './config.ts'
import type { Category, GlobalKind } from './globals.ts'
import type { Scan } from './scan.ts'

export type Action = {
	id: string
	group: string
	kind: GlobalKind
	label: string
	path: string
	size: number
	back: string
	command?: { bin: string; args: string[] }
	checked: boolean
}

export type PlanGroup = {
	id: string
	section: 'xcode' | 'simulators' | 'emulators' | 'caches' | 'projects'
	title: string
	note: string
	safety: string
	color: Category
	active: boolean
	actions: Action[]
	size: number
}

const SECTION: Record<Category, PlanGroup['section']> = {
	build: 'xcode',
	sim: 'simulators',
	emu: 'emulators',
	cache: 'caches',
}
const TITLES: Record<PlanGroup['section'], string> = {
	xcode: 'Xcode',
	simulators: 'Simuladores de iOS',
	emulators: 'Emuladores de Android',
	caches: 'Cachés de paquetes',
	projects: 'Compilados',
}

const DAY = 864e5

export const buildPlan = (scan: Scan, config: Config): PlanGroup[] => {
	const groups: PlanGroup[] = []
	for (const section of [
		'xcode',
		'simulators',
		'emulators',
		'caches',
	] as const) {
		const items = scan.globals.filter(g => SECTION[g.category] === section)
		if (!items.length) continue
		const actions = items.map(g => ({
			id: `g:${g.id}`,
			group: section,
			kind: g.kind,
			label: g.label,
			path: g.path,
			size: g.size,
			back: g.back,
			command: g.command,
			checked: g.safe && g.kind !== 'relocate',
		}))
		groups.push({
			id: section,
			section,
			title: TITLES[section],
			note: items.map(i => i.note).join(' '),
			safety:
				section === 'emulators' || items.some(i => i.kind === 'relocate')
					? 'Lo que dice "se mueve" va al disco externo con su variable oficial y un acceso en la ruta original; no se borra.'
					: 'Se usan los comandos oficiales de cada herramienta o se borra lo que la herramienta vuelve a crear sola.',
			color: items[0].category,
			active: false,
			actions,
			size: actions.reduce((s, a) => s + a.size, 0),
		})
	}
	const now = Date.now()
	for (const p of scan.projects) {
		const size = p.regen.reduce((s, r) => s + r.size, 0)
		if (size < 20 * 1024 ** 2) continue
		const active = now - new Date(p.last).getTime() < config.activeDays * DAY
		groups.push({
			id: `p:${p.name}`,
			section: 'projects',
			title: p.name,
			note: active
				? 'Activo: lo vas a volver a compilar pronto.'
				: 'Sin cambios recientes.',
			safety:
				'Sólo carpetas que la compilación vuelve a crear, junto a su archivo de proyecto (pubspec.yaml, .csproj, package.json…). Tu código, .env y llaves no se tocan.',
			color: 'build',
			active,
			actions: p.regen.map(r => ({
				id: `r:${r.path}`,
				group: `p:${p.name}`,
				kind: 'delete' as const,
				label: r.path.replace(`${p.path}/`, ''),
				path: r.path,
				size: r.size,
				back: r.back,
				checked: !active,
			})),
			size,
		})
	}
	return groups
}

export const findActions = (plan: PlanGroup[], ids: string[]) => {
	const all = new Map(plan.flatMap(g => g.actions).map(a => [a.id, a]))
	return ids.map(id => {
		const a = all.get(id)
		if (!a) throw new Error(`Acción desconocida: ${id}. Vuelve a escanear.`)
		return a
	})
}
