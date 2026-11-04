import { RelocationsCard } from '@/components/disks/relocations_card'
import { DiskCard } from '@/components/home/disk_card'
import { EmptyState } from '@/components/ui/empty_state'
import { PageHead } from '@/components/ui/page_head'
import { CATEGORIES } from '@/constants/categories'
import { useBodega } from '@/hooks/data/use_bodega'
import { diskParts } from '@/utils/disk_parts'

const DisksPage = () => {
	const { data } = useBodega()
	if (!data?.scan)
		return (
			<section className='page'>
				<EmptyState title='Escanea primero' />
			</section>
		)
	const s = data.scan
	const external = s.disks.filter(d => !d.internal)
	return (
		<section className='page'>
			<PageHead
				eyebrow='Discos'
				title='Discos y reubicaciones'
				text='Lo que puede vivir en el disco externo sin trucos: se mueve con copia verificada, se deja un acceso en la ruta original y se fija la variable oficial de la herramienta.'
			/>
			<div className='disks'>
				{s.disks.map(d => (
					<DiskCard
						key={d.id}
						disk={d}
						parts={
							d.internal ? diskParts(d, s.categories, CATEGORIES) : diskParts(d)
						}>
						{!d.internal && (
							<dl className='kv'>
								<div>
									<dt>Formato</dt>
									<dd>
										{d.fs === 'APFS' ? 'APFS ✓' : `${d.fs} · conviene APFS`}
									</dd>
								</div>
								<div>
									<dt>Cifrado</dt>
									<dd>
										{d.encrypted
											? 'Sí ✓'
											: 'No · Finder › clic derecho › Cifrar'}
									</dd>
								</div>
								<div>
									<dt>Permisos</dt>
									<dd>{d.ownership ? 'Activos ✓' : 'Ignorados'}</dd>
								</div>
							</dl>
						)}
						{!d.internal && !d.ownership && (
							<code className='code-block'>
								sudo diskutil enableOwnership "{d.mount}"
							</code>
						)}
					</DiskCard>
				))}
			</div>
			<RelocationsCard data={data} hasExternal={external.length > 0} />
		</section>
	)
}

export default DisksPage
