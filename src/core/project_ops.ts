import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { DIR } from './config.ts'
import { record } from './history.ts'
import { moveDir, restoreDir } from './move.ts'
import { expand, pretty } from './paths.ts'
import type { Scan } from './scan.ts'

export type MovedProject = {
	name: string
	from: string
	to: string
	link: boolean
	at: string
}

const FILE = join(DIR, 'moves.json')

export const listMoves = (): MovedProject[] => {
	try {
		return JSON.parse(readFileSync(FILE, 'utf8'))
	} catch {
		return []
	}
}

const save = (list: MovedProject[]) =>
	writeFileSync(FILE, JSON.stringify(list, null, '\t'), { mode: 0o600 })

export const moveProject = async (
	scan: Scan,
	name: string,
	volume: string,
	link: boolean
) => {
	const project = scan.projects.find(p => p.name === name)
	if (!project) throw new Error('Proyecto desconocido; vuelve a escanear')
	if (!scan.disks.some(d => d.mount === volume && !d.internal))
		throw new Error('Ese disco no está conectado')
	const busy = scan.ports.filter(p => p.project === name)
	if (busy.length)
		throw new Error(
			`Detén primero lo que está abierto: puerto ${busy.map(b => b.port).join(', ')}`
		)
	const to = await moveDir(
		expand(project.path),
		join(volume, 'Bodega/Proyectos'),
		{ link }
	)
	save([
		...listMoves().filter(m => m.name !== name),
		{
			name,
			from: project.path,
			to: pretty(to),
			link,
			at: new Date().toISOString(),
		},
	])
	record('move', `${name} movido a ${volume.split('/').pop()}`, project.size, {
		from: project.path,
		to: pretty(to),
		link,
	})
	return pretty(to)
}

export const restoreProject = async (name: string) => {
	const m = listMoves().find(x => x.name === name)
	if (!m) throw new Error('Ese proyecto no fue movido por Bodega')
	if (!existsSync(expand(m.to)))
		throw new Error('Conecta el disco externo para regresarlo')
	await restoreDir(expand(m.from), expand(m.to))
	save(listMoves().filter(x => x.name !== name))
	record('move', `${name} regresó al disco interno`, 0, m)
	return m.from
}
