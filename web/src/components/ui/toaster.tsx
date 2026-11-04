import { useEffect, useState, useSyncExternalStore } from 'react'

import { toastStore } from '@/utils/toast'

export const Toaster = () => {
	const item = useSyncExternalStore(
		toastStore.subscribe,
		toastStore.get,
		toastStore.get
	)
	const [show, setShow] = useState(false)
	useEffect(() => {
		if (!item) return
		const a = requestAnimationFrame(() => setShow(true))
		const b = setTimeout(() => setShow(false), 3000)
		return () => {
			cancelAnimationFrame(a)
			clearTimeout(b)
			setShow(false)
		}
	}, [item])
	return (
		<div
			className={`toast ${show ? 'show' : ''}`}
			role='status'
			aria-live='polite'>
			{item?.message}
		</div>
	)
}
