import { createInterface } from 'node:readline'

import { apply } from '../core/apply.ts'
import { loadConfig } from '../core/config.ts'
import { buildPlan, findActions } from '../core/plan.ts'
import { stopProcess } from '../core/processes.ts'
import { moveProject } from '../core/project_ops.ts'
import { lastScan, type Scan, scan, scanLive } from '../core/scan.ts'

type Json = Record<string, unknown>

const GB = 1024 ** 3
const gb = (n: number) => `${(n / GB).toFixed(1)} GB`

const CONFIRM =
	'Acción que modifica el disco: describe al usuario qué va a pasar y pide su confirmación explícita antes de llamarla con confirmed=true.'

const TOOLS = [
	{
		name: 'disk_status',
		description:
			'Espacio libre de cada disco, qué ocupa el interno por tipo y cuánto se puede recuperar. Usa el último escaneo.',
		inputSchema: { type: 'object', properties: {} },
	},
	{
		name: 'rescan',
		description: 'Vuelve a escanear la Mac (tarda de 30 a 90 s).',
		inputSchema: { type: 'object', properties: {} },
	},
	{
		name: 'cleanup_plan',
		description:
			'Plan de limpieza: grupos, acciones con ID, tamaño, si vienen marcadas y cómo se recuperan.',
		inputSchema: {
			type: 'object',
			properties: { only_checked: { type: 'boolean' } },
		},
	},
	{
		name: 'apply_cleanup',
		description: `Ejecuta acciones del plan por ID. ${CONFIRM}`,
		inputSchema: {
			type: 'object',
			properties: {
				action_ids: { type: 'array', items: { type: 'string' } },
				confirmed: { type: 'boolean' },
			},
			required: ['action_ids', 'confirmed'],
		},
	},
	{
		name: 'open_ports',
		description:
			'Puertos escuchando ahora, con el proyecto que los abrió, memoria y PID; y daemons de compilación.',
		inputSchema: { type: 'object', properties: {} },
	},
	{
		name: 'stop_process',
		description: `Detiene un proceso del listado de puertos o daemons (SIGTERM y luego SIGKILL). ${CONFIRM}`,
		inputSchema: {
			type: 'object',
			properties: { pid: { type: 'number' }, confirmed: { type: 'boolean' } },
			required: ['pid', 'confirmed'],
		},
	},
	{
		name: 'projects',
		description:
			'Proyectos con tamaño, compilados recuperables, tecnologías, último cambio y estado de git.',
		inputSchema: { type: 'object', properties: {} },
	},
	{
		name: 'move_project',
		description: `Mueve un proyecto a un disco externo con copia verificada y deja un acceso en la ruta original. ${CONFIRM}`,
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string' },
				volume: { type: 'string' },
				link: { type: 'boolean' },
				confirmed: { type: 'boolean' },
			},
			required: ['name', 'volume', 'confirmed'],
		},
	},
	{
		name: 'secrets',
		description:
			'Inventario de llaves de firma, certificados y .env: sólo nombre, ruta, tipo y si están en git. Nunca devuelve su contenido.',
		inputSchema: { type: 'object', properties: {} },
	},
]

const current = async (): Promise<Scan> => lastScan() ?? scan(loadConfig())

const needsConfirm = (args: Json) => {
	if (args.confirmed !== true)
		throw new Error('Falta la confirmación del usuario (confirmed=true).')
}

