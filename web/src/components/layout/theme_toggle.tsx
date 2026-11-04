import { Icon } from '@/components/ui/icons'

const remember = (theme: string) => {
	try {
		localStorage.setItem('bodega.theme', theme)
	} catch {
		return
	}
}

export const ThemeToggle = () => (
	<button
		className='icon-btn'
		type='button'
		title='Cambiar tema'
		onClick={() => {
			const r = document.documentElement
			const dark = r.dataset.theme
				? r.dataset.theme === 'dark'
				: matchMedia('(prefers-color-scheme: dark)').matches
			r.dataset.theme = dark ? 'light' : 'dark'
			remember(r.dataset.theme)
		}}>
		<Icon name='moon' />
		<span className='sr-only'>Cambiar tema</span>
	</button>
)
