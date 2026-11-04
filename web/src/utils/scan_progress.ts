export type ScanProgress = { step: string; done: number; total: number } | null

let current: ScanProgress = null
const listeners = new Set<() => void>()

export const scanProgress = {
	subscribe: (l: () => void) => {
		listeners.add(l)
		return () => listeners.delete(l)
	},
	get: () => current,
	set: (next: ScanProgress) => {
		current = next
		listeners.forEach(l => l())
	},
}
