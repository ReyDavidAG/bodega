import { useEffect, useRef, useState } from 'react'

export const useReveal = <T extends Element>() => {
	const ref = useRef<T>(null)
	const [shown, setShown] = useState(
		() =>
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
	)
	useEffect(() => {
		const el = ref.current
		if (!el || shown) return
		const io = new IntersectionObserver(
			entries => {
				if (entries.some(e => e.isIntersecting)) {
					setShown(true)
					io.disconnect()
				}
			},
			{ rootMargin: '0px 0px -6% 0px' }
		)
		io.observe(el)
		return () => io.disconnect()
	}, [shown])
	return [ref, shown] as const
}
