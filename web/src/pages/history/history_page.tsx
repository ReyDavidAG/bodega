import { EmptyState } from '@/components/ui/empty_state'
import { Icon } from '@/components/ui/icons'
import { PageHead } from '@/components/ui/page_head'
import { Reveal } from '@/components/ui/reveal'
import { useHistory } from '@/hooks/data/use_bodega'
import { dateTime, gb } from '@/utils/format'

const HistoryPage = () => {
	const { data = [] } = useHistory()
	const total = data.reduce((s, e) => s + e.freed, 0)
	return (
		<section className='page'>
			<PageHead
				eyebrow='Historial'
				title='Lo que se ha hecho'
				text={`${gb(total)} recuperados en total. Cada movimiento guarda de dónde y a dónde, para poder regresarlo.`}
			/>
			<Reveal as='article' className='card'>
				{data.length ? (
					<ol className='log'>
						{data.map(e => (
							<li key={e.id}>
								<span className='ic'>
									<Icon name='check' size={15} />
								</span>
								<span>
									{e.title}
									<br />
									<span className='when'>{dateTime(e.at)}</span>
								</span>
								<span className='gb'>
									{e.kind === 'clean' && e.freed ? `+${gb(e.freed)}` : ''}
								</span>
							</li>
						))}
					</ol>
				) : (
					<EmptyState
						title='Todavía nada'
						text='Aquí aparece cada limpieza, movimiento y respaldo.'
					/>
				)}
			</Reveal>
		</section>
	)
}

export default HistoryPage
