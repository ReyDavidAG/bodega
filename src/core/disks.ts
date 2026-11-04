import { readdir } from 'node:fs/promises'

import { run } from './exec.ts'

export type Disk = {
	id: string
	name: string
	mount: string
	size: number
	used: number
	free: number
	internal: boolean
	fs: string
	encrypted: boolean
	ownership: boolean
}

const plist = async (args: string[]) => {
	const r = await run('diskutil', [args[0], '-plist', ...args.slice(1)])
	if (r.code !== 0) return null
	const j = await run('plutil', ['-convert', 'json', '-o', '-', '-'], {
		input: r.stdout,
	})
	try {
		return JSON.parse(j.stdout) as Record<string, unknown>
	} catch {
		return null
	}
}

const df = async (mount: string) => {
	const r = await run('df', ['-k', mount])
	const parts = r.stdout.trim().split('\n').pop()?.split(/\s+/) ?? []
	return {
		size: Number(parts[1]) * 1024,
		used: Number(parts[2]) * 1024,
		free: Number(parts[3]) * 1024,
	}
}

const describe = async (mount: string, name: string): Promise<Disk | null> => {
	const info = await plist(['info', mount])
	if (!info) return null
	const space = await df(mount)
	const internal = info.Internal === true && mount === '/System/Volumes/Data'
	return {
		id: String(info.VolumeUUID ?? mount),
		name,
		mount,
		...space,
		internal,
		fs: String(info.FilesystemName ?? info.FilesystemType ?? ''),
		encrypted: info.FileVault === true || info.Encryption === true,
		ownership: info.GlobalPermissionsEnabled !== false,
	}
}

export const listDisks = async () => {
	const disks: Disk[] = []
	const main = await describe('/System/Volumes/Data', 'Macintosh HD')
	if (main) disks.push(main)
	let vols: string[] = []
	try {
		vols = await readdir('/Volumes')
	} catch {
		vols = []
	}
	for (const v of vols) {
		const mount = `/Volumes/${v}`
		const info = await plist(['info', mount])
		if (
			!info ||
			info.Internal === true ||
			info.VirtualOrPhysical === 'Virtual' ||
			String(info.MediaName ?? '').includes('Disk Image')
		)
			continue
		const d = await describe(mount, v)
		if (d) disks.push(d)
	}
	return disks
}

export const externalDisks = (disks: Disk[]) => disks.filter(d => !d.internal)
