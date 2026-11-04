import type { Part } from '@/components/ui/usage_bar'
import type { Disk } from '@/types/bodega_type'

export const diskParts = (
	disk: Disk,
	categories?: Record<string, number>,
	labels?: readonly { id: string; label: string; color: string }[]
): Part[] => {
	if (!categories || !labels)
		return [{ label: 'Usado', color: 'var(--ink-2)', value: disk.used }]
	const known = labels.map(c => ({
		label: c.label,
		color: c.color,
		value: categories[c.id] ?? 0,
	}))
	const rest = Math.max(0, disk.used - known.reduce((s, p) => s + p.value, 0))
	return [
		...known,
		{ label: 'macOS, apps y resto', color: 'var(--rest)', value: rest },
	]
}
