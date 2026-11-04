import type { ElementType, ReactNode } from 'react'

import { useReveal } from '@/hooks/ui/use_reveal'

type Props = {
	as?: ElementType
	className?: string
	index?: number
	label?: string
	children: ReactNode
}

export const Reveal = ({
	as: Tag = 'div',
	className = '',
	index = 0,
	label,
	children,
}: Props) => {
	const [ref, shown] = useReveal<HTMLElement>()
	return (
		<Tag
			ref={ref}
			data-reveal=''
			aria-label={label}
			className={`${className} ${shown ? 'in' : ''}`}
			style={{ '--i': Math.min(index, 8) }}>
			{children}
		</Tag>
	)
}
