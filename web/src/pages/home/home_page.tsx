import { Link } from 'react-router'

import { AlertList } from '@/components/home/alert_list'
import { DiskCard } from '@/components/home/disk_card'
import { TopProjects } from '@/components/home/top_projects'
import { EmptyState } from '@/components/ui/empty_state'
import { Icon } from '@/components/ui/icons'
import { PageHead } from '@/components/ui/page_head'
import { Reveal } from '@/components/ui/reveal'
import { CATEGORIES } from '@/constants/categories'
import { useBodega, useScan, useScanProgress } from '@/hooks/data/use_bodega'
import { diskParts } from '@/utils/disk_parts'
import { dateTime, gb } from '@/utils/format'
import { alerts, recoverable } from '@/utils/insights'

const HomePage = () => {
	const { data } = useBodega()
	const scan = useScan()
	const progress = useScanProgress()
	if (!data) return <section className='page' aria-busy='true' />
	if (!data.scan)
		return (
			<section className='page'>
				<PageHead
					eyebrow='Inicio'
					title='Bienvenido a Bodega'
					text='Escanea tu Mac para ver qué ocupa el disco, qué se puede regenerar y qué está abierto. Sólo lee; no cambia nada.'
				/>
				<EmptyState
					title='Primer escaneo'
					text={`Revisa ${data.config.roots.join(', ')}, Xcode, simuladores, emuladores y cachés. Tarda de 30 a 90 segundos.`}
					action={
						<>
							<button
								className='btn primary'
								type='button'
								disabled={scan.isPending}
								onClick={() => scan.mutate()}>
								<Icon name='refresh' />
								{scan.isPending ? 'Escaneando…' : 'Escanear ahora'}
							</button>
							{progress && (
								<>
									<div
										className='bar'
										style={{ width: 'min(100%, 22rem)' }}
										aria-hidden='true'>
										<span
											style={{ flexGrow: progress.done, '--c': 'var(--ink-2)' }}
										/>
										<span
											className='free'
											style={{ flexGrow: progress.total - progress.done }}
										/>
									</div>
									<small className='muted'>{progress.step}</small>
								</>
							)}
						</>
					}
				/>
			</section>
		)
	const s = data.scan
	const total = recoverable(data)
	const groups = data.plan.filter(g => g.actions.some(a => a.checked))
	const open = Object.fromEntries(
		s.projects.map(p => [
			p.name,
			s.ports.filter(x => x.project === p.name).length,
		])
	)
	const maxCat = Math.max(...CATEGORIES.map(c => s.categories[c.id]), 1)
	return (
		<section className='page'>
			<PageHead
				eyebrow='Inicio'
				title='Tu Mac, hoy'
				text={`Escaneada ${dateTime(s.scannedAt)} en ${Math.round(s.durationMs / 1000)} s.`}
			/>
			<AlertList alerts={alerts(data)} />
			<Reveal as='article' className='reclaim'>
				<div>
					<div className='label'>Puedes recuperar sin perder nada</div>
					<div className='big'>
						{gb(total).split(' ')[0]}
						<small> {gb(total).split(' ')[1]}</small>
					</div>
					<p className='why'>
						{groups
							.slice(0, 4)
							.map(g => g.title)
							.join(', ')}
						{groups.length > 4 ? ` y ${groups.length - 4} más` : ''}. Lo
						regenerable vuelve solo; lo tuyo se mueve, nunca se borra.
					</p>
				</div>
				<Link className='btn' to='/clean' viewTransition>
					<Icon name='clean' />
					Revisar el plan
				</Link>
			</Reveal>
			<div className='disks'>
				{s.disks.map(d => (
					<DiskCard
						key={d.id}
						disk={d}
						parts={
							d.internal ? diskParts(d, s.categories, CATEGORIES) : diskParts(d)
						}
					/>
				))}
			</div>
			<div className='grid wide'>
				<Reveal as='article' className='card'>
					<header className='card-head'>
						<div>
							<h2>Lo que más pesa</h2>
							<p className='cap'>
								Gris: tu código. Naranja: compilados que se regeneran.
							</p>
						</div>
						<Link className='btn sm' to='/projects' viewTransition>
							Todos
						</Link>
					</header>
					<TopProjects projects={s.projects} open={open} />
				</Reveal>
				<Reveal as='article' className='card'>
					<header className='card-head'>
						<div>
							<h2>Por tipo</h2>
							<p className='cap'>Lo que ocupa el disco interno.</p>
						</div>
					</header>
					<ol className='ranked'>
						{CATEGORIES.map(c => (
							<li key={c.id}>
								<div>
									<span className='rk-name'>
										<span>{c.label}</span>
									</span>
									<span className='rk-size'>{gb(s.categories[c.id])}</span>
									<span className='rk-track'>
										<span
											style={{
												width: `${(s.categories[c.id] / maxCat) * 100}%`,
												'--c': c.color,
											}}
										/>
									</span>
									<small
										className='muted'
										style={{ gridColumn: '1 / -1', fontSize: 12 }}>
										{c.hint}
									</small>
								</div>
							</li>
						))}
					</ol>
				</Reveal>
			</div>
		</section>
	)
}

export default HomePage
