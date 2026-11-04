import { spawn } from 'node:child_process'

export type RunResult = { code: number; stdout: string; stderr: string }

export const run = (
	cmd: string,
	args: string[] = [],
	{
		cwd,
		timeout = 120_000,
		input,
	}: { cwd?: string; timeout?: number; input?: string } = {}
) =>
	new Promise<RunResult>(resolve => {
		const child = spawn(cmd, args, {
			cwd,
			env: { ...process.env, LC_ALL: 'C' },
		})
		let stdout = ''
		let stderr = ''
		const timer = setTimeout(() => child.kill('SIGKILL'), timeout)
		child.stdout.on('data', d => (stdout += d))
		child.stderr.on('data', d => (stderr += d))
		child.on('error', e => {
			clearTimeout(timer)
			resolve({ code: -1, stdout, stderr: String(e.message) })
		})
		child.on('close', code => {
			clearTimeout(timer)
			resolve({ code: code ?? -1, stdout, stderr })
		})
		if (input !== undefined) child.stdin.end(input)
		else child.stdin.end()
	})

export const pool = async <T, R>(
	items: T[],
	size: number,
	fn: (item: T) => Promise<R>
) => {
	const out: R[] = new Array(items.length)
	let next = 0
	const worker = async () => {
		while (next < items.length) {
			const i = next++
			out[i] = await fn(items[i])
		}
	}
	await Promise.all(
		Array.from({ length: Math.min(size, items.length) }, worker)
	)
	return out
}

const found = new Map<string, string | null>()

export const which = async (bin: string, extra: string[] = []) => {
	if (found.has(bin)) return found.get(bin) ?? null
	const { code, stdout } = await run('/bin/zsh', ['-lc', `command -v ${bin}`])
	let path: string | null =
		code === 0 ? (stdout.trim().split('\n').pop() ?? null) : null
	if (!path) {
		const { existsSync } = await import('node:fs')
		path = extra.find(p => existsSync(p)) ?? null
	}
	found.set(bin, path)
	return path
}
