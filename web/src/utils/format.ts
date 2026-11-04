const GB = 1024 ** 3
const DAY = 864e5

export const gb = (n: number) =>
	n <= 0
		? '0 GB'
		: n >= GB * 10
			? `${Math.round(n / GB)} GB`
			: n >= GB
				? `${(n / GB).toFixed(1)} GB`
				: n >= 1024 ** 2
					? `${Math.round(n / 1024 ** 2)} MB`
					: `${Math.max(1, Math.round(n / 1024))} KB`

export const ago = (iso: string) => {
	const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
	if (days <= 0) return 'hoy'
	if (days === 1) return 'ayer'
	if (days < 30) return `hace ${days} días`
	const months = Math.round(days / 30)
	if (days < 365) return months === 1 ? 'hace un mes' : `hace ${months} meses`
	const years = Math.round(days / 365)
	return years === 1 ? 'hace un año' : `hace ${years} años`
}

export const date = (iso: string) =>
	new Date(iso).toLocaleDateString('es-MX', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})

export const dateTime = (iso: string) =>
	new Date(iso).toLocaleString('es-MX', {
		dateStyle: 'medium',
		timeStyle: 'short',
	})

export const time = (iso: string) =>
	new Date(iso).toLocaleTimeString('es-MX', {
		hour: '2-digit',
		minute: '2-digit',
	})
