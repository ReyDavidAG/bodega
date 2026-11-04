import { userInfo } from 'node:os'

import { run } from './exec.ts'
import { expand, isInside, pretty } from './paths.ts'

export type Port = {
	port: number
	address: string
	pid: number
	command: string
	cwd: string
	project: string | null
	mem: number
	since: string
	self: boolean
}

export type Daemon = {
	pid: number
	label: string
	mem: number
	stop: { bin: string; args: string[] } | null
}

export const parseLsof = (out: string) => {
	const rows: { pid: number; command: string; address: string }[] = []
	let pid = 0
	let command = ''
	for (const line of out.split('\n')) {
		const tag = line[0]
		const value = line.slice(1)
		if (tag === 'p') pid = Number(value)
		else if (tag === 'c') command = value
		else if (tag === 'n' && pid) rows.push({ pid, command, address: value })
	}
	const seen = new Set<string>()
	return rows.filter(r => {
		const key = `${r.pid}:${r.address}`
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})
}

const psInfo = async (pids: number[]) => {
	if (!pids.length)
		return new Map<
			number,
			{ mem: number; since: string; uid: number; args: string }
		>()
	const r = await run('ps', [
		'-o',
		'pid=,uid=,rss=,lstart=,args=',
		'-p',
		pids.join(','),
	])
	const map = new Map<
		number,
		{ mem: number; since: string; uid: number; args: string }
	>()
	for (const line of r.stdout.split('\n')) {
		const m = line
			.trim()
			.match(
				/^(\d+)\s+(\d+)\s+(\d+)\s+(\w{3}\s+\w{3}\s+\d+\s+[\d:]+\s+\d{4})\s+(.*)$/
			)
		if (m)
			map.set(Number(m[1]), {
				uid: Number(m[2]),
				mem: Number(m[3]) * 1024,
				since: new Date(m[4]).toISOString(),
				args: m[5],
			})
	}
	return map
}

const cwds = async (pids: number[]) => {
	const map = new Map<number, string>()
	if (!pids.length) return map
	const r = await run('lsof', ['-a', '-d', 'cwd', '-Fpn', '-p', pids.join(',')])
	let pid = 0
	for (const line of r.stdout.split('\n')) {
		if (line[0] === 'p') pid = Number(line.slice(1))
		else if (line[0] === 'n' && pid) map.set(pid, line.slice(1))
	}
	return map
}

export const listPorts = async (roots: string[]): Promise<Port[]> => {
	const r = await run('lsof', [
		'-a',
		'-nP',
		'-iTCP',
		'-sTCP:LISTEN',
		'-u',
		String(userInfo().uid),
		'-Fpcn',
	])
	const rows = parseLsof(r.stdout)
	const pids = [...new Set(rows.map(x => x.pid))]
	const [info, dirs] = await Promise.all([psInfo(pids), cwds(pids)])
	const absRoots = roots.map(expand)
	const byPort = new Map<number, Port>()
	for (const row of rows) {
		const port = Number(row.address.split(':').pop())
		if (!Number.isInteger(port) || byPort.has(port)) continue
		const cwd = dirs.get(row.pid) ?? ''
		const root = absRoots.find(root => isInside(cwd, root))
		byPort.set(port, {
			port,
			address: row.address,
			pid: row.pid,
			command: (info.get(row.pid)?.args ?? row.command)
				.slice(0, 200)
				.replaceAll(process.env.HOME ?? '~', '~'),
			cwd: pretty(cwd),
			project: root ? (cwd.slice(root.length + 1).split('/')[0] ?? null) : null,
			mem: info.get(row.pid)?.mem ?? 0,
			since: info.get(row.pid)?.since ?? '',
			self: row.pid === process.pid,
		})
	}
	return [...byPort.values()].sort((a, b) => a.port - b.port)
}

const DAEMONS: {
	pattern: RegExp
	label: string
	stop: { bin: string; args: string[] } | null
}[] = [
	{ pattern: /GradleDaemon/, label: 'Gradle daemon', stop: null },
	{
		pattern: /kotlin-daemon|KotlinCompileDaemon/,
		label: 'Kotlin daemon',
		stop: null,
	},
	{
		pattern: /VBCSCompiler|MSBuild\.dll.*nodeReuse/,
		label: 'Servidor de compilación de .NET',
		stop: { bin: 'dotnet', args: ['build-server', 'shutdown'] },
	},
	{
		pattern: /qemu-system|emulator64/,
		label: 'Emulador de Android',
		stop: null,
	},
	{
		pattern: /Simulator\.app\/Contents\/MacOS\/Simulator/,
		label: 'Simulador de iOS',
		stop: null,
	},
	{
		pattern: /analysis_server|language-server.*dart/,
		label: 'Analizador de Dart',
		stop: null,
	},
]

export const listDaemons = async (): Promise<Daemon[]> => {
	const r = await run('ps', ['-axo', 'pid=,uid=,rss=,args='])
	const uid = userInfo().uid
	const out: Daemon[] = []
	for (const line of r.stdout.split('\n')) {
		const m = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/)
		if (!m || Number(m[2]) !== uid) continue
		const def = DAEMONS.find(d => d.pattern.test(m[4]))
		if (def)
			out.push({
				pid: Number(m[1]),
				label: def.label,
				mem: Number(m[3]) * 1024,
				stop: def.stop,
			})
	}
	return out
}

const alive = (pid: number) => {
	try {
		process.kill(pid, 0)
		return true
	} catch {
		return false
	}
}

export const stopProcess = async (pid: number, allowed: number[]) => {
	if (!allowed.includes(pid))
		throw new Error('Ese proceso no está en el último listado')
	if (pid === process.pid || pid === process.ppid)
		throw new Error('Bodega no se detiene a sí misma')
	const info = (await psInfo([pid])).get(pid)
	if (!info) return { stopped: true, forced: false }
	if (info.uid !== userInfo().uid)
		throw new Error('El proceso es de otro usuario')
	process.kill(pid, 'SIGTERM')
	for (let i = 0; i < 25; i++) {
		await new Promise(r => setTimeout(r, 200))
		if (!alive(pid)) return { stopped: true, forced: false }
	}
	process.kill(pid, 'SIGKILL')
	return { stopped: true, forced: true }
}
