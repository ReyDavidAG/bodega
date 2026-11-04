import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'

import { AppShell } from '@/layouts/app_shell'

const page = (load: () => Promise<{ default: React.ComponentType }>) => {
	const Component = lazy(load)
	return <Component />
}

export const router = createBrowserRouter([
	{
		element: <AppShell />,
		children: [
			{ index: true, element: page(() => import('@/pages/home/home_page')) },
			{
				path: '/clean',
				element: page(() => import('@/pages/clean/clean_page')),
			},
			{
				path: '/projects',
				element: page(() => import('@/pages/projects/projects_page')),
			},
			{
				path: '/processes',
				element: page(() => import('@/pages/processes/processes_page')),
			},
			{
				path: '/vault',
				element: page(() => import('@/pages/vault/vault_page')),
			},
			{
				path: '/disks',
				element: page(() => import('@/pages/disks/disks_page')),
			},
			{
				path: '/desktop',
				element: page(() => import('@/pages/desktop/desktop_page')),
			},
			{
				path: '/history',
				element: page(() => import('@/pages/history/history_page')),
			},
			{
				path: '/settings',
				element: page(() => import('@/pages/settings/settings_page')),
			},
			{ path: '/how', element: page(() => import('@/pages/how/how_page')) },
			{ path: '*', element: page(() => import('@/pages/home/home_page')) },
		],
	},
])
