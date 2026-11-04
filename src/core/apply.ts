import { basename, dirname } from 'node:path'
import { readdirSync } from 'node:fs'

import type { Config } from './config.ts'
import { listDisks } from './disks.ts'
import { RULES } from './ecosystems.ts'
import { run } from './exec.ts'
import { record } from './history.ts'
import type { Action } from './plan.ts'
import { expand } from './paths.ts'
import { relocate } from './relocate.ts'
import { removeRegenerable } from './trash.ts'

export type ApplyEvent = {
	type: 'start' | 'done' | 'error' | 'end'
	id?: string
	label?: string
	message?: string
	freed?: number
	index?: number
	total?: number
}

const freeBytes = async () =>
	(await listDisks()).find(d => d.internal)?.free ?? 0

const stillRegenerable = (path: string) => {
	const name = basename(path)
	let siblings: string[] = []
	try {
		siblings = readdirSync(dirname(path))
	} catch {
		return false
	}
	return RULES.some(
		r => r.dir === name && siblings.some(s => r.markers.test(s))
	)
}

const execute = async (a: Action, config: Config) => {
	const path = expand(a.path)
	if (a.kind === 'command' && a.command) {
		const r = await run(a.command.bin, a.command.args, { timeout: 900_000 })
		if (r.code !== 0)
			throw new Error(
				(r.stderr || r.stdout).trim().split('\n').pop() ||
					`Salió con código ${r.code}`
			)
		return
	}
	if (a.kind === 'relocate') {
		if (!config.external) throw new Error('Elige un disco externo en Ajustes')
		await relocate(a.id.replace(/^g:/, ''), config.external)
		return
	}
	if (a.id.startsWith('r:') && !stillRegenerable(path))
		throw new Error(
			'Ya no parece una carpeta de compilación; vuelve a escanear'
		)
	await removeRegenerable(path)
}

export const apply = async (
	actions: Action[],
	config: Config,
	emit: (e: ApplyEvent) => void,
	{ dryRun = false } = {}
) => {
	const before = await freeBytes()
	let ok = 0
	for (const [index, a] of actions.entries()) {
		emit({
			type: 'start',
			id: a.id,
			label: a.label,
			index,
			total: actions.length,
		})
		try {
			if (!dryRun) await execute(a, config)
			ok++
			emit({ type: 'done', id: a.id, index, total: actions.length })
		} catch (e) {
			emit({
				type: 'error',
				id: a.id,
				message: e instanceof Error ? e.message : String(e),
				index,
				total: actions.length,
			})
		}
	}
	const freed = dryRun
		? actions.reduce((s, a) => s + a.size, 0)
		: Math.max(0, (await freeBytes()) - before)
	if (!dryRun)
		record(
			'clean',
			`Plan aplicado: ${ok} de ${actions.length} acciones`,
			freed,
			actions.map(a => ({ id: a.id, label: a.label, kind: a.kind }))
		)
	emit({ type: 'end', freed, total: actions.length })
	return { ok, freed }
}
