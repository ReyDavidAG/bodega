import { existsSync } from 'node:fs'

import { type Config } from './config.ts'
import { df } from './disks.ts'
import { buildPlan } from './plan.ts'
import { type Scan } from './scan.ts'

const GB = 1024 ** 3
const DATA = '/System/Volumes/Data'

export type Summary = {
	disks: {
		name: string
		mount: string
		free: number
		size: number
		internal: boolean
	}[]
	scannedAt: string | null
	scanning: boolean
	reclaimable: number
	alertFreeGB: number
	low: boolean
}

export const isLow = (free: number, alertFreeGB: number) =>
	alertFreeGB > 0 && free < alertFreeGB * GB

export const summarize = async (
	scan: Scan | null,
	config: Config,
	{ scanning = false, live = true } = {}
): Promise<Summary> => {
	const known = scan?.disks ?? []
	const base = known.length
		? known
		: [{ name: 'Macintosh HD', mount: DATA, size: 0, free: 0, internal: true }]
	const disks = await Promise.all(
		base.map(async d => {
			if (live && !existsSync(d.mount)) return { ...d, size: 0 }
			const space = live ? await df(d.mount) : d
			return {
				name: d.name,
				mount: d.mount,
				free: Number.isFinite(space.free) ? space.free : d.free,
				size: Number.isFinite(space.size) ? space.size : d.size,
				internal: d.internal,
			}
		})
	)
	const reclaimable = scan
		? buildPlan(scan, config)
				.flatMap(g => g.actions)
				.filter(a => a.checked)
				.reduce((s, a) => s + a.size, 0)
		: 0
	const internal = disks.find(d => d.internal)
	return {
		disks: disks.filter(d => d.size > 0),
		scannedAt: scan?.scannedAt ?? null,
		scanning,
		reclaimable,
		alertFreeGB: config.alertFreeGB,
		low: internal ? isLow(internal.free, config.alertFreeGB) : false,
	}
}
