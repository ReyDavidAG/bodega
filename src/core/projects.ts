import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { type Stack, SKIP, ruleFor, stacksIn } from './ecosystems.ts'
import { run } from './exec.ts'
import { expand, pretty } from './paths.ts'
import { sizeOf, sizesOf } from './size.ts'

export type Regen = {
	path: string
	stack: Stack
	dir: string
	size: number
	back: string
}

export type Project = {
	name: string
	path: string
	root: string
	stacks: Stack[]
	size: number
	regen: Regen[]
	last: string
	git: { repo: boolean; dirty: number; remote: boolean }
}

const MAX_DEPTH = 6

const walk = async (
	dir: string,
	depth: number,
	stacks: Set<Stack>,
	regen: Omit<Regen, 'size'>[]
) => {
	if (depth > MAX_DEPTH) return
	let entries
	try {
		entries = await readdir(dir, { withFileTypes: true })
	} catch {
		return
	}
	const names = entries.map(e => e.name)
	stacksIn(names).forEach(s => stacks.add(s))
	for (const e of entries) {
		if (!e.isDirectory() || e.isSymbolicLink()) continue
		const rule = ruleFor(e.name, names)
		if (rule) {
			regen.push({
				path: join(dir, e.name),
				stack: rule.stack,
				dir: e.name,
				back: rule.back,
			})
			continue
		}
		if (SKIP.has(e.name) || (e.name.startsWith('.') && e.name !== '.github'))
			continue
		await walk(join(dir, e.name), depth + 1, stacks, regen)
	}
}

const gitInfo = async (path: string) => {
	const inside = await run(
		'git',
		['-C', path, 'rev-parse', '--is-inside-work-tree'],
		{ timeout: 10_000 }
	)
	if (inside.code !== 0)
		return { repo: false, dirty: 0, remote: false, last: null }
	const [status, remote, log] = await Promise.all([
		run('git', ['-C', path, 'status', '--porcelain'], { timeout: 20_000 }),
		run('git', ['-C', path, 'remote'], { timeout: 10_000 }),
		run('git', ['-C', path, 'log', '-1', '--format=%cI'], { timeout: 10_000 }),
	])
	return {
		repo: true,
		dirty: status.stdout.split('\n').filter(Boolean).length,
		remote: Boolean(remote.stdout.trim()),
		last: log.stdout.trim() || null,
	}
}

export const scanProject = async (
	path: string,
	root: string
): Promise<Project> => {
	const stacks = new Set<Stack>()
	const found: Omit<Regen, 'size'>[] = []
	await walk(path, 0, stacks, found)
	const [size, sizes, git, info] = await Promise.all([
		sizeOf(path),
		sizesOf(
			found.map(r => r.path),
			4
		),
		gitInfo(path),
		stat(path),
	])
	const regen = found
		.map((r, i) => ({ ...r, path: pretty(r.path), size: sizes[i] }))
		.filter(r => r.size > 0)
		.sort((a, b) => b.size - a.size)
	return {
		name: path.split('/').pop() ?? path,
		path: pretty(path),
		root: pretty(root),
		stacks: [...stacks],
		size,
		regen,
		last: git.last ?? info.mtime.toISOString(),
		git: { repo: git.repo, dirty: git.dirty, remote: git.remote },
	}
}

export const listProjects = async (roots: string[]) => {
	const dirs: { path: string; root: string }[] = []
	for (const r of roots) {
		const root = expand(r)
		try {
			for (const e of await readdir(root, { withFileTypes: true }))
				if (e.isDirectory() && !e.name.startsWith('.'))
					dirs.push({ path: join(root, e.name), root })
		} catch {
			continue
		}
	}
	return dirs
}
