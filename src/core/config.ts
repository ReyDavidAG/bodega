import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { HOME } from './paths.ts'

export const DIR = process.env.BODEGA_HOME ?? join(HOME, '.bodega')
export const PORT = Number(process.env.BODEGA_PORT ?? 2633)

export type Config = {
	roots: string[]
	activeDays: number
	external: string | null
	alertFreeGB: number
}

const DEFAULTS: Config = {
	roots: ['~/Developer'],
	activeDays: 14,
	external: null,
	alertFreeGB: 20,
}

export const validAlert = (n: unknown): n is number =>
	Number.isInteger(n) && Number(n) >= 0 && Number(n) <= 1000

const ensure = () => mkdirSync(DIR, { recursive: true, mode: 0o700 })

export const loadConfig = (): Config => {
	ensure()
	const file = join(DIR, 'config.json')
	if (!existsSync(file)) return { ...DEFAULTS }
	try {
		const raw = JSON.parse(readFileSync(file, 'utf8'))
		return {
			roots:
				Array.isArray(raw.roots) &&
				raw.roots.every((r: unknown) => typeof r === 'string')
					? raw.roots
					: DEFAULTS.roots,
			activeDays:
				Number.isInteger(raw.activeDays) &&
				raw.activeDays > 0 &&
				raw.activeDays < 366
					? raw.activeDays
					: DEFAULTS.activeDays,
			external: typeof raw.external === 'string' ? raw.external : null,
			alertFreeGB: validAlert(raw.alertFreeGB)
				? raw.alertFreeGB
				: DEFAULTS.alertFreeGB,
		}
	} catch {
		return { ...DEFAULTS }
	}
}

export const saveConfig = (config: Config) => {
	ensure()
	writeFileSync(join(DIR, 'config.json'), JSON.stringify(config, null, '\t'), {
		mode: 0o600,
	})
}

export const token = () => {
	ensure()
	const file = join(DIR, 'token')
	if (!existsSync(file))
		writeFileSync(file, randomBytes(24).toString('hex'), { mode: 0o600 })
	return readFileSync(file, 'utf8').trim()
}
