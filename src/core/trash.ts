import { lstat, rm } from 'node:fs/promises'

import { run } from './exec.ts'
import { assertSafe } from './paths.ts'

export const trash = async (path: string) => {
	const real = assertSafe(path)
	const r = await run('/usr/bin/trash', [real], { timeout: 600_000 })
	if (r.code === 0) return
	const f = await run(
		'osascript',
		[
			'-e',
			`tell application "Finder" to delete (POSIX file ${JSON.stringify(real)} as alias)`,
		],
		{ timeout: 600_000 }
	)
	if (f.code !== 0)
		throw new Error(
			`No se pudo mandar a la Papelera: ${(r.stderr || f.stderr).trim()}`
		)
}

export const removeRegenerable = async (path: string) => {
	const target = assertSafe(path)
	const info = await lstat(target).catch(() => null)
	if (!info) return
	if (info.isSymbolicLink())
		throw new Error(
			'Es un acceso a otro disco; Bodega no borra a través de accesos'
		)
	await rm(target, { recursive: true, force: true, maxRetries: 2 })
}
