import { useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { KEYS } from '@/constants/keys'
import { api } from '@/services/api'
import type { Daemon, Event, Port, State } from '@/types/bodega_type'
import { scanProgress } from '@/utils/scan_progress'
import { toast } from '@/utils/toast'

export const useBodega = () =>
	useQuery({
		queryKey: KEYS.state,
		queryFn: () => api.get<State>('/api/state'),
		staleTime: Infinity,
	})

export const useLive = (enabled = true) =>
	useQuery({
		queryKey: KEYS.live,
		queryFn: () => api.get<{ ports: Port[]; daemons: Daemon[] }>('/api/live'),
		enabled,
		refetchInterval: 5000,
	})

export const useHistory = () =>
	useQuery({
		queryKey: KEYS.history,
		queryFn: () => api.get<Event[]>('/api/history'),
	})

export const useScanProgress = () =>
	useSyncExternalStore(
		scanProgress.subscribe,
		scanProgress.get,
		scanProgress.get
	)

export const useScan = () => {
	const client = useQueryClient()
	return useMutation({
		mutationFn: () =>
			api.stream<{
				type: string
				step?: string
				done?: number
				total?: number
			}>('/api/scan', {}, e => {
				if (e.type === 'progress')
					scanProgress.set({
						step: e.step ?? '',
						done: e.done ?? 0,
						total: e.total ?? 1,
					})
			}),
		onSettled: () => scanProgress.set(null),
		onSuccess: () => {
			client.invalidateQueries({ queryKey: KEYS.state })
			toast('Escaneo listo')
		},
		onError: e => toast(e.message),
	})
}

export const useAction = <B,>(
	path: string,
	success: (data: Record<string, unknown>) => string
) => {
	const client = useQueryClient()
	return useMutation({
		mutationFn: (body: B) => api.post<Record<string, unknown>>(path, body),
		onSuccess: data => {
			client.invalidateQueries({ queryKey: KEYS.state })
			client.invalidateQueries({ queryKey: KEYS.live })
			client.invalidateQueries({ queryKey: KEYS.history })
			toast(success(data))
		},
		onError: e => toast(e.message),
	})
}
