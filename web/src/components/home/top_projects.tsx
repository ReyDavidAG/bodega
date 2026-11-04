import { Link } from 'react-router'

import type { Project } from '@/types/bodega_type'
import { gb } from '@/utils/format'

export const TopProjects = ({
	projects,
	open,
}: {
	projects: Project[]
	open: Record<string, number>
}) => {
	const max = projects[0]?.size || 1
	return (
		<ol className='ranked'>
			{projects.slice(0, 8).map(p => {
				const regen = p.regen.reduce((s, r) => s + r.size, 0)
				return (
					<li key={p.name}>
						<Link
							to={`/projects?p=${encodeURIComponent(p.name)}`}
							viewTransition>
							<span className='rk-name'>
								<span>{p.name}</span>
								{open[p.name] ? (
									<span className='badge good'>{open[p.name]} abierto</span>
								) : null}
							</span>
							<span className='rk-size'>{gb(p.size)}</span>
							<span className='rk-track'>
								<span
									style={{
										width: `${((p.size - regen) / max) * 100}%`,
										'--c': 'var(--ink-2)',
									}}
									title={`Código · ${gb(p.size - regen)}`}
								/>
								<span
									style={{
										width: `${(regen / max) * 100}%`,
										'--c': 'var(--build)',
									}}
									title={`Compilados · ${gb(regen)}`}
								/>
							</span>
						</Link>
					</li>
				)
			})}
		</ol>
	)
}
