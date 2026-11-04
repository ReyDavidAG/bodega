import type { ReactNode } from 'react'

import { Icon } from '@/components/ui/icons'
import { Reveal } from '@/components/ui/reveal'
import { Legend, type Part, UsageBar } from '@/components/ui/usage_bar'
import type { Disk } from '@/types/bodega_type'
import { gb } from '@/utils/format'

export const DiskCard = ({
	disk,
	parts,
	children,
}: {
	disk: Disk
	parts: Part[]
	children?: ReactNode
}) => (
	<Reveal as='article' className='card disk'>
		<div className='disk-top'>
			<span className='disk-icon'>
				<Icon name='disk' size={22} />
			</span>
			<div>
				<div className='disk-name'>{disk.name}</div>
				<div className='disk-meta'>
					{disk.internal ? 'Interno' : 'Externo'} · {disk.fs || '—'} ·{' '}
					{disk.encrypted ? 'cifrado' : 'sin cifrar'}
				</div>
			</div>
			<div className='disk-free'>
				<b>{gb(disk.free)}</b>
				<small>libres de {gb(disk.size)}</small>
			</div>
		</div>
		<UsageBar parts={parts} total={disk.size} tall />
		<Legend parts={parts} />
		{children}
	</Reveal>
)
