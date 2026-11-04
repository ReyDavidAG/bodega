import { ConfirmButton } from '@/components/ui/confirm_button'
import { EmptyState } from '@/components/ui/empty_state'
import { Reveal } from '@/components/ui/reveal'
import type { Daemon } from '@/types/bodega_type'
import { gb } from '@/utils/format'

export const DaemonsCard = ({
	daemons,
	onStop,
}: {
	daemons: Daemon[]
	onStop: (pid: number) => void
}) => (
	<Reveal as='article' className='card'>
		<header className='card-head'>
			<div>
				<h2>Daemons de compilación</h2>
				<p className='cap'>
					Gradle, Kotlin, .NET y el analizador de Dart se quedan vivos después
					de compilar.
				</p>
			</div>
		</header>
		{daemons.length ? (
			<table className='table cards'>
				<tbody>
					{daemons.map((d, i) => (
						<tr key={d.pid} style={{ '--n': i }}>
							<td>
								<b>{d.label}</b> <span className='muted mono'>pid {d.pid}</span>
							</td>
							<td className='num' data-label='Memoria'>
								{gb(d.mem)}
							</td>
							<td className='num'>
								<ConfirmButton
									icon='stop'
									label='Detener'
									question='¿Detener?'
									onConfirm={() => onStop(d.pid)}
								/>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		) : (
			<EmptyState
				title='Ninguno corriendo'
				text='Aparecen aquí cuando compilas Android o .NET.'
			/>
		)}
	</Reveal>
)
