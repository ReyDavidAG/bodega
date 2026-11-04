import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/ui/empty_state'
import { Icon } from '@/components/ui/icons'
import { PageHead } from '@/components/ui/page_head'
import { Reveal } from '@/components/ui/reveal'
import { Segment } from '@/components/ui/segment'
import { useAction, useBodega } from '@/hooks/data/use_bodega'
import { ago, gb } from '@/utils/format'

const KINDS: Record<string, { label: string; to: string }> = {
	captura: { label: 'Capturas', to: 'Imágenes/Capturas/<mes>' },
	imagen: { label: 'Imágenes', to: 'Imágenes/Escritorio/<mes>' },
	nota: { label: 'Notas', to: 'Documentos/Notas' },
	pdf: { label: 'PDF', to: 'Documentos/PDF' },
	instalador: { label: 'Instaladores', to: 'Archivo/<mes>' },
	comprimido: { label: 'Comprimidos', to: 'Archivo/<mes>' },
	carpeta: { label: 'Carpetas', to: 'Archivo/<mes>' },
	otro: { label: 'Otros', to: 'Archivo/<mes>' },
}

const DesktopPage = () => {
	const { data } = useBodega()
	const [folder, setFolder] = useState<'Desktop' | 'Downloads'>('Desktop')
	const [picked, setPicked] = useState<Set<string>>(new Set())
	const organize = useAction<{ items: string[] }>(
		'/api/desk/organize',
		d => `${String(d.moved)} archivos ordenados`
	)
	const files = useMemo(
		() => (data?.scan?.desk ?? []).filter(f => f.folder === folder),
		[data, folder]
	)
	const groups = Object.entries(KINDS)
		.map(([id, k]) => ({ id, ...k, files: files.filter(f => f.kind === id) }))
		.filter(g => g.files.length)
	const size = files
		.filter(f => picked.has(`${f.folder}/${f.name}`))
		.reduce((s, f) => s + f.size, 0)
	const toggle = (key: string, on: boolean) =>
		setPicked(p => {
			const n = new Set(p)
			if (on) n.add(key)
			else n.delete(key)
			return n
		})
	if (!data?.scan)
		return (
			<section className='page'>
				<EmptyState title='Escanea primero' />
			</section>
		)
	const archive = data.config.external
		? `${data.config.external.split('/').pop()}/Bodega/Archivo`
		: 'Documentos/Archivo'
	return (
		<section className='page'>
			<PageHead
				eyebrow='Escritorio'
				title='Ordenar escritorio y descargas'
				text={`Cada tipo tiene su lugar. Nada se borra: se mueve a su carpeta; lo que no tiene lugar va a ${archive}.`}
				side={
					<Segment
						label='Carpeta'
						options={[
							{ id: 'Desktop', label: 'Escritorio' },
							{ id: 'Downloads', label: 'Descargas' },
						]}
						value={folder}
						onChange={setFolder}
					/>
				}
			/>
			{groups.length ? (
				groups.map(g => (
					<Reveal key={g.id} as='article' className='card'>
						<header className='card-head'>
							<div>
								<h2>
									{g.label} <span className='muted'>· {g.files.length}</span>
								</h2>
								<p className='cap'>
									Destino:{' '}
									<span className='mono'>
										{g.to.replace('Archivo', archive)}
									</span>
								</p>
							</div>
							<button
								className='btn sm'
								type='button'
								onClick={() =>
									setPicked(
										p =>
											new Set([
												...p,
												...g.files.map(f => `${f.folder}/${f.name}`),
											])
									)
								}>
								Elegir todos
							</button>
						</header>
						<div className='files'>
							{g.files.map((f, i) => {
								const key = `${f.folder}/${f.name}`
								return (
									<label key={key} className='file' style={{ '--n': i }}>
										<input
											className='check'
											type='checkbox'
											checked={picked.has(key)}
											onChange={e => toggle(key, e.target.checked)}
										/>
										<b title={f.name}>{f.name}</b>
										<small>
											{gb(f.size)} · {ago(f.mtime)}
										</small>
									</label>
								)
							})}
						</div>
					</Reveal>
				))
			) : (
				<EmptyState title='Limpio' text='No hay nada que ordenar aquí.' />
			)}
			<div className='sticky-bar'>
				<div className='total'>
					{picked.size} archivos
					<small>{gb(size)} · cada uno a la carpeta de su tipo</small>
				</div>
				<button
					className={`btn ${organize.isPending ? 'busy' : ''}`}
					type='button'
					disabled={!picked.size || organize.isPending}
					onClick={() =>
						organize.mutate(
							{ items: [...picked] },
							{ onSuccess: () => setPicked(new Set()) }
						)
					}>
					<Icon name={organize.isPending ? 'refresh' : 'move'} />
					Ordenar
				</button>
			</div>
		</section>
	)
}

export default DesktopPage
