import { memo, useEffect, useRef } from 'react'

import type { PlanGroup } from '@/types/bodega_type'
import { gb } from '@/utils/format'

const COLORS = {
	build: 'var(--build)',
	sim: 'var(--sim)',
	emu: 'var(--emu)',
	cache: 'var(--cache)',
}

export type RowState = 'idle' | 'running' | 'done' | 'simulated' | 'error'

type Props = {
	group: PlanGroup
	picked: Set<string>
	open: boolean
	status: Record<string, { state: RowState; message?: string }>
	onToggleOpen: (id: string) => void
	onPickGroup: (group: PlanGroup, on: boolean) => void
	onPick: (id: string, on: boolean) => void
}

const GroupCheck = ({
	all,
	some,
	label,
	onChange,
}: {
	all: boolean
	some: boolean
	label: string
	onChange: (on: boolean) => void
}) => {
	const ref = useRef<HTMLInputElement>(null)
	useEffect(() => {
		if (ref.current) ref.current.indeterminate = some
	}, [some])
	return (
		<input
			ref={ref}
			className='check'
			type='checkbox'
			checked={all}
			aria-label={label}
			onChange={e => onChange(e.target.checked)}
			onClick={e => e.stopPropagation()}
		/>
	)
}

export const PlanGroupCard = memo(
	({
		group: g,
		picked,
		open,
		status,
		onToggleOpen,
		onPickGroup,
		onPick,
	}: Props) => {
		const count = g.actions.filter(a => picked.has(a.id)).length
		return (
			<section className='plan-group'>
				<div
					className='plan-head'
					onClick={() => onToggleOpen(g.id)}
					role='button'
					tabIndex={0}
					aria-expanded={open}
					onKeyDown={e =>
						(e.key === 'Enter' || e.key === ' ') &&
						(e.preventDefault(), onToggleOpen(g.id))
					}>
					<GroupCheck
						all={count === g.actions.length}
						some={count > 0 && count < g.actions.length}
						label={`Incluir ${g.title}`}
						onChange={on => onPickGroup(g, on)}
					/>
					<span className='swatch' style={{ '--c': COLORS[g.color] }} />
					<span className='what'>
						<b>
							{g.title}{' '}
							{g.actions.some(a => a.kind === 'relocate') && (
								<span className='badge'>se mueve</span>
							)}{' '}
							{g.active && <span className='badge good'>activo</span>}
						</b>
						<small>{g.note}</small>
					</span>
					<span className='gb'>{gb(g.size)}</span>
				</div>
				{open && (
					<>
						<p className='safety'>{g.safety}</p>
						<div className='plan-items'>
							{g.actions.map((a, i) => {
								const st = status[a.id]
								return (
									<label
										key={a.id}
										className={`plan-item ${st?.state === 'done' || st?.state === 'simulated' ? 'done' : ''} ${st?.state === 'running' ? 'running' : ''}`}
										style={{ '--n': i }}>
										<input
											className='check'
											type='checkbox'
											checked={picked.has(a.id)}
											onChange={e => onPick(a.id, e.target.checked)}
										/>
										<span>
											{a.label} <span className='muted'>· {a.back}</span>
										</span>
										<span className='gb'>
											{st?.state === 'done'
												? 'listo'
												: st?.state === 'simulated'
													? 'simulado'
													: st?.state === 'error'
														? 'error'
														: gb(a.size)}
										</span>
										<code>
											{st?.state === 'error'
												? st.message
												: a.kind === 'command' && a.command
													? `${a.command.bin.split('/').pop()} ${a.command.args.join(' ')}`
													: a.kind === 'relocate'
														? `mover ${a.path} al disco externo`
														: `borrar ${a.path}`}
										</code>
									</label>
								)
							})}
						</div>
					</>
				)}
			</section>
		)
	}
)

PlanGroupCard.displayName = 'PlanGroupCard'
