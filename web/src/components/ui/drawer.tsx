import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { Icon } from './icons'

export const Drawer = ({
	label,
	onClose,
	children,
}: {
	label: string
	onClose: () => void
	children: ReactNode
}) => {
	useEffect(() => {
		const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
		addEventListener('keydown', key)
		return () => removeEventListener('keydown', key)
	}, [onClose])
	return createPortal(
		<>
			<div className='scrim open' onClick={onClose} />
			<aside
				className='drawer open'
				role='dialog'
				aria-modal='true'
				aria-label={label}>
				<div className='toolbar' style={{ justifyContent: 'flex-end' }}>
					<button
						className='icon-btn ghost'
						type='button'
						title='Cerrar'
						onClick={onClose}
						autoFocus>
						<Icon name='close' />
						<span className='sr-only'>Cerrar</span>
					</button>
				</div>
				{children}
			</aside>
		</>,
		document.body
	)
}
