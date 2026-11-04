const GB = 1024 ** 3

export const gb = (n: number) =>
	n >= 10 * GB
		? `${Math.round(n / GB)} GB`
		: n >= GB
			? `${(n / GB).toFixed(1)} GB`
			: `${Math.max(1, Math.round(n / 1024 ** 2))} MB`

export const table = (rows: string[][]) => {
	const widths = rows[0].map((_, i) =>
		Math.max(...rows.map(r => (r[i] ?? '').length))
	)
	return rows
		.map(r => r.map((c, i) => c.padEnd(widths[i])).join('  '))
		.join('\n')
}
