import { useState } from 'react'

import { DaemonsCard } from '@/components/processes/daemons_card'
import { PortsCard } from '@/components/processes/ports_card'
import { PageHead } from '@/components/ui/page_head'
import { Segment } from '@/components/ui/segment'
import { useAction, useLive } from '@/hooks/data/use_bodega'
import { gb } from '@/utils/format'

const ProcessesPage = () => {
	const [scope, setScope] = useState<'mine' | 'all'>('mine')
	const live = useLive()
	const stop = useAction<{ pid: number }>('/api/processes/stop', d =>
		d.forced ? 'Detenido a la fuerza' : 'Detenido'
	)
	const ports = (live.data?.ports ?? []).filter(
		p => scope === 'all' || p.project
	)
	const daemons = live.data?.daemons ?? []
	const memory =
		(live.data?.ports ?? [])
			.filter(p => p.project)
			.reduce((s, p) => s + p.mem, 0) + daemons.reduce((s, d) => s + d.mem, 0)
	return (
		<section className='page'>
			<PageHead
				eyebrow='Procesos y puertos'
				title='Qué está abierto ahora'
				text={`Cada puerto con el proyecto que lo abrió, por la carpeta del proceso. Servidores y daemons de desarrollo usan ${gb(memory)} de memoria. Se actualiza cada 5 s.`}
				side={
					<Segment
						label='Mostrar'
						options={[
							{ id: 'mine', label: 'Mis proyectos' },
							{ id: 'all', label: 'Todo' },
						]}
						value={scope}
						onChange={setScope}
					/>
				}
			/>
			<PortsCard
				ports={ports}
				loading={live.isLoading}
				stopping={stop.isPending ? (stop.variables?.pid ?? null) : null}
				onStop={pid => stop.mutate({ pid })}
			/>
			<DaemonsCard daemons={daemons} onStop={pid => stop.mutate({ pid })} />
		</section>
	)
}

export default ProcessesPage
