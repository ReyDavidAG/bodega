import { ConfirmButton } from '@/components/ui/confirm_button'
import { EmptyState } from '@/components/ui/empty_state'
import { Reveal } from '@/components/ui/reveal'
import type { Port } from '@/types/bodega_type'
import { gb } from '@/utils/format'

const processName = (command: string) =>
	command.split(' ')[0].split('/').pop() ?? command

type Props = {
	ports: Port[]
	loading: boolean
	stopping: number | null
	onStop: (pid: number) => void
}

export const PortsCard = ({ ports, loading, stopping, onStop }: Props) => (
	<Reveal as='article' className='card'>
		<header className='card-head'>
			<div>
				<h2>Puertos escuchando</h2>
				<p className='cap'>
					Detener manda SIGTERM y, si no responde en 5 s, lo fuerza. Bodega no
					se detiene a sí misma.
				</p>
			</div>
		</header>
		<div className='table-wrap'>
			<table className='table cards'>
				<thead>
					<tr>
						<th>Puerto</th>
						<th>Proyecto</th>
						<th>Proceso</th>
						<th className='num'>Memoria</th>
						<th className='num' />
					</tr>
				</thead>
				<tbody>
					{ports.map((p, i) => (
						<tr key={p.port} style={{ '--n': i }}>
							<td>
								<span className='port'>:{p.port}</span>
							</td>
							<td>
								<div className='cell-main'>
									<b>
										{p.project ?? <span className='muted'>Sin proyecto</span>}
									</b>
									<small className='path'>{p.cwd || p.command}</small>
								</div>
							</td>
							<td data-label='Proceso'>
								<div className='proc'>
									<span className='dot ping' />
									{processName(p.command)}{' '}
									<span className='muted mono'>pid {p.pid}</span>
								</div>
							</td>
							<td className='num' data-label='Memoria'>
								{gb(p.mem)}
							</td>
							<td className='num'>
								{p.self ? (
									<span className='badge'>Bodega</span>
								) : (
									<ConfirmButton
										icon='stop'
										label='Detener'
										question='¿Detener?'
										busy={stopping === p.pid}
										onConfirm={() => onStop(p.pid)}
									/>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{!ports.length && (
				<EmptyState
					title={loading ? 'Buscando…' : 'Nada abierto'}
					text={
						loading ? undefined : 'Ningún proyecto tiene servidores corriendo.'
					}
				/>
			)}
		</div>
	</Reveal>
)
