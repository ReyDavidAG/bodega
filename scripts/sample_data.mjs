import { writeFileSync } from 'node:fs'

const GB = 1024 ** 3
const MB = 1024 ** 2
const day = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10)
const regen = (base, list) => list.map(([path, kind, gb]) => ({ path: `~/Developer/${base}/${path}`, kind, size: Math.round(gb * GB) }))

const projects = [
	['shop-mobile', ['flutter'], 9.1, 3, [['build', 'build', 5.2], ['ios/build', 'build', 2.1], ['.dart_tool', 'dart', 0.9]]],
	['payments-sdk', ['flutter'], 7.2, 95, [['example/build', 'build', 4.4], ['example/ios/build', 'build', 2.2]]],
	['delivery-app', ['flutter', 'node'], 6.1, 40, [['app/build', 'build', 3.1], ['web/node_modules', 'node', 1.4], ['app/.dart_tool', 'dart', 0.8]]],
	['inventory-api', ['dotnet'], 3.4, 1, [['src/Api/bin', 'dotnet', 1.3], ['src/Api/obj', 'dotnet', 0.4], ['tests/bin', 'dotnet', 1.1]]],
	['admin-portal', ['dotnet', 'node'], 2.9, 0, [['Server/bin', 'dotnet', 1.2], ['client/node_modules', 'node', 0.9]]],
	['field-scanner', ['flutter'], 2.6, 160, [['build', 'build', 1.6], ['.dart_tool', 'dart', 0.6]]],
	['landing-site', ['node'], 0.9, 12, [['node_modules', 'node', 0.7], ['dist', 'node', 0.05]]],
	['data-tools', ['otro'], 0.2, 300, []],
]
	.map(([name, stacks, gb, ago, dirs]) => ({ name, stacks, size: Math.round(gb * GB), last: day(ago), regen: regen(name, dirs) }))

const port = (port, cmd, project, sub, mem) => ({ port, addr: `127.0.0.1:${port}`, cmd, pid: 40000 + port, command: cmd, cwd: project ? `~/Developer/${project}/${sub}` : '/', project, mem: mem * MB, since: new Date().toString() })

const vaultFile = (project, path, kind, tracked = false) => ({ project, path: `~/Developer/${project}/${path}`, name: path.split('/').pop(), kind, size: 2048, mtime: day(30), tracked })

const data = {
	sample: true,
	scannedAt: new Date().toISOString(),
	disks: { internal: { size: 460 * GB, used: 338 * GB, free: 122 * GB }, kingston: { size: 954 * GB, used: 0.2 * GB, free: 953.8 * GB } },
	categories: { build: 26 * GB, sim: 58 * GB, emu: 41 * GB, cache: 34 * GB, code: 4 * GB },
	extra: { derived: 9 * GB, devicesupport: 13 * GB, archives: 4 * GB, simdevices: 44 * GB, avd: 41 * GB, gradle: 15 * GB, npm: 6 * GB, nuget: 4 * GB, pub: 2 * GB, libcaches: 7 * GB, androidsdk: 14 * GB },
	projects,
	ports: [port(5173, 'node', 'admin-portal', 'client', 120), port(7001, 'dotnet', 'inventory-api', 'src/Api', 180), port(3000, 'node', 'landing-site', '', 90), port(8080, 'Python', null, '', 12)],
	daemons: [{ pid: 51001, label: 'Gradle daemon', mem: 1.4 * GB }, { pid: 51002, label: 'Compilador de .NET', mem: 0.3 * GB }],
	desk: [
		...[1, 2, 3, 4].map(i => ({ folder: 'Desktop', name: `Captura ${i}.png`, kind: 'captura', size: 2 * MB, mtime: day(i * 7) })),
		{ folder: 'Desktop', name: 'notas-release.md', kind: 'nota', size: 8192, mtime: day(5) },
		{ folder: 'Desktop', name: 'manual.pdf', kind: 'pdf', size: 3 * MB, mtime: day(60) },
		{ folder: 'Downloads', name: 'instalador.dmg', kind: 'otro', size: 400 * MB, mtime: day(90) },
	],
	vault: [
		vaultFile('shop-mobile', 'android/app/upload-keystore.jks', 'firma', true),
		vaultFile('shop-mobile', 'android/key.properties', 'llaves'),
		vaultFile('delivery-app', 'app/android/app/release.keystore', 'firma'),
		vaultFile('delivery-app', 'app/android/app/google-services.json', 'firebase'),
		vaultFile('inventory-api', 'src/Api/appsettings.Development.json', 'config'),
		vaultFile('admin-portal', 'client/.env', 'env'),
		vaultFile('landing-site', '.env', 'env'),
	],
	history: [{ at: new Date().toISOString(), what: 'Ejemplo: flutter clean en 3 proyectos', freed: 12 * GB }],
}

writeFileSync(new URL('../propuesta/js/data.sample.js', import.meta.url), `export default ${JSON.stringify(data)}\n`)
