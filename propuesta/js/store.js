const data = await import('./data.local.js')
	.catch(() => import('./data.sample.js'))
	.then(m => m.default)

export const DATA = data

const GB = 1024 ** 3
const DAY = 864e5

export const fmt = {
	gb: n => (n >= GB * 10 ? `${Math.round(n / GB)} GB` : n >= GB ? `${(n / GB).toFixed(1)} GB` : n >= 1024 ** 2 ? `${Math.round(n / 1024 ** 2)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`),
	num: n => Math.round(n).toLocaleString('es-MX'),
	pct: n => `${Math.round(n * 100)} %`,
	date: s => new Date(`${s.slice(0, 10)}T12:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
	ago: s => {
		const days = Math.round((Date.now() - new Date(`${s.slice(0, 10)}T12:00`)) / DAY)
		return days <= 0 ? 'hoy' : days === 1 ? 'ayer' : days < 30 ? `hace ${days} días` : days < 365 ? (Math.round(days / 30) === 1 ? 'hace un mes' : `hace ${Math.round(days / 30)} meses`) : (Math.round(days / 365) === 1 ? 'hace un año' : `hace ${Math.round(days / 365)} años`)
	},
}

export const STACKS = {
	flutter: { label: 'Flutter', color: 'var(--sim)' },
	dotnet: { label: '.NET', color: 'var(--cache)' },
	node: { label: 'Node', color: 'var(--emu)' },
	otro: { label: 'Otro', color: 'var(--faint)' },
}

export const CATEGORIES = [
	{ id: 'build', label: 'Compilados', color: 'var(--build)', hint: 'build, bin, obj, .dart_tool, node_modules y DerivedData' },
	{ id: 'sim', label: 'Simuladores iOS', color: 'var(--sim)', hint: 'CoreSimulator e iOS DeviceSupport' },
	{ id: 'emu', label: 'Emuladores Android', color: 'var(--emu)', hint: 'AVDs en ~/.android' },
	{ id: 'cache', label: 'Cachés', color: 'var(--cache)', hint: 'npm, Gradle, NuGet, pub y Library/Caches' },
	{ id: 'code', label: 'Código', color: 'var(--ink-2)', hint: 'Tus proyectos sin compilados' },
]

export const ACTIVE_DAYS = 14

export const projects = data.projects
	.map(p => ({
		...p,
		regenSize: p.regen.reduce((s, r) => s + r.size, 0),
		ports: data.ports.filter(x => x.project === p.name),
		secrets: data.vault.filter(v => v.project === p.name),
		active: Date.now() - new Date(`${p.last}T12:00`) < ACTIVE_DAYS * DAY,
	}))
	.sort((a, b) => b.size - a.size)

const COMMANDS = {
	dart: { cmd: dir => `cd ${dir.replace(/\/(build|\.dart_tool)$/, '')} && flutter clean`, back: 'Vuelve con flutter run o flutter build.' },
	build: { cmd: dir => `mover ${dir} a la Papelera`, back: 'Lo vuelve a crear la siguiente compilación.' },
	dotnet: { cmd: dir => `dotnet clean y mover ${dir} a la Papelera`, back: 'Vuelve con dotnet build.' },
	node: { cmd: dir => `mover ${dir} a la Papelera`, back: 'Vuelve con npm ci, exacto al package-lock.' },
	pods: { cmd: dir => `mover ${dir} a la Papelera`, back: 'Vuelve con pod install.' },
	gradle: { cmd: dir => `mover ${dir} a la Papelera`, back: 'Lo regenera Gradle.' },
}

const kindOf = r => (r.kind === 'build' && /\.dart_tool$|\/build$/.test(r.path) && !/ios\/build$/.test(r.path) ? 'dart' : r.kind)

export const buildPlan = () => {
	const e = data.extra
	const kingston = Boolean(data.disks.kingston)
	const compiled = projects
			.filter(p => p.regenSize > 50 * 1024 ** 2)
			.map(p => ({
				id: `p:${p.name}`,
				group: 'Compilados',
				color: 'var(--build)',
				title: p.name,
				note: p.active ? `Activo ${fmt.ago(p.last)}: lo vas a volver a compilar pronto.` : `Sin cambios ${fmt.ago(p.last)}.`,
				checked: !p.active,
				safety: 'Sólo carpetas que la compilación vuelve a crear. El código, .env y llaves de firma no se tocan.',
				items: p.regen.map(r => ({ label: r.path.replace(`~/Developer/${p.name}/`, ''), size: r.size, cmd: COMMANDS[kindOf(r)].cmd(r.path), back: COMMANDS[kindOf(r)].back })),
			}))
	return [
		{
			id: 'xcode',
			group: 'Xcode',
			color: 'var(--sim)',
			title: 'Xcode',
			note: 'DerivedData y soporte de dispositivos viejos.',
			checked: true,
			safety: 'Xcode los reconstruye: DerivedData al compilar y DeviceSupport al conectar un iPhone. Los Archives (tus builds firmados) no entran aquí.',
			items: [
				{ label: 'DerivedData', size: e.derived, cmd: 'mover ~/Library/Developer/Xcode/DerivedData a la Papelera', back: 'Se reconstruye al compilar.' },
				{ label: 'iOS DeviceSupport', size: e.devicesupport, cmd: 'mover las versiones de iOS que ya no usas a la Papelera', back: 'Se descarga al conectar el iPhone.' },
			],
		},
		{
			id: 'sim',
			group: 'Simuladores',
			color: 'var(--sim)',
			title: 'Simuladores de iOS',
			note: 'Datos de simuladores que no abres hace más de 30 días.',
			checked: false,
			safety: 'Borra el contenido de esos simuladores (apps instaladas y datos de prueba), no el runtime de iOS.',
			items: [{ label: 'Simuladores sin uso en 30 días', size: e.simdevices * 0.6, cmd: 'xcrun simctl erase <ids sin uso>', back: 'Se recrean vacíos al usarlos.' }],
		},
		{
			id: 'emu',
			group: 'Emuladores',
			color: 'var(--emu)',
			title: 'Emuladores de Android',
			note: kingston ? 'Moverlos al Kingston, no borrarlos.' : 'Conecta el Kingston para moverlos.',
			checked: kingston,
			move: true,
			safety: 'Se mueven a /Volumes/KINGSTON/Android/avd y se fija ANDROID_AVD_HOME. Sin el Kingston conectado, Android Studio no los ve.',
			items: [{ label: '~/.android/avd', size: e.avd, cmd: 'mover a /Volumes/KINGSTON/Android/avd y export ANDROID_AVD_HOME', back: 'Se regresan con un clic.' }],
		},
		{
			id: 'cache',
			group: 'Cachés',
			color: 'var(--cache)',
			title: 'Cachés de paquetes',
			note: 'Se vuelven a descargar cuando hagan falta.',
			checked: true,
			safety: 'Con los comandos oficiales de cada herramienta. La primera compilación después tarda más porque descarga de nuevo.',
			items: [
				{ label: 'Gradle', size: e.gradle, cmd: 'gradle --stop y mover ~/.gradle/caches a la Papelera', back: 'Se descarga al compilar Android.' },
				{ label: 'npm', size: e.npm, cmd: 'npm cache clean --force', back: 'Se descarga con npm ci.' },
				{ label: 'NuGet', size: e.nuget, cmd: 'dotnet nuget locals all --clear', back: 'Se descarga con dotnet restore.' },
				{ label: 'pub (Flutter)', size: e.pub, cmd: 'flutter pub cache clean', back: 'Se descarga con flutter pub get.' },
			],
		},
		...compiled,
	].map(g => ({ ...g, size: g.items.reduce((s, i) => s + i.size, 0) }))
}

export const recoverable = () => buildPlan().filter(g => g.checked).reduce((s, g) => s + g.size, 0)

export const alerts = () => {
	const out = []
	const i = data.disks.internal
	if (i.free / i.size < 0.15) out.push({ tone: 'bad', title: `Quedan ${fmt.gb(i.free)} libres en el disco interno`, text: 'Debajo de 15 % macOS se pone lento y Xcode falla al compilar.', to: '#/limpieza', action: 'Ver plan' })
	const keys = data.vault.filter(v => v.kind === 'firma')
	if (keys.length) out.push({ tone: 'bad', title: `${keys.length} llaves de firma sin respaldo`, text: 'Si se pierde una, ya no puedes publicar actualizaciones de esa app en Play Store.', to: '#/boveda', action: 'Respaldar' })
	if (data.disks.kingston) out.push({ tone: 'warn', title: 'El Kingston no está cifrado', text: 'Antes de guardar respaldos o la bóveda, cífralo desde Finder (clic derecho › Cifrar).', to: '#/discos', action: 'Ver disco' })
	const mine = data.ports.filter(p => p.project)
	if (mine.length > 3) out.push({ tone: 'warn', title: `${mine.length} servidores de tus proyectos siguen abiertos`, text: 'Ocupan puertos y memoria aunque no los estés usando.', to: '#/procesos', action: 'Revisar' })
	return out
}
