import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { ProjectDrawer } from '@/components/projects/project_drawer'
import { ProjectRow } from '@/components/projects/project_row'
import { EmptyState } from '@/components/ui/empty_state'
import { Icon } from '@/components/ui/icons'
import { PageHead } from '@/components/ui/page_head'
import { Reveal } from '@/components/ui/reveal'
import { Segment } from '@/components/ui/segment'
import { useBodega } from '@/hooks/data/use_bodega'
import { gb } from '@/utils/format'

const SORTS = [
	{ id: 'size', label: 'Tamaño' },
	{ id: 'regen', label: 'Recuperable' },
	{ id: 'old', label: 'Inactivos' },
] as const

type Sort = (typeof SORTS)[number]['id']

const ProjectsPage = () => {
	const { data } = useBodega()
	const [params, setParams] = useSearchParams()
	const [draft, setDraft] = useState(params.get('q') ?? '')
	const sort = (SORTS.find(s => s.id === params.get('orden'))?.id ??
		'size') as Sort
	const q = (params.get('q') ?? '').toLowerCase()
	const open = params.get('p')

	const patch = useCallback(
		(next: Record<string, string | null>) =>
			setParams(
				cur => {
					const c = new URLSearchParams(cur)
					Object.entries(next).forEach(([k, v]) =>
						v ? c.set(k, v) : c.delete(k)
					)
					return c
				},
				{ replace: true }
			),
		[setParams]
	)

	useEffect(() => {
		const t = setTimeout(
			() =>
				draft.trim().toLowerCase() !== q && patch({ q: draft.trim() || null }),
			300
		)
		return () => clearTimeout(t)
	}, [draft, q, patch])

	const rows = useMemo(() => {
		const s = data?.scan
		if (!s) return []
		const active = new Set(data?.active ?? [])
		return s.projects
			.filter(p => !q || p.name.toLowerCase().includes(q))
			.map(p => ({
				p,
				regen: p.regen.reduce((a, r) => a + r.size, 0),
				active: active.has(p.name),
			}))
			.sort((a, b) =>
				sort === 'regen'
					? b.regen - a.regen
					: sort === 'old'
						? a.p.last.localeCompare(b.p.last)
						: b.p.size - a.p.size
			)
	}, [data, q, sort])

	const onOpen = useCallback((name: string) => patch({ p: name }), [patch])
	const onClose = useCallback(() => patch({ p: null }), [patch])

	if (!data?.scan)
		return (
			<section className='page'>
				<EmptyState title='Escanea primero' />
			</section>
		)
	const s = data.scan
	const max = Math.max(...s.projects.map(p => p.size), 1)
	const total = s.projects.reduce((a, p) => a + p.size, 0)
	const regen = rows.reduce((a, r) => a + r.regen, 0)
	return (
		<section className='page'>
			<PageHead
				eyebrow='Proyectos'
				title={`${s.projects.length} proyectos`}
				text={`${gb(total)} en ${data.config.roots.join(', ')}; ${gb(regen)} son compilados que se regeneran.`}
			/>
			<Reveal className='toolbar'>
				<label className='search'>
					<Icon name='search' />
					<span className='sr-only'>Buscar proyecto</span>
					<input
						type='search'
						value={draft}
						placeholder='Buscar proyecto'
						onChange={e => setDraft(e.target.value)}
					/>
				</label>
				<Segment
					label='Ordenar'
					options={[...SORTS]}
					value={sort}
					onChange={v => patch({ orden: v === 'size' ? null : v })}
				/>
			</Reveal>
			<Reveal as='article' className='card'>
				<div className='table-wrap'>
					<table className='table cards clickable'>
						<thead>
							<tr>
								<th>Proyecto</th>
								<th className='num'>Total</th>
								<th className='num'>Recuperable</th>
								<th>Abierto</th>
								<th>Secretos</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(({ p, active }, i) => (
								<ProjectRow
									key={p.name}
									project={p}
									max={max}
									index={i}
									active={active}
									onOpen={onOpen}
									ports={s.ports.filter(x => x.project === p.name).length}
									keys={
										s.secrets.filter(
											x => x.project === p.name && x.kind === 'firma'
										).length
									}
									secrets={s.secrets.filter(x => x.project === p.name).length}
									moved={data.moves.some(m => m.name === p.name)}
								/>
							))}
						</tbody>
					</table>
					{!rows.length && <EmptyState title='Sin coincidencias' />}
				</div>
			</Reveal>
			{open && <ProjectDrawer state={data} name={open} onClose={onClose} />}
		</section>
	)
}

export default ProjectsPage
