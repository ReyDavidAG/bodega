import { readdir, rename, stat } from 'node:fs/promises'
import { mkdir } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import { HOME, pretty } from './paths.ts'
import { exists, sizeOf } from './size.ts'

export type DeskKind =
	| 'captura'
	| 'nota'
	| 'pdf'
	| 'imagen'
	| 'instalador'
	| 'comprimido'
	| 'carpeta'
	| 'otro'

export type DeskItem = {
	folder: 'Desktop' | 'Downloads'
	name: string
	kind: DeskKind
	size: number
	mtime: string
}

export const classify = (name: string, isDir: boolean): DeskKind => {
	if (isDir) return 'carpeta'
	const ext = extname(name).toLowerCase()
	if (/^(screenshot|captura de pantalla|screen shot)/i.test(name))
		return 'captura'
	if (['.md', '.txt', '.rtf'].includes(ext)) return 'nota'
	if (ext === '.pdf') return 'pdf'
	if (['.png', '.jpg', '.jpeg', '.heic', '.gif', '.webp'].includes(ext))
		return 'imagen'
	if (['.dmg', '.pkg', '.app'].includes(ext)) return 'instalador'
	if (['.zip', '.tar', '.gz', '.rar', '.7z'].includes(ext)) return 'comprimido'
	return 'otro'
}

export const listDesk = async (): Promise<DeskItem[]> => {
	const out: DeskItem[] = []
	for (const folder of ['Desktop', 'Downloads'] as const) {
		const base = join(HOME, folder)
		let entries
		try {
			entries = await readdir(base, { withFileTypes: true })
		} catch {
			continue
		}
		for (const e of entries) {
			if (e.name.startsWith('.')) continue
			const full = join(base, e.name)
			const info = await stat(full)
			out.push({
				folder,
				name: e.name,
				kind: classify(e.name, e.isDirectory()),
				size: e.isDirectory() ? await sizeOf(full) : info.size,
				mtime: info.mtime.toISOString(),
			})
		}
	}
	return out.sort((a, b) => b.mtime.localeCompare(a.mtime))
}

const month = (iso: string) => iso.slice(0, 7)

export const destinationFor = (item: DeskItem, external: string | null) => {
	const m = month(item.mtime)
	const archive = external
		? join(external, 'Bodega/Archivo', m)
		: join(HOME, 'Documents/Archivo', m)
	return (
		{
			captura: join(HOME, 'Pictures/Capturas', m),
			imagen: join(HOME, 'Pictures/Escritorio', m),
			nota: join(HOME, 'Documents/Notas'),
			pdf: join(HOME, 'Documents/PDF'),
			instalador: archive,
			comprimido: archive,
			carpeta: archive,
			otro: archive,
		} satisfies Record<DeskKind, string>
	)[item.kind]
}

const unique = async (dir: string, name: string) => {
	const ext = extname(name)
	const base = basename(name, ext)
	let candidate = join(dir, name)
	for (let i = 2; await exists(candidate); i++)
		candidate = join(dir, `${base} (${i})${ext}`)
	return candidate
}

export const moveDeskItem = async (item: DeskItem, external: string | null) => {
	const from = join(HOME, item.folder, item.name)
	const dir = destinationFor(item, external)
	await mkdir(dir, { recursive: true })
	const to = await unique(dir, item.name)
	try {
		await rename(from, to)
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code !== 'EXDEV') throw e
		const { copyVerified } = await import('./move.ts')
		await copyVerified(from, to)
		const { trash } = await import('./trash.ts')
		await trash(from)
	}
	return pretty(to)
}
