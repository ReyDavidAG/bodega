import type { State } from '@/types/bodega_type'
import { gb } from '@/utils/format'

export type Alert = {
	tone: 'bad' | 'warn'
	title: string
	text: string
	to: string
	action: string
}

export const recoverable = (state: State) =>
	state.plan
		.flatMap(g => g.actions)
		.filter(a => a.checked)
		.reduce((s, a) => s + a.size, 0)

export const alerts = (state: State): Alert[] => {
	const scan = state.scan
	if (!scan) return []
	const out: Alert[] = []
	const internal = scan.disks.find(d => d.internal)
	if (internal && internal.free / internal.size < 0.15)
		out.push({
			tone: 'bad',
			title: `Quedan ${gb(internal.free)} libres en el disco interno`,
			text: 'Debajo de 15 % macOS se pone lento y Xcode falla al compilar.',
			to: '/clean',
			action: 'Ver plan',
		})
	const keys = scan.secrets.filter(s => s.kind === 'firma')
	if (keys.length && !state.vaultImage)
		out.push({
			tone: 'bad',
			title:
				keys.length === 1
					? 'Una llave de firma sin respaldo'
					: `${keys.length} llaves de firma sin respaldo`,
			text: 'Si se pierde una, ya no puedes publicar actualizaciones de esa app en Play Store o App Store.',
			to: '/vault',
			action: 'Respaldar',
		})
	const tracked = scan.secrets.filter(s => s.tracked)
	if (tracked.length)
		out.push({
			tone: 'warn',
			title:
				tracked.length === 1
					? 'Un secreto está versionado en git'
					: `${tracked.length} secretos están versionados en git`,
			text: 'Si el repo es público o se comparte, cualquiera los puede ver.',
			to: '/vault',
			action: 'Ver cuáles',
		})
	for (const d of scan.disks.filter(d => !d.internal)) {
		if (d.fs !== 'APFS')
			out.push({
				tone: 'warn',
				title: `${d.name} está en ${d.fs || 'otro formato'}`,
				text: 'Para trabajar en él conviene APFS: guarda permisos y es más seguro al desconectarlo.',
				to: '/disks',
				action: 'Ver disco',
			})
		else if (!d.encrypted)
			out.push({
				tone: 'warn',
				title: `${d.name} no está cifrado`,
				text: 'Antes de guardar respaldos o la bóveda, cífralo desde Finder (clic derecho › Cifrar).',
				to: '/disks',
				action: 'Ver disco',
			})
	}
	const mine = scan.ports.filter(p => p.project && !p.self)
	if (mine.length > 3)
		out.push({
			tone: 'warn',
			title: `${mine.length} servidores de tus proyectos siguen abiertos`,
			text: 'Ocupan puertos y memoria aunque no los estés usando.',
			to: '/processes',
			action: 'Revisar',
		})
	return out
}
