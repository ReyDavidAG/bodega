import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const tokenFile = join(process.env.BODEGA_HOME ?? join(homedir(), '.bodega'), 'token')
const token = existsSync(tokenFile) ? readFileSync(tokenFile, 'utf8').trim() : ''

export default defineConfig({
	root: __dirname,
	plugins: [react()],
	resolve: { alias: { '@': join(__dirname, 'src') } },
	build: { outDir: 'dist', emptyOutDir: true, sourcemap: false },
	server: {
		port: 2634,
		strictPort: true,
		proxy: {
			'/api': {
				target: 'http://127.0.0.1:2633',
				changeOrigin: true,
				configure: proxy =>
					proxy.on('proxyReq', req => {
						req.removeHeader('origin')
						req.setHeader('x-bodega-token', token)
					}),
			},
		},
	},
})
