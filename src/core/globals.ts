import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { run, which } from './exec.ts'
import { HOME, pretty } from './paths.ts'
import { exists, sizeOf } from './size.ts'

export type Category = 'build' | 'sim' | 'emu' | 'cache'

export type GlobalKind = 'delete' | 'command' | 'relocate'

export type GlobalItem = {
	id: string
	label: string
	category: Category
	path: string
	size: number
	kind: GlobalKind
	command?: { bin: string; args: string[] }
	env?: string
	safe: boolean
	note: string
	back: string
}

const L = join(HOME, 'Library')

const unavailableSimulators = async () => {
	const r = await run(
		'xcrun',
		['simctl', 'list', 'devices', 'unavailable', '-j'],
		{ timeout: 30_000 }
	)
	if (r.code !== 0) return 0
	try {
		const devices = Object.values(
			JSON.parse(r.stdout).devices as Record<string, { udid: string }[]>
		).flat()
		const sizes = await Promise.all(
			devices.map(d =>
				sizeOf(join(L, 'Developer/CoreSimulator/Devices', d.udid))
			)
		)
		return sizes.reduce((a, b) => a + b, 0)
	} catch {
		return 0
	}
}

type Def = Omit<GlobalItem, 'size' | 'path' | 'command'> & {
	path: string
	tool?: string
	toolPaths?: string[]
	args?: string[]
}

const DEFS: Def[] = [
	{
		id: 'xcode-derived',
		label: 'Xcode · DerivedData',
		category: 'build',
		path: join(L, 'Developer/Xcode/DerivedData'),
		kind: 'delete',
		safe: true,
		note: 'Compilaciones intermedias de Xcode.',
		back: 'Se reconstruye al compilar.',
	},
	{
		id: 'xcode-device-support',
		label: 'Xcode · iOS DeviceSupport',
		category: 'sim',
		path: join(L, 'Developer/Xcode/iOS DeviceSupport'),
		kind: 'delete',
		safe: true,
		note: 'Símbolos de cada versión de iOS que has conectado.',
		back: 'Se descarga al conectar el iPhone.',
	},
	{
		id: 'simulators-unavailable',
		label: 'Simuladores sin runtime',
		category: 'sim',
		path: join(L, 'Developer/CoreSimulator/Devices'),
		kind: 'command',
		tool: 'xcrun',
		args: ['simctl', 'delete', 'unavailable'],
		safe: true,
		note: 'Simuladores de versiones de iOS que ya no tienes instaladas.',
		back: 'No hacen falta: su runtime ya no existe.',
	},
	{
		id: 'android-avd',
		label: 'Emuladores de Android (AVD)',
		category: 'emu',
		path: join(HOME, '.android/avd'),
		kind: 'relocate',
		env: 'ANDROID_AVD_HOME',
		safe: true,
		note: 'Se mueven al disco externo, no se borran.',
		back: 'Se regresan con un clic.',
	},
	{
		id: 'gradle-caches',
		label: 'Gradle · cachés',
		category: 'cache',
		path: join(HOME, '.gradle/caches'),
		kind: 'delete',
		safe: true,
		note: 'Dependencias y transformaciones descargadas.',
		back: 'Se descarga al compilar Android.',
	},
	{
		id: 'npm-cache',
		label: 'npm · caché',
		category: 'cache',
		path: join(HOME, '.npm/_cacache'),
		kind: 'command',
		tool: 'npm',
		args: ['cache', 'clean', '--force'],
		safe: true,
		note: 'Paquetes descargados.',
		back: 'Se descarga con npm ci.',
	},
	{
		id: 'yarn-cache',
		label: 'Yarn · caché',
		category: 'cache',
		path: join(L, 'Caches/Yarn'),
		kind: 'command',
		tool: 'yarn',
		args: ['cache', 'clean'],
		safe: true,
		note: 'Paquetes descargados.',
		back: 'Se descarga con yarn install.',
	},
	{
		id: 'pnpm-store',
		label: 'pnpm · store',
		category: 'cache',
		path: join(L, 'pnpm/store'),
		kind: 'command',
		tool: 'pnpm',
		args: ['store', 'prune'],
		safe: true,
		note: 'Paquetes que ningún proyecto usa.',
		back: 'Se descarga con pnpm install.',
	},
	{
		id: 'nuget-cache',
		label: 'NuGet · paquetes',
		category: 'cache',
		path: join(HOME, '.nuget/packages'),
		kind: 'command',
		tool: 'dotnet',
		args: ['nuget', 'locals', 'all', '--clear'],
		safe: true,
		note: 'Paquetes de .NET descargados.',
		back: 'Se descarga con dotnet restore.',
	},
	{
		id: 'pub-cache',
		label: 'pub · caché de Dart y Flutter',
		category: 'cache',
		path: join(HOME, '.pub-cache'),
		kind: 'command',
		tool: 'dart',
		toolPaths: [
			join(HOME, 'flutter/bin/dart'),
			join(HOME, 'development/flutter/bin/dart'),
		],
		args: ['pub', 'cache', 'clean', '--force'],
		safe: true,
		note: 'Paquetes de Dart y Flutter.',
		back: 'Se descarga con flutter pub get.',
	},
	{
		id: 'cocoapods-cache',
		label: 'CocoaPods · caché',
		category: 'cache',
		path: join(L, 'Caches/CocoaPods'),
		kind: 'command',
		tool: 'pod',
		args: ['cache', 'clean', '--all'],
		safe: true,
		note: 'Pods descargados.',
		back: 'Se descarga con pod install.',
	},
	{
		id: 'homebrew-cache',
		label: 'Homebrew · descargas',
		category: 'cache',
		path: join(L, 'Caches/Homebrew'),
		kind: 'command',
		tool: 'brew',
		args: ['cleanup', '--prune=all'],
		safe: true,
		note: 'Instaladores viejos de Homebrew.',
		back: 'Se descarga si reinstalas.',
	},
	{
		id: 'xcode-archives',
		label: 'Xcode · Archives',
		category: 'build',
		path: join(L, 'Developer/Xcode/Archives'),
		kind: 'relocate',
		safe: false,
		note: 'Tus builds firmados para la tienda. Se mueven, nunca se borran.',
		back: 'Se regresan con un clic.',
	},
]

export const scanGlobals = async (): Promise<GlobalItem[]> => {
	const out: GlobalItem[] = []
	for (const d of DEFS) {
		if (!(await exists(d.path))) continue
		let command: GlobalItem['command']
		if (d.kind === 'command') {
			const bin = await which(d.tool ?? '', d.toolPaths)
			if (!bin) continue
			command = { bin, args: d.args ?? [] }
		}
		const size =
			d.id === 'simulators-unavailable'
				? await unavailableSimulators()
				: await sizeOf(d.path)
		if (size < 10 * 1024 ** 2) continue
		const { tool: _t, toolPaths: _p, args: _a, ...rest } = d
		out.push({ ...rest, path: pretty(d.path), size, command })
	}
	return out
}

export const devTotals = async () => {
	const [sim, emu, sdk] = await Promise.all([
		sizeOf(join(L, 'Developer/CoreSimulator')),
		sizeOf(join(HOME, '.android')),
		sizeOf(join(L, 'Android/sdk')),
	])
	let runtimes: string[] = []
	try {
		runtimes = await readdir('/Library/Developer/CoreSimulator/Volumes')
	} catch {
		runtimes = []
	}
	return {
		simulators: sim,
		android: emu,
		androidSdk: sdk,
		runtimes: runtimes.length,
	}
}
