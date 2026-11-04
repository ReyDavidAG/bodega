import { Drawer } from '@/components/ui/drawer'
import { Icon } from '@/components/ui/icons'
import { useApply } from '@/hooks/data/use_apply'
import { useAction } from '@/hooks/data/use_bodega'
import type { State } from '@/types/bodega_type'
import { ago, gb } from '@/utils/format'

import { MoveForm } from './move_form'
import { StackChips } from './project_row'

export const ProjectDrawer = ({
	state,
	name,
	onClose,
}: {
	state: State
	name: string
	onClose: () => void
}) => {
	const p = state.scan?.projects.find(x => x.name === name)
	const reveal = useAction<{ name: string }>(
		'/api/projects/reveal',
		() => 'Abierto en Finder'
	)
	const restore = useAction<{ name: string }>(
		'/api/projects/restore',
		() => 'De regreso en su lugar'
	)
	const { run, running } = useApply()
	if (!p || !state.scan) return null
	const regen = p.regen.reduce((s, r) => s + r.size, 0)
	const ports = state.scan.ports.filter(x => x.project === name)
	const secrets = state.scan.secrets.filter(x => x.project === name)
	const moved = state.moves.find(m => m.name === name)
	const actions = state.plan.find(g => g.id === `p:${name}`)?.actions ?? []
	return (
		<Drawer label={`Detalle de ${name}`} onClose={onClose}>
			<span className='eyebrow'>Proyecto</span>
			<h2>{p.name}</h2>
			<p className='cap' style={{ margin: '6px 0 16px' }}>
				<StackChips project={p} /> · último cambio {ago(p.last)} · {p.path}
			</p>
			<dl className='kv'>
				<div>
					<dt>Total</dt>
					<dd>{gb(p.size)}</dd>
				</div>
				<div>
					<dt>Tu código</dt>
					<dd>{gb(p.size - regen)}</dd>
				</div>
				<div>
					<dt>Compilados</dt>
					<dd>{gb(regen)}</dd>
				</div>
				<div>
					<dt>Git</dt>
					<dd>
						{p.git.repo
							? `${p.git.dirty ? `${p.git.dirty} cambios sin commit` : 'limpio'}${p.git.remote ? '' : ' · sin remoto'}`
							: 'no es repo'}
					</dd>
				</div>
				<div>
					<dt>Puertos abiertos</dt>
					<dd>{ports.map(x => x.port).join(', ') || '—'}</dd>
				</div>
				<div>
					<dt>Secretos</dt>
					<dd>{secrets.length}</dd>
				</div>
			</dl>
			<h3 className='drawer-sub'>Carpetas que se regeneran</h3>
			{p.regen.length ? (
				<div className='plan-items rounded'>
					{p.regen.map((r, i) => (
						<div
							key={r.path}
							className='plan-item'
							style={{ paddingLeft: 14, '--n': i }}>
							<span />
							<span className='path'>{r.path.replace(`${p.path}/`, '')}</span>
							<span className='gb'>{gb(r.size)}</span>
						</div>
					))}
				</div>
			) : (
				<p className='muted'>Nada que limpiar.</p>
			)}
			<div className='toolbar' style={{ marginTop: 16 }}>
				<button
					className={`btn primary ${running ? 'busy' : ''}`}
					type='button'
					disabled={!actions.length || running}
					onClick={() => run(actions.map(a => a.id))}>
					<Icon name={running ? 'refresh' : 'clean'} />
					Limpiar compilados
				</button>
				<button
					className='btn'
					type='button'
					onClick={() => reveal.mutate({ name })}>
					<Icon name='finder' />
					Ver en Finder
				</button>
			</div>
			<h3 className='drawer-sub'>Disco</h3>
			{moved ? (
				<div className='move-form'>
					<p className='cap'>
						Vive en {moved.to}
						{moved.link ? ' con un acceso en su ruta original' : ''}.
					</p>
					<button
						className='btn'
						type='button'
						disabled={restore.isPending}
						onClick={() => restore.mutate({ name })}>
						<Icon name='back' />
						Regresar al disco interno
					</button>
				</div>
			) : (
				<MoveForm
					name={name}
					disks={state.scan.disks.filter(d => !d.internal)}
					busyPorts={ports.length}
				/>
			)}
		</Drawer>
	)
}
