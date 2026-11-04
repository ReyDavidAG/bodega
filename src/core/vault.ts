import { createHash } from 'node:crypto'
import { createReadStream, existsSync } from 'node:fs'
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'

import { run } from './exec.ts'
import { expand, pretty } from './paths.ts'

export type SecretKind =
	| 'firma'
	| 'llaves'
	| 'firebase'
	| 'certificado'
	| 'licencia'
	| 'config'
	| 'env'

export type Secret = {
	project: string
	path: string
	name: string
	kind: SecretKind
	size: number
	mtime: string
	tracked: boolean
}

const KIND: [RegExp, SecretKind][] = [
	[/\.(jks|keystore|p12|p8|mobileprovision)$/, 'firma'],
	[/^key\.properties$/, 'llaves'],
	[/^(google-services\.json|GoogleService-Info\.plist)$/, 'firebase'],
	[/\.(pem|cer|crt)$/, 'certificado'],
	[/^license\.elic\.xml$/, 'licencia'],
	[/^appsettings\.(Development|Local)\.json$|^secrets\.json$/, 'config'],
	[/^\.env(\.(?!example$|sample$|template$)[\w.-]+)?$/, 'env'],
]

const SKIP = new Set([
	'node_modules',
	'build',
	'.dart_tool',
	'bin',
	'obj',
	'Pods',
	'.git',
	'target',
	'.gradle',
	'.venv',
	'DerivedData',
	'.next',
	'dist',
])

export const kindOf = (name: string): SecretKind | null =>
	KIND.find(([re]) => re.test(name))?.[1] ?? null

const walk = async (dir: string, depth: number, out: string[]) => {
	if (depth > 7) return
	let entries
	try {
		entries = await readdir(dir, { withFileTypes: true })
	} catch {
		return
	}
	for (const e of entries) {
		const full = join(dir, e.name)
		if (e.isDirectory()) {
			if (!SKIP.has(e.name) && !e.name.startsWith('.dotnet'))
				await walk(full, depth + 1, out)
		} else if (e.isFile() && kindOf(e.name)) out.push(full)
	}
}

const trackedIn = async (repo: string) => {
	const r = await run('git', ['-C', repo, 'ls-files', '-z'], {
		timeout: 30_000,
	})
	return r.code === 0
		? new Set(r.stdout.split('\0').map(f => join(repo, f)))
		: new Set<string>()
}

export const listSecrets = async (roots: string[]): Promise<Secret[]> => {
	const out: Secret[] = []
	for (const r of roots) {
		const root = expand(r)
		let projects
		try {
			projects = (await readdir(root, { withFileTypes: true })).filter(
				e => e.isDirectory() && !e.name.startsWith('.')
			)
		} catch {
			continue
		}
		for (const p of projects) {
			const base = join(root, p.name)
			const files: string[] = []
			await walk(base, 0, files)
			if (!files.length) continue
			const tracked = await trackedIn(base)
			for (const f of files) {
				const info = await stat(f)
				out.push({
					project: p.name,
					path: pretty(f),
					name: f.split('/').pop() ?? f,
					kind: kindOf(f.split('/').pop() ?? '') ?? 'env',
					size: info.size,
					mtime: info.mtime.toISOString(),
					tracked: tracked.has(f),
				})
			}
		}
	}
	return out
}

const sha256 = (file: string) =>
	new Promise<string>((resolve, reject) => {
		const h = createHash('sha256')
		createReadStream(file)
			.on('data', d => h.update(d))
			.on('end', () => resolve(h.digest('hex')))
			.on('error', reject)
	})

const IMAGE = 'Bodega/Boveda.sparsebundle'
const MOUNT = '/Volumes/BodegaBoveda'

export const vaultImage = (external: string) => join(external, IMAGE)

const attach = async (image: string, password: string) => {
	const r = await run(
		'hdiutil',
		['attach', image, '-stdinpass', '-mountpoint', MOUNT, '-nobrowse'],
		{ input: password, timeout: 120_000 }
	)
	if (r.code !== 0)
		throw new Error(
			r.stderr.includes('Authentication')
				? 'Contraseña incorrecta'
				: `No se pudo abrir la bóveda: ${r.stderr.trim()}`
		)
}

const create = async (image: string, password: string) => {
	if (password.length < 8)
		throw new Error('La contraseña debe tener al menos 8 caracteres')
	await mkdir(dirname(image), { recursive: true })
	const r = await run(
		'hdiutil',
		[
			'create',
			'-size',
			'2g',
			'-type',
			'SPARSEBUNDLE',
			'-fs',
			'APFS',
			'-encryption',
			'AES-256',
			'-stdinpass',
			'-volname',
			'BodegaBoveda',
			image,
		],
		{ input: password, timeout: 300_000 }
	)
	if (r.code !== 0)
		throw new Error(`No se pudo crear la bóveda: ${r.stderr.trim()}`)
}

export const backupVault = async (
	secrets: Secret[],
	external: string,
	password: string,
	roots: string[]
) => {
	const image = vaultImage(external)
	if (!existsSync(image)) await create(image, password)
	await attach(image, password)
	try {
		const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16)
		const dest = join(MOUNT, stamp)
		const manifest: { path: string; sha256: string; size: number }[] = []
		const absRoots = roots.map(expand)
		for (const s of secrets) {
			const from = expand(s.path)
			const root = absRoots.find(r => from.startsWith(r + '/')) ?? dirname(from)
			const to = join(dest, relative(root, from))
			await mkdir(dirname(to), { recursive: true })
			await copyFile(from, to)
			const [a, b] = await Promise.all([sha256(from), sha256(to)])
			if (a !== b) throw new Error(`La copia de ${s.name} no coincide`)
			manifest.push({ path: s.path, sha256: a, size: s.size })
		}
		await writeFile(
			join(dest, 'manifest.json'),
			JSON.stringify(
				{ at: new Date().toISOString(), files: manifest },
				null,
				'\t'
			)
		)
		return { files: manifest.length, image: pretty(image), folder: stamp }
	} finally {
		await run('hdiutil', ['detach', MOUNT, '-force'])
	}
}