const handlers: Record<string, (args: Json) => Promise<unknown>> = {
	disk_status: async () => {
		const s = await current()
		const plan = buildPlan(s, loadConfig())
		return {
			scannedAt: s.scannedAt,
			disks: s.disks.map(d => ({
				name: d.name,
				mount: d.mount,
				free: gb(d.free),
				size: gb(d.size),
				encrypted: d.encrypted,
			})),
			byType: Object.fromEntries(
				Object.entries(s.categories).map(([k, v]) => [k, gb(v)])
			),
			recoverable: gb(
				plan
					.flatMap(g => g.actions)
					.filter(a => a.checked)
					.reduce((a, b) => a + b.size, 0)
			),
		}
	},
	rescan: async () => {
		const s = await scan(loadConfig())
		return { scannedAt: s.scannedAt, seconds: Math.round(s.durationMs / 1000) }
	},
	cleanup_plan: async args =>
		buildPlan(await current(), loadConfig()).map(g => ({
			group: g.title,
			active: g.active,
			size: gb(g.size),
			actions: g.actions
				.filter(a => !args.only_checked || a.checked)
				.map(a => ({
					id: a.id,
					label: a.label,
					size: gb(a.size),
					kind: a.kind,
					checked: a.checked,
					back: a.back,
				})),
		})),
	apply_cleanup: async args => {
		needsConfirm(args)
		const config = loadConfig()
		const ids = Array.isArray(args.action_ids)
			? args.action_ids.map(String)
			: []
		const actions = findActions(buildPlan(await current(), config), ids)
		const errors: string[] = []
		const { ok, freed } = await apply(
			actions,
			config,
			e => e.type === 'error' && errors.push(`${e.id}: ${e.message}`)
		)
		return { ok, total: actions.length, freed: gb(freed), errors }
	},
	open_ports: async () => {
		const { ports, daemons } = await scanLive(loadConfig())
		return {
			ports: ports.map(p => ({
				port: p.port,
				pid: p.pid,
				project: p.project,
				cwd: p.cwd,
				memory: gb(p.mem),
				self: p.self,
			})),
			daemons: daemons.map(d => ({
				pid: d.pid,
				label: d.label,
				memory: gb(d.mem),
			})),
		}
	},
	stop_process: async args => {
		needsConfirm(args)
		const { ports, daemons } = await scanLive(loadConfig())
		return stopProcess(Number(args.pid), [
			...ports.filter(p => !p.self).map(p => p.pid),
			...daemons.map(d => d.pid),
		])
	},
	projects: async () => {
		const s = await current()
		return s.projects.map(p => ({
			name: p.name,
			path: p.path,
			size: gb(p.size),
			recoverable: gb(p.regen.reduce((a, r) => a + r.size, 0)),
			stacks: p.stacks,
			last: p.last.slice(0, 10),
			git: p.git,
		}))
	},
	move_project: async args => {
		needsConfirm(args)
		return {
			to: await moveProject(
				await current(),
				String(args.name),
				String(args.volume),
				args.link !== false
			),
		}
	},
	secrets: async () =>
		(await current()).secrets.map(s => ({
			project: s.project,
			path: s.path,
			kind: s.kind,
			tracked_in_git: s.tracked,
		})),
}

export const handle = async (msg: Json): Promise<Json | null> => {
	const id = msg.id
	const reply = (result: unknown) => ({ jsonrpc: '2.0', id, result })
	switch (msg.method) {
		case 'initialize': {
			const params = (msg.params ?? {}) as Json
			return reply({
				protocolVersion: params.protocolVersion ?? '2025-06-18',
				capabilities: { tools: {} },
				serverInfo: { name: 'bodega', version: '0.2.0' },
			})
		}
		case 'ping':
			return reply({})
		case 'tools/list':
			return reply({ tools: TOOLS })
		case 'tools/call': {
			const params = (msg.params ?? {}) as { name?: string; arguments?: Json }
			const fn = handlers[params.name ?? '']
			if (!fn)
				return {
					jsonrpc: '2.0',
					id,
					error: {
						code: -32602,
						message: `Herramienta desconocida: ${params.name}`,
					},
				}
			try {
				const result = await fn(params.arguments ?? {})
				return reply({
					content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
				})
			} catch (e) {
				return reply({
					content: [
						{ type: 'text', text: e instanceof Error ? e.message : String(e) },
					],
					isError: true,
				})
			}
		}
		default:
			return id === undefined
				? null
				: {
						jsonrpc: '2.0',
						id,
						error: {
							code: -32601,
							message: `Método no soportado: ${String(msg.method)}`,
						},
					}
	}
}

export const startMcp = () => {
	const rl = createInterface({ input: process.stdin })
	rl.on('line', async line => {
		if (!line.trim()) return
		let msg: Json
		try {
			msg = JSON.parse(line)
		} catch {
			process.stdout.write(
				`${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON inválido' } })}\n`
			)
			return
		}
		const out = await handle(msg)
		if (out) process.stdout.write(`${JSON.stringify(out)}\n`)
	})
}
