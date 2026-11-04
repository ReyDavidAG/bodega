import type { ReactNode } from 'react'

export const EmptyState = ({
	title,
	text,
	action,
}: {
	title: string
	text?: ReactNode
	action?: ReactNode
}) => (
	<div className='empty'>
		<strong>{title}</strong>
		{text && <span>{text}</span>}
		{action}
	</div>
)
