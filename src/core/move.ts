import { lstat, mkdir, readdir, rename, symlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { run } from './exec.ts'
import { assertSafe } from './paths.ts'
import { exists } from './size.ts'
import { trash } from './trash.ts'

const fingerprint = async (path: string) => {
	const [count, bytes] = await Promise.all([
		run('find', [path, '-type', 'f'], { timeout: 900_000 }),
		run('du', ['-sk', '-A', path], { timeout: 900_000 }),
	])
	return {
		files: count.stdout.split('\n').filter(Boolean).length,
		kb: Number(bytes.stdout.split(/\s/)[0] || 0),
	}
}

export const copyVerified = async (from: string, to: string) => {
	if (await exists(to)) throw new Error(`Ya existe ${to}`)
	await mkdir(dirname(to), { recursive: true })
	const r = await run('ditto', [from, to], { timeout: 3_600_000 })
	if (r.code !== 0) throw new Error(`La copia falló: ${r.stderr.trim()}`)
	const [a, b] = await Promise.all([fingerprint(from), fingerprint(to)])
	if (a.files !== b.files)
		throw new Error(
			`La copia no coincide: ${a.files} archivos contra ${b.files}`
		)
	if (Math.abs(a.kb - b.kb) > Math.max(64, a.kb * 0.01))
		throw new Error('La copia no coincide en tamaño')
	return b
}

export const moveDir = async (
	from: string,
	toParent: string,
	{ link = true } = {}
) => {
	const src = assertSafe(from)
	if ((await lstat(src)).isSymbolicLink())
		throw new Error(
			'La carpeta ya es un acceso directo; muévela desde su ubicación real'
		)
	const dest = join(toParent, src.split('/').pop() ?? 'carpeta')
	assertSafe(dest)
	try {
		await rename(src, dest)
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code !== 'EXDEV') throw e
		await copyVerified(src, dest)
		await trash(src)
	}
	if (link) await symlink(dest, src)
	return dest
}

export const restoreDir = async (linkPath: string, realPath: string) => {
	const link = assertSafe(linkPath)
	const info = await lstat(link).catch(() => null)
	if (info && !info.isSymbolicLink())
		throw new Error('En el lugar original ya hay una carpeta real')
	if (info) await run('rm', [link])
	try {
		await rename(realPath, link)
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code !== 'EXDEV') throw e
		await copyVerified(realPath, link)
		await trash(realPath)
	}
	return link
}

export const isEmptyDir = async (path: string) =>
	(await readdir(path).catch(() => [])).length === 0
