import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { request } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'

const home = mkdtempSync(join(tmpdir(), 'bodega-home-'))
process.env.BODEGA_HOME = home
process.env.BODEGA_PORT = '26339'
process.env.BODEGA_DEMO = '1'

const { startServer } = await import('../src/server/server.ts')
const { handle } = await import('../src/mcp/server.ts')
const TOKEN = readFileSync(join(home, 'token'), 'utf8').trim()

let server: Awaited<ReturnType<typeof startServer>>
before(async () => (server = await startServer(26339)))
after(() => server.close())

const call = (
	path: string,
	{
		method = 'GET',
		headers = {},
		body,
	}: { method?: string; headers?: Record<string, string>; body?: unknown } = {}
) =>
	new Promise<{ status: number; text: string }>((resolve, reject) => {
		const req = request(
			{
				host: '127.0.0.1',
				port: 26339,
				path,
				method,
				headers: { host: 'localhost:26339', ...headers },
			},
			res => {
				let text = ''
				res.on('data', d => (text += d))
				res.on('end', () => resolve({ status: res.statusCode ?? 0, text }))
			}
		)
		req.on('error', reject)
		if (body) req.end(JSON.stringify(body))
		else req.end()
	})

const auth = { 'x-bodega-token': TOKEN, 'content-type': 'application/json' }

test('sin token la API responde 401', async () =>
	assert.equal((await call('/api/state')).status, 401))

test('con token responde el estado en modo demo', async () => {
	const r = await call('/api/state', { headers: auth })
	assert.equal(r.status, 200)
	assert.equal(JSON.parse(r.text).demo, true)
})

test('el resumen exige token', async () =>
	assert.equal((await call('/api/summary')).status, 401))

test('el resumen trae discos, recuperable y umbral sin escanear', async () => {
	const r = await call('/api/summary', { headers: auth })
	assert.equal(r.status, 200)
	const s = JSON.parse(r.text)
	assert.ok(s.disks.length >= 1)
	assert.ok(s.disks.some((d: { internal: boolean }) => d.internal))
	assert.ok(s.reclaimable > 0)
	assert.equal(s.alertFreeGB, 20)
	assert.equal(s.scanning, false)
})

test('el umbral se guarda y rechaza valores fuera de rango', async () => {
	const put = (alertFreeGB: unknown) =>
		call('/api/config', { method: 'PUT', headers: auth, body: { alertFreeGB } })
	await put(1000000)
	await put(-1)
	await put(2.5)
	assert.equal(JSON.parse((await put(40)).text).config.alertFreeGB, 40)
	assert.equal(JSON.parse((await put('x')).text).config.alertFreeGB, 40)
	const s = JSON.parse((await call('/api/summary', { headers: auth })).text)
	assert.equal(s.alertFreeGB, 40)
})

test('un Host ajeno se rechaza (DNS rebinding)', async () =>
	assert.equal(
		(
			await call('/api/state', {
				headers: { ...auth, host: 'evil.example:26339' },
			})
		).status,
		421
	))

test('un Origin ajeno se rechaza', async () =>
	assert.equal(
		(
			await call('/api/state', {
				headers: { ...auth, origin: 'https://evil.example' },
			})
		).status,
		403
	))

test('sólo se aplican IDs del plan, nunca rutas libres', async () => {
	const r = await call('/api/apply', {
		method: 'POST',
		headers: auth,
		body: { ids: ['r:/etc'] },
	})
	assert.ok(r.status >= 400)
})

test('no sirve archivos fuera del dashboard', async () => {
	const r = await call('/../../../etc/passwd')
	assert.ok(!r.text.includes('root:'))
})

test('el MCP se presenta y lista sus herramientas', async () => {
	const init = await handle({
		jsonrpc: '2.0',
		id: 1,
		method: 'initialize',
		params: { protocolVersion: '2025-06-18' },
	})
	assert.equal(
		(init?.result as { serverInfo: { name: string } }).serverInfo.name,
		'bodega'
	)
	const list = await handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
	assert.ok((list?.result as { tools: unknown[] }).tools.length >= 8)
})

test('el MCP no modifica nada sin confirmación', async () => {
	const r = await handle({
		jsonrpc: '2.0',
		id: 3,
		method: 'tools/call',
		params: {
			name: 'apply_cleanup',
			arguments: { action_ids: ['g:npm-cache'], confirmed: false },
		},
	})
	assert.equal((r?.result as { isError: boolean }).isError, true)
})
