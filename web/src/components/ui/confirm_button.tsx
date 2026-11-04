import { type ReactNode, useState } from 'react'

import { Icon, type IconName } from './icons'

type Props = {
	icon: IconName
	label: string
	question: string
	onConfirm: () => void
	disabled?: boolean
	busy?: boolean
	danger?: boolean
	children?: ReactNode
}

export const ConfirmButton = ({
	icon,
	label,
	question,
	onConfirm,
	disabled = false,
	busy = false,
	danger = true,
}: Props) => {
	const [asking, setAsking] = useState(false)
	if (asking)
		return (
			<span className='confirm'>
				<span>{question}</span>
				<button
					className='btn sm danger solid'
					type='button'
					onClick={() => {
						setAsking(false)
						onConfirm()
					}}>
					Sí
				</button>
				<button
					className='btn sm'
					type='button'
					onClick={() => setAsking(false)}>
					No
				</button>
			</span>
		)
	return (
		<button
			className={`btn sm ${danger ? 'danger' : ''} ${busy ? 'busy' : ''}`}
			type='button'
			disabled={disabled || busy}
			onClick={() => setAsking(true)}>
			<Icon name={busy ? 'refresh' : icon} size={15} />
			{label}
		</button>
	)
}
