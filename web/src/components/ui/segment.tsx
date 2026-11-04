import { type KeyboardEvent, useLayoutEffect, useRef } from 'react'

type Props<T extends string> = {
	label: string
	options: { id: T; label: string }[]
	value: T
	onChange: (v: T) => void
}

export const Segment = <T extends string>({
	label,
	options,
	value,
	onChange,
}: Props<T>) => {
	const ref = useRef<HTMLDivElement>(null)
	const thumb = useRef<HTMLSpanElement>(null)

	useLayoutEffect(() => {
		const active = ref.current?.querySelector<HTMLElement>(
			'[aria-checked="true"]'
		)
		const t = thumb.current
		if (!t) return
		t.style.opacity = active ? '1' : '0'
		if (!active) return
		t.style.width = `${active.offsetWidth}px`
		t.style.transform = `translateX(${active.offsetLeft - 3}px)`
	}, [value, options.length])

	const move = (e: KeyboardEvent, i: number) => {
		const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
		if (!step) return
		e.preventDefault()
		onChange(options[(i + step + options.length) % options.length].id)
	}

	return (
		<div ref={ref} className='segment' role='radiogroup' aria-label={label}>
			<span ref={thumb} className='segment-thumb' aria-hidden='true' />
			{options.map((o, i) => (
				<button
					key={o.id}
					type='button'
					role='radio'
					aria-checked={o.id === value}
					tabIndex={o.id === value ? 0 : -1}
					onClick={() => onChange(o.id)}
					onKeyDown={e => move(e, i)}>
					{o.label}
				</button>
			))}
		</div>
	)
}
