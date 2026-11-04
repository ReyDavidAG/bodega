import { timingSafeEqual } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

import { apply } from '../core/apply.ts'
import {
	type Config,
	loadConfig,
	PORT,
	saveConfig,
	token,
} from '../core/config.ts'
import { moveDeskItem } from '../core/desktop.ts'
import { run } from '../core/exec.ts'
import { events, record } from '../core/history.ts'
import { expand } from '../core/paths.ts'
import { buildPlan, findActions } from '../core/plan.ts'
import { stopProcess } from '../core/processes.ts'
import { listMoves, moveProject, restoreProject } from '../core/project_ops.ts'
import {
	applyEnv,
	listRelocations,
	RELOCATABLE,
	relocate,
	restore,
} from '../core/relocate.ts'
import { lastScan, type Scan, scan, scanLive } from '../core/scan.ts'
import { backupVault, vaultImage } from '../core/vault.ts'
import { demoScan } from './demo.ts'
import { HttpError, json, readJson, stream } from './http.ts'

const DEMO = process.env.BODEGA_DEMO === '1'
const DEV = process.env.BODEGA_DEV === '1'
const WEB = fileURLToPath(new URL('../../web/dist/', import.meta.url))
const TOKEN = token()
const HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`])

let config: Config = loadConfig()
let current: Scan | null = DEMO ? demoScan() : lastScan()
let scanning: Promise<Scan> | null = null
let progress: { step: string; done: number; total: number } | null = null

const plan = () => (current ? buildPlan(current, config) : [])

const SECURITY = {
	'Content-Security-Policy':
		"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'no-referrer',
	'X-Frame-Options': 'DENY',
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Cross-Origin-Resource-Policy': 'same-origin',
}

const sameToken = (given: string) => {
	const a = Buffer.from(given)
	const b = Buffer.from(TOKEN)
	return a.length === b.length && timingSafeEqual(a, b)
}

const guard = (req: IncomingMessage) => {
	if (!DEV && !HOSTS.has(req.headers.host ?? ''))
		throw new HttpError(421, 'Host no permitido')
	const origin = req.headers.origin
	if (origin && !DEV && !HOSTS.has(origin.replace(/^https?:\/\//, '')))
		throw new HttpError(403, 'Origen no permitido')
	if (
		req.url?.startsWith('/api/') &&
		!sameToken(String(req.headers['x-bodega-token'] ?? ''))
	)
		throw new HttpError(401, 'Falta el token de Bodega')
}

const MIME: Record<string, string> = {
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.svg': 'image/svg+xml',
	'.woff2': 'font/woff2',
	'.png': 'image/png',
	'.json': 'application/json',
}

const serveStatic = (req: IncomingMessage, res: ServerResponse) => {
	const path = normalize(
		decodeURIComponent((req.url ?? '/').split('?')[0])
	).replace(/^(\.\.[/\\])+/, '')
	const file = join(WEB, path)
	if (
		file.startsWith(WEB) &&
		path !== '/' &&
		existsSync(file) &&
		statSync(file).isFile()
	) {
		res.writeHead(200, {
			'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
			'Cache-Control': path.startsWith('/assets/')
				? 'public, max-age=31536000, immutable'
				: 'no-cache',
		})
		return res.end(readFileSync(file))
	}
	const index = join(WEB, 'index.html')
	if (!existsSync(index)) {
		res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
		return res.end('Falta compilar el dashboard: npm run build')
	}
	res.writeHead(200, {
		'Content-Type': 'text/html; charset=utf-8',
		'Cache-Control': 'no-store',
	})
	res.end(
		readFileSync(index, 'utf8').replace(
			'</head>',
			`<meta name="bodega-token" content="${TOKEN}"><meta name="bodega-demo" content="${DEMO ? 1 : 0}"></head>`
		)
	)
}

const state = () => ({
	demo: DEMO,
	config,
	scan: current,
	plan: plan(),
	progress,
	moves: listMoves(),
	relocations: listRelocations(),
	relocatable: RELOCATABLE,
	vaultImage: config.external ? existsSync(vaultImage(config.external)) : false,
})

const afterApply = (ids: string[]) => {
	if (!current) return
	const gone = new Set(ids)
	current = {
		...current,
		projects: current.projects.map(p => ({
			...p,
			regen: p.regen.filter(r => !gone.has(`r:${r.path}`)),
		})),
		globals: current.globals.filter(g => !gone.has(`g:${g.id}`)),
	}
}

const requireExternal = () => {
	if (!config.external || !existsSync(config.external))
		throw new HttpError(409, 'Conecta y elige un disco externo en Ajustes')
	return config.external
}

const simulate = async (ms = 900) => new Promise(r => setTimeout(r, ms))

type Handler = (
	req: IncomingMessage,
	res: ServerResponse,
	body: Record<string, unknown>
) => Promise<unknown>

const routes: Record<string, Handler> = {
	'GET /api/state': async () => state(),

	'GET /api/live': async () =>
		DEMO
			? { ports: current?.ports ?? [], daemons: current?.daemons ?? [] }
			: scanLive(config),

	'GET /api/history': async () => events(),

	'POST /api/scan': async (_req, res) => {
		const send = stream(res)
		if (DEMO) {
			for (let i = 1; i <= 5; i++) {
				send({ type: 'progress', step: `Paso ${i}`, done: i, total: 5 })
				await simulate(300)
			}
			current = demoScan()
		} else {
			scanning ??= scan(config, (step, done, total) => {
				progress = { step, done, total }
				send({ type: 'progress', step, done, total })
			}).finally(() => {
				scanning = null
				progress = null
			})
			current = await scanning
		}
		send({ type: 'end' })
		res.end()
		return undefined
	},

	'POST /api/apply': async (_req, res, body) => {
		const ids = Array.isArray(body.ids) ? body.ids.map(String) : []
		if (!ids.length) throw new HttpError(400, 'No hay acciones seleccionadas')
		const actions = findActions(plan(), ids)
		const send = stream(res)
		if (DEMO) {
			for (const [index, a] of actions.entries()) {
				send({
					type: 'start',
					id: a.id,
					label: a.label,
					index,
					total: actions.length,
				})
				await simulate(250)
				send({ type: 'done', id: a.id, index, total: actions.length })
			}
			send({
				type: 'end',
				freed: actions.reduce((s, a) => s + a.size, 0),
				total: actions.length,
			})
		} else await apply(actions, config, send, { dryRun: body.dryRun === true })
		if (body.dryRun !== true) afterApply(ids)
		res.end()
		return undefined
	},

	'POST /api/processes/stop': async (_req, _res, body) => {
		const pid = Number(body.pid)
		if (DEMO) {
			if (current)
				current = {
					...current,
					ports: current.ports.filter(p => p.pid !== pid),
					daemons: current.daemons.filter(d => d.pid !== pid),
				}
			return { stopped: true, forced: false }
		}
		const live = await scanLive(config)
		const daemon = live.daemons.find(d => d.pid === pid)
		if (daemon?.stop) {
			await run(daemon.stop.bin, daemon.stop.args, { timeout: 60_000 })
			return { stopped: true, forced: false }
		}
		const allowed = [
			...live.ports.filter(p => !p.self).map(p => p.pid),
			...live.daemons.map(d => d.pid),
		]
		const result = await stopProcess(pid, allowed)
		const port = live.ports.find(p => p.pid === pid)
		record(
			'process',
			port
				? `Puerto ${port.port} liberado${port.project ? ` (${port.project})` : ''}`
				: `Proceso ${pid} detenido`
		)
		return result
	},

	'POST /api/projects/move': async (_req, _res, body) => {
		if (!current) throw new HttpError(409, 'Escanea primero')
		const volume = String(body.volume ?? '')
		if (DEMO)
			return simulate().then(() => ({
				to: `${volume}/Bodega/Proyectos/${body.name}`,
			}))
		const to = await moveProject(
			current,
			String(body.name),
			volume,
			body.link !== false
		)
		return { to }
	},

	'POST /api/projects/restore': async (_req, _res, body) =>
		DEMO
			? { to: '~/Developer' }
			: { to: await restoreProject(String(body.name)) },

	'POST /api/projects/reveal': async (_req, _res, body) => {
		const p = current?.projects.find(x => x.name === body.name)
		if (!p) throw new HttpError(404, 'Proyecto desconocido')
		if (!DEMO) await run('open', ['-R', expand(p.path)])
		return { ok: true }
	},

	'POST /api/relocations': async (_req, _res, body) => {
		const id = String(body.id)
		if (!RELOCATABLE.some(r => r.id === id))
			throw new HttpError(400, 'Reubicación desconocida')
		if (DEMO)
			return simulate().then(() => ({
				to: `/Volumes/EXTERNO/Bodega/Reubicado/${id}`,
			}))
		const to = await relocate(id, requireExternal())
		record(
			'relocate',
			`${RELOCATABLE.find(r => r.id === id)?.label} al disco externo`,
			0,
			{ id, to }
		)
		return { to }
	},

	'POST /api/relocations/restore': async (_req, _res, body) => {
		if (DEMO) return { to: '~' }
		const id = String(body.id)
		const to = await restore(id)
		record(
			'relocate',
			`${RELOCATABLE.find(r => r.id === id)?.label} regresó al disco interno`
		)
		return { to }
	},

	'POST /api/desk/organize': async (_req, _res, body) => {
		const wanted = Array.isArray(body.items) ? body.items.map(String) : []
		const items = (current?.desk ?? []).filter(d =>
			wanted.includes(`${d.folder}/${d.name}`)
		)
		if (!items.length) throw new HttpError(400, 'Nada que ordenar')
		const moved: string[] = []
		for (const item of items)
			moved.push(
				DEMO
					? item.name
					: await moveDeskItem(
							item,
							config.external && existsSync(config.external)
								? config.external
								: null
						)
			)
		if (current)
			current = {
				...current,
				desk: current.desk.filter(d => !items.includes(d)),
			}
		if (!DEMO)
			record('desk', `Escritorio ordenado: ${items.length} archivos`, 0, moved)
		return { moved: moved.length }
	},

	'POST /api/vault/backup': async (_req, _res, body) => {
		const password = String(body.password ?? '')
		if (DEMO)
			return simulate(1500).then(() => ({
				files: current?.secrets.length ?? 0,
				image: 'EXTERNO/Bodega/Boveda.sparsebundle',
			}))
		if (!current) throw new HttpError(409, 'Escanea primero')
		const result = await backupVault(
			current.secrets,
			requireExternal(),
			password,
			config.roots
		)
		record('vault', `Bóveda respaldada: ${result.files} archivos`, 0, {
			image: result.image,
			folder: result.folder,
		})
		return result
	},

	'PUT /api/config': async (_req, _res, body) => {
		const roots = Array.isArray(body.roots)
			? body.roots
					.map(String)
					.filter(r => r.startsWith('~/') || r.startsWith('/'))
			: config.roots
		const activeDays = Number(body.activeDays)
		const external =
			body.external === null
				? null
				: typeof body.external === 'string' &&
					  body.external.startsWith('/Volumes/')
					? body.external
					: config.external
		config = {
			roots: roots.length ? roots : config.roots,
			activeDays:
				Number.isInteger(activeDays) && activeDays > 0 && activeDays < 366
					? activeDays
					: config.activeDays,
			external,
		}
		if (!DEMO) saveConfig(config)
		return state()
	},
}

export const startServer = async (port = PORT) => {
	if (!DEMO) await applyEnv()
	if (!DEMO && !config.external && current) {
		const ext = current.disks.find(d => !d.internal && d.fs === 'APFS')
		if (ext) {
			config = { ...config, external: ext.mount }
			saveConfig(config)
		}
	}
	const server = createServer(async (req, res) => {
		for (const [k, v] of Object.entries(SECURITY)) res.setHeader(k, v)
		try {
			guard(req)
			const path = (req.url ?? '/').split('?')[0]
			const handler = routes[`${req.method} ${path}`]
			if (!path.startsWith('/api/')) return serveStatic(req, res)
			if (!handler) throw new HttpError(404, 'Ruta desconocida')
			const body =
				req.method === 'GET' ? {} : await readJson<Record<string, unknown>>(req)
			const result = await handler(req, res, body)
			if (!res.headersSent) json(res, 200, result)
		} catch (e) {
			const status = e instanceof HttpError ? e.status : 500
			const message = e instanceof Error ? e.message : 'Error inesperado'
			if (!res.headersSent) json(res, status, { error: message })
			else res.end(`${JSON.stringify({ type: 'error', message })}\n`)
		}
	})
	await new Promise<void>((resolve, reject) => {
		server.once('error', reject)
		server.listen(port, '127.0.0.1', resolve)
	})
	return server
}
