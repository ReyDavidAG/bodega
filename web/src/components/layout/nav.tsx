import { Fragment, useLayoutEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router'

import { Icon } from '@/components/ui/icons'
import { NAV } from '@/constants/nav'

export const Nav = ({
	mobile = false,
	counts = {},
}: {
	mobile?: boolean
	counts?: Record<string, { n: number; alert?: boolean }>
}) => {
	const ref = useRef<HTMLElement>(null)
	const pill = useRef<HTMLSpanElement>(null)
	const { pathname } = useLocation()

	useLayoutEffect(() => {
		const nav = ref.current
		const p = pill.current
		if (!nav || !p) return
		const place = () => {
			const a = nav.querySelector<HTMLElement>('a[aria-current="page"]')
			p.style.opacity = a ? '1' : '0'
			if (!a) return
			p.style.width = `${a.offsetWidth}px`
			p.style.height = `${a.offsetHeight}px`
			p.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop}px)`
		}
		place()
		const ro = new ResizeObserver(place)
		ro.observe(nav)
		return () => ro.disconnect()
	}, [pathname])

	return (
		<nav ref={ref} className='nav' aria-label='Secciones'>
			<span ref={pill} className='nav-pill' aria-hidden='true' />
			{NAV.filter(n => !(mobile && n.desktop)).map(n => (
				<Fragment key={n.to}>
					{!mobile && n.group && <span className='nav-group'>{n.group}</span>}
					<NavLink to={n.to} end={n.to === '/'} viewTransition>
						<Icon name={n.icon} />
						<span>{mobile ? (n.short ?? n.label) : n.label}</span>
						{counts[n.to]?.n ? (
							<span className={`count ${counts[n.to].alert ? 'alert' : ''}`}>
								{counts[n.to].n}
							</span>
						) : null}
					</NavLink>
				</Fragment>
			))}
		</nav>
	)
}
