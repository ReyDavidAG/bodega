import { realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'

export const HOME = homedir()

export const expand = (p: string) =>
	p === '~' ? HOME : p.startsWith('~/') ? join(HOME, p.slice(2)) : p

export const pretty = (p: string) =>
	p === HOME ? '~' : p.startsWith(HOME + sep) ? `~${p.slice(HOME.length)}` : p

export const isInside = (child: string, parent: string) => {
	const rel = relative(parent, child)
	return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
}

const FORBIDDEN = [
	'/',
	HOME,
	join(HOME, 'Library'),
	join(HOME, 'Documents'),
	join(HOME, 'Desktop'),
	join(HOME, 'Downloads'),
	join(HOME, 'Developer'),
	'/Applications',
	'/System',
	'/Users',
	'/Volumes',
]

export class UnsafePathError extends Error {}

export const assertSafe = (target: string) => {
	if (!isAbsolute(target)) throw new UnsafePathError(`Ruta relativa: ${target}`)
	const resolved = resolve(target)
	let real = resolved
	try {
		real = realpathSync(resolved)
	} catch {
		real = resolved
	}
	for (const p of [resolved, real]) {
		if (FORBIDDEN.includes(p))
			throw new UnsafePathError(`Ruta protegida: ${pretty(p)}`)
		const inHome = isInside(p, HOME)
		const inVolume = p.startsWith('/Volumes/') && p.split('/').length > 3
		if (!inHome && !inVolume)
			throw new UnsafePathError(`Fuera de la carpeta de usuario: ${p}`)
	}
	return resolved
}
