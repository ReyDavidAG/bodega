import { stat } from 'node:fs/promises'

import { pool, run } from './exec.ts'

export const sizeOf = async (path: string) => {
	const { code, stdout } = await run('du', ['-sk', path], { timeout: 300_000 })
	if (code !== 0 && !stdout) return 0
	return Number(stdout.split(/\s/)[0] || 0) * 1024
}

export const sizesOf = (paths: string[], concurrency = 6) =>
	pool(paths, concurrency, sizeOf)

export const exists = async (path: string) => {
	try {
		await stat(path)
		return true
	} catch {
		return false
	}
}

export const mtime = async (path: string) => {
	try {
		return (await stat(path)).mtime.toISOString()
	} catch {
		return null
	}
}
