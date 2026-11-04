import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { DIR } from './config.ts'
import { run } from './exec.ts'
import { moveDir, restoreDir } from './move.ts'
import { expand, HOME, pretty } from './paths.ts'

export type RelocationDef = {
	id: string
	label: string
	path: string
	env?: string
}

export const RELOCATABLE: RelocationDef[] = [
	{
		id: 'android-avd',
		label: 'Emuladores de Android',
		path: '~/.android/avd',
		env: 'ANDROID_AVD_HOME',
	},
	{
		id: 'gradle-home',
		label: 'Gradle (cachés y wrappers)',
		path: '~/.gradle',
		env: 'GRADLE_USER_HOME',
	},
	{
		id: 'nuget-packages',
		label: 'Paquetes de NuGet',
		path: '~/.nuget/packages',
		env: 'NUGET_PACKAGES',
	},
	{
		id: 'pub-cache',
		label: 'Caché de pub (Dart y Flutter)',
		path: '~/.pub-cache',
		env: 'PUB_CACHE',
	},
	{
		id: 'xcode-archives',
		label: 'Archives de Xcode',
		path: '~/Library/Developer/Xcode/Archives',
	},
]

export type Relocation = {
	id: string
	from: string
	to: string
	env?: string
	at: string
}

const FILE = join(DIR, 'relocations.json')
const ZSHRC = join(HOME, '.zshrc')
const START = '# >>> bodega >>>'
const END = '# <<< bodega <<<'

export const listRelocations = (): Relocation[] => {
	try {
		return JSON.parse(readFileSync(FILE, 'utf8'))
	} catch {
		return []
	}
}

const save = (list: Relocation[]) =>
	writeFileSync(FILE, JSON.stringify(list, null, '\t'), { mode: 0o600 })

const writeShellBlock = (list: Relocation[]) => {
	const current = existsSync(ZSHRC) ? readFileSync(ZSHRC, 'utf8') : ''
	const rest = current
		.replace(new RegExp(`\\n?${START}[\\s\\S]*?${END}\\n?`), '\n')
		.replace(/\n+$/, '\n')
	const lines = list.filter(r => r.env).map(r => `export ${r.env}="${r.to}"`)
	const block = lines.length
		? `\n${START}\n# Rutas reubicadas por Bodega. Se administran desde la app.\n${lines.join('\n')}\n${END}\n`
		: ''
	writeFileSync(ZSHRC, `${rest}${block}`)
}

export const applyEnv = async () => {
	for (const r of listRelocations())
		if (r.env && existsSync(r.to))
			await run('launchctl', ['setenv', r.env, r.to])
}

export const relocate = async (id: string, external: string) => {
	const def = RELOCATABLE.find(d => d.id === id)
	if (!def) throw new Error('Reubicación desconocida')
	if (listRelocations().some(r => r.id === id))
		throw new Error('Ya está reubicada')
	const parent = join(external, 'Bodega/Reubicado')
	const to = await moveDir(expand(def.path), parent, { link: true })
	const list = [
		...listRelocations(),
		{ id, from: def.path, to, env: def.env, at: new Date().toISOString() },
	]
	save(list)
	writeShellBlock(list)
	if (def.env) await run('launchctl', ['setenv', def.env, to])
	return pretty(to)
}

export const restore = async (id: string) => {
	const r = listRelocations().find(x => x.id === id)
	if (!r) throw new Error('No está reubicada')
	if (!existsSync(r.to))
		throw new Error('Conecta el disco externo para regresarla')
	await restoreDir(expand(r.from), r.to)
	const list = listRelocations().filter(x => x.id !== id)
	save(list)
	writeShellBlock(list)
	if (r.env) await run('launchctl', ['unsetenv', r.env])
	return r.from
}
