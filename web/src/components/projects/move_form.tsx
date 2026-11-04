import { useState } from 'react'

import { Icon } from '@/components/ui/icons'
import { useAction } from '@/hooks/data/use_bodega'
import type { Disk } from '@/types/bodega_type'

export const MoveForm = ({
	name,
	disks,
	busyPorts,
}: {
	name: string
	disks: Disk[]
	busyPorts: number
}) => {
	const [volume, setVolume] = useState(disks[0]?.mount ?? '')
	const [link, setLink] = useState(true)
	const move = useAction<{ name: string; volume: string; link: boolean }>(
		'/api/projects/move',
		d => `Movido a ${String(d.to)}`
	)
	if (!disks.length)
		return <p className='cap'>Conecta un disco externo para mover proyectos.</p>
	return (
		<div className='move-form'>
			<label className='field-row'>
				<span>Disco destino</span>
				<span className='toolbar'>
					{disks.map(d => (
						<button
							key={d.mount}
							type='button'
							className={`btn sm ${volume === d.mount ? 'primary' : ''}`}
							onClick={() => setVolume(d.mount)}>
							{d.name}
						</button>
					))}
				</span>
			</label>
			<label className='field-row inline'>
				<input
					className='check'
					type='checkbox'
					checked={link}
					onChange={e => setLink(e.target.checked)}
				/>
				<span>
					Dejar un acceso en la ruta original (tu IDE y terminal siguen
					funcionando igual)
				</span>
			</label>
			<button
				className={`btn ${move.isPending ? 'busy' : ''}`}
				type='button'
				disabled={move.isPending || busyPorts > 0}
				onClick={() => move.mutate({ name, volume, link })}>
				<Icon name={move.isPending ? 'refresh' : 'move'} />
				{move.isPending ? 'Copiando y verificando…' : 'Mover a disco externo'}
			</button>
			{busyPorts > 0 && (
				<p className='cap'>Detén primero lo que este proyecto tiene abierto.</p>
			)}
		</div>
	)
}
