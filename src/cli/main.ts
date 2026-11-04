import { createInterface } from 'node:readline/promises'

import { apply } from '../core/apply.ts'
import { loadConfig, PORT, token } from '../core/config.ts'
import { run } from '../core/exec.ts'
import { buildPlan } from '../core/plan.ts'
import { stopProcess } from '../core/processes.ts'
import { lastScan, scan, scanLive } from '../core/scan.ts'

import { gb, table } from './format.ts'

const [command = 'help', ...args] = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)

const confirm = async (question: string) => {
	if (flag('yes')) return true
	const rl = createInterface({ input: process.stdin, output: process.stdout })
	const answer = await rl.question(`${question} [s/N] `)
	rl.close()
	return /^s(i|í)?$/i.test(answer.trim())
}

const fresh = async () => {
	const config = loadConfig()
	if (!flag('fresh') && lastScan()) return lastScan()!
	process.stdout.write('Escaneando…')
	const s = await scan(config, (step, done, total) =>
		process.stdout.write(
			`\rEscaneando ${done}/${total} ${step.padEnd(40).slice(0, 40)}`
		)
	)
	process.stdout.write('\r'.padEnd(70) + '\r')
	return s
}

const HELP = `bodega · administra el espacio de tu Mac de desarrollo

  bodega open              abre el dashboard (http://localhost:${PORT})
  bodega serve             corre el servidor en primer plano
  bodega install           lo deja corriendo siempre (LaunchAgent)
  bodega uninstall         quita el LaunchAgent
  bodega status            espacio libre y cuánto se puede recuperar
  bodega plan [--fresh]    el plan de limpieza con sus IDs
  bodega apply [--yes]     aplica lo marcado por omisión en el plan
  bodega ports             puertos abiertos y qué proyecto los abrió
  bodega stop <puerto>     detiene el proceso de ese puerto
  bodega mcp               servidor MCP para Claude Code (stdio)
`

const commands: Record<string, () => Promise<void>> = {
	help: async () => console.log(HELP),
	serve: async () => {
		const { startServer } = await import('../server/server.ts')
		await startServer()
		console.log(`Bodega en http://localhost:${PORT}`)
	},
	open: async () => {
		token()
		await run('open', [`http://localhost:${PORT}`])
	},
	install: async () => {
		const { install } = await import('./launchd.ts')
		console.log(`Listo: ${await install()} queda siempre disponible.`)
	},
	uninstall: async () => {
		const { uninstall } = await import('./launchd.ts')
		await uninstall()
		console.log('LaunchAgent eliminado.')
	},
	status: async () => {
		const s = await fresh()
		const plan = buildPlan(s, loadConfig())
		const checked = plan.flatMap(g => g.actions).filter(a => a.checked)
		console.log(
			table([
				['Disco', 'Libre', 'Total'],
				...s.disks.map(d => [d.name, gb(d.free), gb(d.size)]),
			])
		)
		console.log(
			`\nRecuperable sin perder nada: ${gb(checked.reduce((a, b) => a + b.size, 0))} en ${checked.length} acciones (bodega plan).`
		)
	},
	plan: async () => {
		const plan = buildPlan(await fresh(), loadConfig())
		for (const g of plan) {
			console.log(`\n${g.title} · ${gb(g.size)}${g.active ? ' · activo' : ''}`)
			for (const a of g.actions)
				console.log(
					`  ${a.checked ? '[x]' : '[ ]'} ${gb(a.size).padStart(7)}  ${a.label}  (${a.id})`
				)
		}
	},
	apply: async () => {
		const config = loadConfig()
		const actions = buildPlan(await fresh(), config)
			.flatMap(g => g.actions)
			.filter(a => a.checked)
		if (!actions.length) return console.log('No hay nada marcado.')
		console.log(table(actions.map(a => [gb(a.size), a.label, a.kind])))
		if (
			!(await confirm(
				`¿Aplicar ${actions.length} acciones por ${gb(actions.reduce((s, a) => s + a.size, 0))}?`
			))
		)
			return
		const { freed } = await apply(actions, config, e => {
			if (e.type === 'start')
				process.stdout.write(`${e.index! + 1}/${e.total} ${e.label}… `)
			if (e.type === 'done') console.log('ok')
			if (e.type === 'error') console.log(`error: ${e.message}`)
		})
		console.log(`\nLiberado: ${gb(freed)}`)
	},
	ports: async () => {
		const { ports } = await scanLive(loadConfig())
		console.log(
			table([
				['Puerto', 'Proceso', 'PID', 'Proyecto', 'Memoria', 'Carpeta'],
				...ports.map(p => [
					String(p.port),
					(p.command.split(' ')[0].split('/').pop() ?? '').slice(0, 18),
					String(p.pid),
					p.project ?? '—',
					gb(p.mem),
					p.cwd,
				]),
			])
		)
	},
	stop: async () => {
		const port = Number(args[0])
		const { ports, daemons } = await scanLive(loadConfig())
		const target = ports.find(p => p.port === port)
		if (!target) return console.log(`Nada escucha en el puerto ${port}.`)
		if (
			!(await confirm(
				`¿Detener ${target.command} (pid ${target.pid})${target.project ? ` de ${target.project}` : ''}?`
			))
		)
			return
		const r = await stopProcess(target.pid, [
			...ports.filter(p => !p.self).map(p => p.pid),
			...daemons.map(d => d.pid),
		])
		console.log(r.forced ? 'Detenido a la fuerza.' : 'Detenido.')
	},
	mcp: async () => {
		const { startMcp } = await import('../mcp/server.ts')
		startMcp()
	},
}

const handler = commands[command] ?? commands.help
handler().catch(e => {
	console.error(e instanceof Error ? e.message : e)
	process.exit(1)
})
