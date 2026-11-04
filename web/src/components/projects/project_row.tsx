import { memo } from 'react'

import { STACKS } from '@/constants/categories'
import type { Project } from '@/types/bodega_type'
import { ago, gb } from '@/utils/format'

type Props = {
	project: Project
	max: number
	ports: number
	keys: number
	secrets: number
	moved: boolean
	active: boolean
	index: number
	onOpen: (name: string) => void
}

export const StackChips = ({ project }: { project: Project }) => (
	<>
		{project.stacks.map(s => (
			<span key={s} className='stack'>
				<i style={{ '--c': STACKS[s].color }} />
				{STACKS[s].label}
			</span>
		))}
	</>
)

export const ProjectRow = memo(
	({
		project: p,
		max,
		ports,
		keys,
		secrets,
		moved,
		active,
		index,
		onOpen,
	}: Props) => {
		const regen = p.regen.reduce((s, r) => s + r.size, 0)
		return (
			<tr
				style={{ '--n': index }}
				onClick={() => onOpen(p.name)}
				tabIndex={0}
				onKeyDown={e => e.key === 'Enter' && onOpen(p.name)}>
				<td>
					<div className='cell-main'>
						<b>{p.name}</b>
						<small>
							<StackChips project={p} />{' '}
							{active && <span className='badge good'>activo</span>}{' '}
							{moved && <span className='badge'>en disco externo</span>}{' '}
							{ago(p.last)}
						</small>
					</div>
				</td>
				<td className='num' data-label='Total'>
					{gb(p.size)}
					<div className='mini' aria-hidden='true'>
						<span
							style={{
								width: `${((p.size - regen) / max) * 100}%`,
								'--c': 'var(--ink-2)',
							}}
						/>
						<span
							style={{
								width: `${(regen / max) * 100}%`,
								'--c': 'var(--build)',
							}}
						/>
					</div>
				</td>
				<td className='num' data-label='Recuperable'>
					{regen ? gb(regen) : '—'}
				</td>
				<td data-label='Abierto'>
					{ports ? (
						<span className='badge good'>{ports}</span>
					) : (
						<span className='muted'>—</span>
					)}
				</td>
				<td data-label='Secretos'>
					{keys ? (
						<span className='badge bad'>{keys} llaves</span>
					) : secrets ? (
						<span className='badge'>{secrets}</span>
					) : (
						<span className='muted'>—</span>
					)}
				</td>
			</tr>
		)
	}
)

ProjectRow.displayName = 'ProjectRow'
