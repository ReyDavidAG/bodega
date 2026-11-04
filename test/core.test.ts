import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { classify, destinationFor } from '../src/core/desktop.ts'
import { ruleFor, stacksIn } from '../src/core/ecosystems.ts'
import { assertSafe, HOME, isInside } from '../src/core/paths.ts'
import { parseLsof } from '../src/core/processes.ts'
import { scanProject } from '../src/core/projects.ts'
import { kindOf } from '../src/core/vault.ts'

test('sólo es regenerable si la carpeta padre tiene el archivo del ecosistema', () => {
	assert.equal(ruleFor('bin', ['Api.csproj', 'Program.cs'])?.stack, 'dotnet')
	assert.equal(ruleFor('bin', ['README.md', 'scripts']), null)
	assert.equal(ruleFor('node_modules', ['package.json'])?.stack, 'node')
	assert.equal(ruleFor('node_modules', ['index.js']), null)
	assert.equal(ruleFor('build', ['pubspec.yaml'])?.stack, 'flutter')
	assert.equal(ruleFor('build', ['docs']), null)
})

test('detecta los ecosistemas por sus archivos', () => {
	assert.deepEqual(stacksIn(['pubspec.yaml', 'package.json']).sort(), [
		'flutter',
		'node',
	])
	assert.deepEqual(stacksIn(['App.sln']), ['dotnet'])
})

test('rutas protegidas nunca pasan', () => {
	for (const p of [
		'/',
		HOME,
		join(HOME, 'Developer'),
		join(HOME, 'Library'),
		'/System/Library',
		'/usr/bin',
		'relative/path',
	])
		assert.throws(() => assertSafe(p))
	assert.equal(
		assertSafe(join(HOME, 'Developer/app/build')),
		join(HOME, 'Developer/app/build')
	)
	assert.ok(isInside('/a/b/c', '/a/b'))
	assert.ok(!isInside('/a/bc', '/a/b'))
	assert.ok(!isInside('/a/b', '/a/b'))
})

test('lee la salida de lsof por campos', () => {
	const rows = parseLsof(
		'p123\ncnode\nn*:5173\nn[::1]:5173\np456\ncdotnet\nn127.0.0.1:7001\n'
	)
	assert.deepEqual(
		rows.map(r => [r.pid, r.address]),
		[
			[123, '*:5173'],
			[123, '[::1]:5173'],
			[456, '127.0.0.1:7001'],
		]
	)
})

test('clasifica el escritorio y le da destino', () => {
	assert.equal(
		classify('Screenshot 2026-10-03 at 1.54.42 p.m..png', false),
		'captura'
	)
	assert.equal(classify('notas.md', false), 'nota')
	assert.equal(classify('Instalador.dmg', false), 'instalador')
	assert.match(
		destinationFor(
			{
				folder: 'Desktop',
				name: 'x.dmg',
				kind: 'instalador',
				size: 1,
				mtime: '2026-11-04T00:00:00Z',
			},
			'/Volumes/Ext'
		),
		/^\/Volumes\/Ext\/Bodega\/Archivo\/2026-11$/
	)
})

test('reconoce secretos y llaves de firma, no los ejemplos', () => {
	assert.equal(kindOf('upload-keystore.jks'), 'firma')
	assert.equal(kindOf('key.properties'), 'llaves')
	assert.equal(kindOf('.env'), 'env')
	assert.equal(kindOf('.env.production'), 'env')
	assert.equal(kindOf('.env.example'), null)
	assert.equal(kindOf('appsettings.Development.json'), 'config')
	assert.equal(kindOf('appsettings.json'), null)
})

test('escanea un proyecto y encuentra sólo sus compilados', async () => {
	const root = mkdtempSync(join(tmpdir(), 'bodega-'))
	const app = join(root, 'demo')
	for (const d of [
		'build',
		'.dart_tool',
		'api/bin',
		'api/obj',
		'web/node_modules/x',
		'docs/build',
	])
		mkdirSync(join(app, d), { recursive: true })
	writeFileSync(join(app, 'pubspec.yaml'), 'name: demo')
	writeFileSync(join(app, 'api/Api.csproj'), '<Project/>')
	writeFileSync(join(app, 'web/package.json'), '{}')
	writeFileSync(join(app, 'build/out.bin'), Buffer.alloc(8192))
	writeFileSync(join(app, 'docs/build/keep.md'), 'no es compilado')
	const p = await scanProject(app, root)
	assert.deepEqual(p.stacks.sort(), ['dotnet', 'flutter', 'node'])
	const dirs = p.regen.map(r => r.path.split('/demo/')[1]).sort()
	assert.ok(dirs.includes('build'))
	assert.ok(!dirs.includes('docs/build'))
})
