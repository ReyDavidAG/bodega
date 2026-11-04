import type { IconName } from '@/components/ui/icons'

export type NavItem = {
	to: string
	label: string
	short?: string
	icon: IconName
	group?: string
	desktop?: boolean
}

export const NAV: NavItem[] = [
	{ to: '/', label: 'Inicio', icon: 'home' },
	{ to: '/clean', label: 'Limpieza', icon: 'clean' },
	{ to: '/projects', label: 'Proyectos', icon: 'projects' },
	{
		to: '/processes',
		label: 'Procesos y puertos',
		short: 'Procesos',
		icon: 'ports',
	},
	{ to: '/vault', label: 'Bóveda', icon: 'vault', group: 'Guardar' },
	{ to: '/disks', label: 'Discos', icon: 'disk', desktop: true },
	{ to: '/desktop', label: 'Escritorio', icon: 'desk', desktop: true },
	{
		to: '/history',
		label: 'Historial',
		icon: 'history',
		group: 'Sistema',
		desktop: true,
	},
	{ to: '/settings', label: 'Ajustes', icon: 'settings', desktop: true },
	{ to: '/how', label: 'Cómo funciona', icon: 'how', desktop: true },
]
