import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { router } from './router'

import './styles/tokens.css'
import './styles/app.css'
import './styles/motion.css'

import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'

const savedTheme = () => {
	try {
		return localStorage.getItem('bodega.theme')
	} catch {
		return null
	}
}

const theme = savedTheme()
if (theme === 'light' || theme === 'dark')
	document.documentElement.dataset.theme = theme

const client = new QueryClient({
	defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

const root = document.getElementById('root')
if (root)
	createRoot(root).render(
		<StrictMode>
			<QueryClientProvider client={client}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</StrictMode>
	)
