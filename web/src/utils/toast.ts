let current: { id: number; message: string } | null = null
const listeners = new Set<() => void>()

export const toastStore = {
	subscribe: (l: () => void) => {
		listeners.add(l)
		return () => listeners.delete(l)
	},
	get: () => current,
}

export const toast = (message: string) => {
	current = { id: Date.now(), message }
	listeners.forEach(l => l())
}
