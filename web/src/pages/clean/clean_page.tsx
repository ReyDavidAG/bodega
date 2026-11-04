import { useCallback, useMemo, useState } from 'react'

import { PlanGroupCard } from '@/components/clean/plan_group'
import { EmptyState } from '@/components/ui/empty_state'
import { Icon } from '@/components/ui/icons'
import { PageHead } from '@/components/ui/page_head'
import { Reveal } from '@/components/ui/reveal'
import { useApply } from '@/hooks/data/use_apply'
import { useBodega } from '@/hooks/data/use_bodega'
import type { PlanGroup } from '@/types/bodega_type'
import { gb } from '@/utils/format'

const SECTIONS: Record<PlanGroup['section'], string> = {
	xcode: 'Xcode',
	simulators: 'Simuladores',
	emulators: 'Emuladores',
	caches: 'Cachés',
	projects: 'Compilados de proyectos',
}

const CleanPage = () => {
	const { data } = useBodega()
	const plan = useMemo(() => data?.plan ?? [], [data])
	const [picked, setPicked] = useState<Set<string> | null>(null)
	const [open, setOpen] = useState<Set<string>>(new Set())
	const { run, status, progress, running } = useApply()

	const selected = useMemo(
		() =>
			picked ??
			new Set(
				plan.flatMap(g => g.actions.filter(a => a.checked).map(a => a.id))
			),
		[picked, plan]
	)
	const size = plan
		.flatMap(g => g.actions)
		.filter(a => selected.has(a.id))
		.reduce((s, a) => s + a.size, 0)

	const toggleOpen = useCallback(
		(id: string) =>
			setOpen(o =>
				o.has(id) ? new Set([...o].filter(x => x !== id)) : new Set(o).add(id)
			),
		[]
	)
	const pick = useCallback(
		(id: string, on: boolean) =>
			setPicked(p => {
				const next = new Set(p ?? selected)
				if (on) next.add(id)
				else next.delete(id)
				return next
			}),
		[selected]
	)
	const pickGroup = useCallback(
		(g: PlanGroup, on: boolean) =>
			setPicked(p => {
				const next = new Set(p ?? selected)
				g.actions.forEach(a => (on ? next.add(a.id) : next.delete(a.id)))
				return next
			}),
		[selected]
	)

	const start = (dryRun: boolean) => {
		const ids = [...selected]
		setOpen(
			new Set(
				plan.filter(g => g.actions.some(a => selected.has(a.id))).map(g => g.id)
			)
		)
		run(ids, dryRun).then(() => !dryRun && setPicked(null))
	}

	if (!data) return <section className='page' aria-busy='true' />
	return (
		<section className='page'>
			<PageHead
				eyebrow='Limpieza'
				title='Plan de limpieza'
				text='Marcado por omisión sólo lo seguro: proyectos sin cambios recientes, Xcode y cachés. Abre cada grupo para ver carpeta por carpeta y el comando exacto.'
			/>
			{plan.length ? (
				(Object.keys(SECTIONS) as PlanGroup['section'][]).map(section => {
					const groups = plan.filter(g => g.section === section)
					if (!groups.length) return null
					return (
						<Reveal key={section} as='section' label={SECTIONS[section]}>
							{groups.length > 1 && (
								<h2 className='section-title'>
									{SECTIONS[section]}
									<span className='mono muted'>
										{gb(groups.reduce((s, g) => s + g.size, 0))}
									</span>
								</h2>
							)}
							{groups.map(g => (
								<PlanGroupCard
									key={g.id}
									group={g}
									picked={selected}
									open={open.has(g.id)}
									status={status}
									onToggleOpen={toggleOpen}
									onPickGroup={pickGroup}
									onPick={pick}
								/>
							))}
						</Reveal>
					)
				})
			) : (
				<EmptyState
					title='Nada que limpiar'
					text='Escanea para armar el plan.'
				/>
			)}
			<div className='sticky-bar'>
				<div className='total'>
					{gb(size)}
					<small>
						{selected.size} acciones · lo regenerable vuelve solo, lo tuyo se
						mueve
					</small>
				</div>
				<button
					className='btn'
					type='button'
					style={{
						marginLeft: 'auto',
						background: 'transparent',
						color: 'inherit',
						borderColor: 'rgb(255 255 255 / .3)',
					}}
					disabled={!size || running}
					onClick={() => start(true)}>
					Simular
				</button>
				<button
					className={`btn ${running ? 'busy' : ''}`}
					type='button'
					style={{ marginLeft: 0 }}
					disabled={!size || running}
					onClick={() => start(false)}>
					<Icon name={running ? 'refresh' : 'clean'} />
					{running ? 'Limpiando…' : 'Aplicar plan'}
				</button>
				<div className='progress' aria-hidden='true'>
					<span style={{ width: `${progress * 100}%` }} />
				</div>
			</div>
		</section>
	)
}

export default CleanPage
