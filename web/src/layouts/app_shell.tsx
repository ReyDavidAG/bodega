import { Suspense, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'

import { Nav } from '@/components/layout/nav'
import { ScanButton } from '@/components/layout/scan_button'
import { ThemeToggle } from '@/components/layout/theme_toggle'
import { Toaster } from '@/components/ui/toaster'
import { NAV } from '@/constants/nav'
import { useBodega } from '@/hooks/data/use_bodega'

export const AppShell = () => {
	const { data } = useBodega()
	const { pathname } = useLocation()
	useEffect(() => {
		window.scrollTo({ top: 0 })
		const item = NAV.find(n => n.to === pathname)
		document.title =
			item && item.to !== '/' ? `${item.label} · Bodega` : 'Bodega'
	}, [pathname])
	const counts = {
		'/processes': { n: data?.scan?.ports.filter(p => p.project).length ?? 0 },
		'/vault': {
			n: data?.scan?.secrets.filter(s => s.kind === 'firma').length ?? 0,
			alert: true,
		},
	}
	return (
		<div className='shell'>
			<header className='topbar'>
				<Link className='brand' to='/' viewTransition>
					<span className='crate' aria-hidden='true' />
					Bodega
				</Link>
				{data?.demo && <span className='badge warn'>demo</span>}
				<span className='spacer' />
				<ScanButton />
				<ThemeToggle />
			</header>
			<aside className='sidebar'>
				<Nav counts={counts} />
			</aside>
			<main id='main'>
				<Suspense fallback={<section className='page' aria-busy='true' />}>
					<Outlet />
				</Suspense>
			</main>
			<footer className='tabbar'>
				<Nav mobile counts={counts} />
			</footer>
			<Toaster />
		</div>
	)
}
