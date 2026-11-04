import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { type Config, DIR } from './config.ts'
import { type DeskItem, listDesk } from './desktop.ts'
import { type Disk, listDisks } from './disks.ts'
import { pool } from './exec.ts'
import { devTotals, type GlobalItem, scanGlobals } from './globals.ts'
import { type Daemon, listDaemons, listPorts, type Port } from './processes.ts'
import { listProjects, type Project, scanProject } from './projects.ts'
import { listRelocations, type Relocation } from './relocate.ts'
import { listSecrets, type Secret } from './vault.ts'

export type Scan = {
	scannedAt: string
	durationMs: number
	disks: Disk[]
	projects: Project[]
	globals: GlobalItem[]
	dev: Awaited<ReturnType<typeof devTotals>>
	ports: Port[]
	daemons: Daemon[]
	desk: DeskItem[]
	secrets: Secret[]
	relocations: Relocation[]
	categories: {
		build: number
		sim: number
		emu: number
		cache: number
		code: number
	}
}

export type Progress = (step: string, done: number, total: number) => void

const FILE = join(DIR, 'scan.json')

export const lastScan = (): Scan | null => {
	try {
		return JSON.parse(readFileSync(FILE, 'utf8'))
	} catch {
		return null
	}
}

export const scanLive = async (config: Config) => {
	const [ports, daemons] = await Promise.all([
		listPorts(config.roots),
		listDaemons(),
	])
	return { ports, daemons }
}

export const scan = async (
	config: Config,
	progress: Progress = () => {}
): Promise<Scan> => {
	const started = Date.now()
	const dirs = await listProjects(config.roots)
	const total = dirs.length + 5
	let done = 0
	const tick = (step: string) => progress(step, ++done, total)

	const disks = await listDisks()
	tick('Discos')
	const projects = await pool(dirs, 3, async d => {
		const p = await scanProject(d.path, d.root)
		tick(p.name)
		return p
	})
	const globals = await scanGlobals()
	tick('Xcode, simuladores y cachés')
	const dev = await devTotals()
	const { ports, daemons } = await scanLive(config)
	tick('Puertos y procesos')
	const [desk, secrets] = await Promise.all([
		listDesk(),
		listSecrets(config.roots),
	])
	tick('Escritorio y secretos')

	const regen = projects.reduce(
		(s, p) => s + p.regen.reduce((a, r) => a + r.size, 0),
		0
	)
	const cat = (c: string) =>
		globals.filter(g => g.category === c).reduce((s, g) => s + g.size, 0)
	const result: Scan = {
		scannedAt: new Date().toISOString(),
		durationMs: Date.now() - started,
		disks,
		projects: projects.sort((a, b) => b.size - a.size),
		globals,
		dev,
		ports,
		daemons,
		desk,
		secrets,
		relocations: listRelocations(),
		categories: {
			build: regen + cat('build'),
			sim: dev.simulators,
			emu: dev.android,
			cache: cat('cache'),
			code: projects.reduce((s, p) => s + p.size, 0) - regen,
		},
	}
	writeFileSync(FILE, JSON.stringify(result), { mode: 0o600 })
	tick('Listo')
	return result
}
