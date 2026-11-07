import { type FormEvent, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { Icon } from '@/components/ui/icons'
import { PageHead } from '@/components/ui/page_head'
import { Reveal } from '@/components/ui/reveal'
import { KEYS } from '@/constants/keys'
import { useBodega } from '@/hooks/data/use_bodega'
import { settingsSchema } from '@/schemas/settings.schema'
import { api } from '@/services/api'
import type { State } from '@/types/bodega_type'
import { toast } from '@/utils/toast'

const Form = ({ state }: { state: State }) => {
	const client = useQueryClient()
	const [roots, setRoots] = useState(state.config.roots.join('\n'))
	const [days, setDays] = useState(String(state.config.activeDays))
	const [alert, setAlert] = useState(String(state.config.alertFreeGB))
	const [external, setExternal] = useState(state.config.external)
	const [error, setError] = useState('')
	const save = async (e: FormEvent) => {
		e.preventDefault()
		const parsed = settingsSchema.safeParse({
			roots: roots
				.split('\n')
				.map(r => r.trim())
				.filter(Boolean),
			activeDays: days,
			alertFreeGB: alert,
		})
		if (!parsed.success)
			return setError(parsed.error.issues[0]?.message ?? 'Revisa los datos')
		setError('')
		try {
			client.setQueryData(
				KEYS.state,
				await api.put<State>('/api/config', { ...parsed.data, external })
			)
			toast(
				'Ajustes guardados · vuelve a escanear para aplicar las carpetas nuevas'
			)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'No se pudo guardar')
		}
	}
	const externals = state.scan?.disks.filter(d => !d.internal) ?? []
	return (
		<form className='card' onSubmit={save}>
			<header className='card-head'>
				<div>
					<h2>Qué revisa Bodega</h2>
				</div>
			</header>
			<div style={{ display: 'grid', gap: 14 }}>
				<label className='field-row'>
					<span>Carpetas de proyectos (una por línea)</span>
					<textarea
						className='input'
						style={{ height: 90, padding: 10, fontFamily: 'var(--mono)' }}
						value={roots}
						onChange={e => setRoots(e.target.value)}
					/>
				</label>
				<label className='field-row'>
					<span>Un proyecto es activo si cambió en los últimos (días)</span>
					<input
						className='input'
						style={{ width: 120 }}
						inputMode='numeric'
						value={days}
						onChange={e => setDays(e.target.value)}
					/>
				</label>
				<label className='field-row'>
					<span>
						Avisar cuando el disco interno tenga menos de (GB, 0 = nunca)
					</span>
					<input
						className='input'
						style={{ width: 120 }}
						inputMode='numeric'
						value={alert}
						onChange={e => setAlert(e.target.value)}
					/>
				</label>
				<div className='field-row'>
					<span>Disco externo para reubicar, archivar y la bóveda</span>
					<div className='toolbar'>
						{externals.map(d => (
							<button
								key={d.mount}
								type='button'
								className={`btn sm ${external === d.mount ? 'primary' : ''}`}
								onClick={() => setExternal(d.mount)}>
								{d.name}
							</button>
						))}
						<button
							type='button'
							className={`btn sm ${external === null ? 'primary' : ''}`}
							onClick={() => setExternal(null)}>
							Ninguno
						</button>
					</div>
				</div>
				{error && (
					<span className='error-text' role='alert'>
						{error}
					</span>
				)}
				<button
					className='btn primary'
					type='submit'
					style={{ justifySelf: 'start' }}>
					<Icon name='check' />
					Guardar
				</button>
			</div>
		</form>
	)
}

const SettingsPage = () => {
	const { data } = useBodega()
	if (!data) return <section className='page' aria-busy='true' />
	return (
		<section className='page'>
			<PageHead
				eyebrow='Ajustes'
				title='Ajustes'
				text={`Bodega vive en http://localhost:${data.port}. Todo se queda en esta Mac.`}
			/>
			<Form state={data} />
			<Reveal as='article' className='card'>
				<header className='card-head'>
					<div>
						<h2>Úsalo desde Claude Code</h2>
						<p className='cap'>
							Claude puede revisar el espacio, armar el plan y detener procesos;
							lo que modifica algo siempre te pide confirmación.
						</p>
					</div>
				</header>
				<code className='code-block'>{`claude mcp add bodega -- node "${data.cli}" mcp`}</code>
			</Reveal>
			<Reveal as='article' className='card'>
				<header className='card-head'>
					<div>
						<h2>Siempre disponible</h2>
						<p className='cap'>
							Un LaunchAgent lo arranca con tu sesión, así http://localhost:
							{data.port} siempre responde.
						</p>
					</div>
				</header>
				<code className='code-block'>{`node "${data.cli}" install     # instalar\nnode "${data.cli}" uninstall   # quitar`}</code>
			</Reveal>
		</section>
	)
}

export default SettingsPage
