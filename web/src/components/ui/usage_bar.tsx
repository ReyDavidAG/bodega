import { gb } from '@/utils/format'

export type Part = { label: string; color: string; value: number }

export const UsageBar = ({
	parts,
	total,
	tall = false,
}: {
	parts: Part[]
	total: number
	tall?: boolean
}) => {
	const used = parts.reduce((s, p) => s + p.value, 0)
	return (
		<div
			className={`bar ${tall ? 'tall' : ''}`}
			role='img'
			aria-label={parts.map(p => `${p.label} ${gb(p.value)}`).join(', ')}>
			{parts.map(p => (
				<span
					key={p.label}
					style={{ flexGrow: (p.value / total) * 1000, '--c': p.color }}
					title={`${p.label} · ${gb(p.value)}`}
				/>
			))}
			<span
				className='free'
				style={{ flexGrow: Math.max(0, (1 - used / total) * 1000) }}
			/>
		</div>
	)
}

export const Legend = ({ parts }: { parts: Part[] }) => (
	<div className='legend'>
		{parts.map(p => (
			<span key={p.label}>
				<i style={{ '--c': p.color }} />
				{p.label} <em>{gb(p.value)}</em>
			</span>
		))}
	</div>
)
