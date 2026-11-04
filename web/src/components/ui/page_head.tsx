import type { ReactNode } from 'react'

import { Reveal } from './reveal'

export const PageHead = ({
	eyebrow,
	title,
	text,
	side,
}: {
	eyebrow: string
	title: ReactNode
	text?: ReactNode
	side?: ReactNode
}) => (
	<Reveal as='header' className='head'>
		<div>
			<span className='eyebrow'>{eyebrow}</span>
			<h1>{title}</h1>
			{text && <p>{text}</p>}
		</div>
		{side && <div>{side}</div>}
	</Reveal>
)
