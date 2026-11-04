import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { RowState } from '@/components/clean/plan_group'
import { KEYS } from '@/constants/keys'
import { api } from '@/services/api'
import type { ApplyEvent } from '@/types/bodega_type'
import { gb } from '@/utils/format'
import { toast } from '@/utils/toast'

export const useApply = () => {
	const client = useQueryClient()
	const [status, setStatus] = useState<
		Record<string, { state: RowState; message?: string }>
	>({})
	const [progress, setProgress] = useState(0)
	const [running, setRunning] = useState(false)

	const run = useCallback(
		async (ids: string[], dryRun = false) => {
			setRunning(true)
			setProgress(0)
			setStatus({})
			let errors = 0
			try {
				await api.stream<ApplyEvent>('/api/apply', { ids, dryRun }, e => {
					if (e.type === 'start' && e.id)
						setStatus(s => ({ ...s, [e.id!]: { state: 'running' } }))
					if (e.type === 'done' && e.id)
						setStatus(s => ({
							...s,
							[e.id!]: { state: dryRun ? 'simulated' : 'done' },
						}))
					if (e.type === 'error' && e.id) {
						errors++
						setStatus(s => ({
							...s,
							[e.id!]: { state: 'error', message: e.message },
						}))
					}
					if (e.total) setProgress(((e.index ?? e.total - 1) + 1) / e.total)
					if (e.type === 'end')
						toast(
							dryRun
								? `Simulación: liberaría ${gb(e.freed ?? 0)}`
								: `Listo: ${gb(e.freed ?? 0)} recuperados${errors ? ` · ${errors} con error` : ''}`
						)
				})
			} catch (e) {
				toast(e instanceof Error ? e.message : 'No se pudo aplicar')
			} finally {
				setRunning(false)
				setTimeout(() => setProgress(0), 1200)
				if (!dryRun) {
					await client.invalidateQueries({ queryKey: KEYS.state })
					client.invalidateQueries({ queryKey: KEYS.history })
				}
			}
		},
		[client]
	)

	return { run, status, progress, running }
}
