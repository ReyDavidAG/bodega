import { ConfirmButton } from '@/components/ui/confirm_button'
import { Reveal } from '@/components/ui/reveal'
import { useAction } from '@/hooks/data/use_bodega'
import type { State } from '@/types/bodega_type'

export const RelocationsCard = ({
	data,
	hasExternal,
}: {
	data: State
	hasExternal: boolean
}) => {
	const move = useAction<{ id: string }>(
		'/api/relocations',
		d => `Movido a ${String(d.to)}`
	)
	const back = useAction<{ id: string }>(
		'/api/relocations/restore',
		() => 'De regreso en el disco interno'
	)
	return (
		<Reveal as='article' className='card'>
			<header className='card-head'>
				<div>
					<h2>Reubicar al disco externo</h2>
					<p className='cap'>
						{data.config.external
							? `Destino: ${data.config.external}/Bodega/Reubicado`
							: 'Elige el disco externo en Ajustes.'}{' '}
						Si el disco no está conectado, la herramienta no encuentra esa
						carpeta hasta que lo conectes.
					</p>
				</div>
			</header>
			<div className='table-wrap'>
				<table className='table cards'>
					<thead>
						<tr>
							<th>Qué</th>
							<th>Ruta</th>
							<th>Variable</th>
							<th className='num' />
						</tr>
					</thead>
					<tbody>
						{data.relocatable.map((r, i) => {
							const done = data.relocations.find(x => x.id === r.id)
							return (
								<tr key={r.id} style={{ '--n': i }}>
									<td>
										<b>{r.label}</b>
									</td>
									<td className='path' data-label='Ruta'>
										{done ? `${r.path} → ${done.to}` : r.path}
									</td>
									<td className='mono' data-label='Variable'>
										{r.env ?? 'acceso'}
									</td>
									<td className='num'>
										{done ? (
											<ConfirmButton
												icon='back'
												label='Regresar'
												question='¿Regresar?'
												danger={false}
												busy={back.isPending && back.variables?.id === r.id}
												onConfirm={() => back.mutate({ id: r.id })}
											/>
										) : (
											<ConfirmButton
												icon='move'
												label='Mover'
												question='¿Mover?'
												danger={false}
												disabled={!hasExternal || !data.config.external}
												busy={move.isPending && move.variables?.id === r.id}
												onConfirm={() => move.mutate({ id: r.id })}
											/>
										)}
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</Reveal>
	)
}
