import type { ReactNode } from 'react'

const P = {
	home: <path d='M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z' />,
	projects: (
		<path d='M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z' />
	),
	clean: (
		<>
			<path d='M14 4 20 10M5 21l4-1 10.5-10.5a2.1 2.1 0 0 0-3-3L6 17l-1 4z' />
			<path d='M3 4h6M5 2v4' />
		</>
	),
	ports: (
		<>
			<rect x='3' y='4' width='18' height='12' rx='2' />
			<path d='M8 20h8M12 16v4M7 9h.01M11 9h6' />
		</>
	),
	disk: (
		<>
			<rect x='3' y='6' width='18' height='12' rx='3' />
			<path d='M7 14h.01M11 14h6' />
		</>
	),
	desk: (
		<>
			<rect x='3' y='4' width='18' height='13' rx='2' />
			<path d='M8 21h8M12 17v4' />
			<path d='m8 11 2.5 2.5L16 8' />
		</>
	),
	vault: (
		<>
			<rect x='3' y='4' width='18' height='16' rx='2' />
			<circle cx='12' cy='12' r='3.5' />
			<path d='M12 8.5V7M15.5 12H17' />
		</>
	),
	history: (
		<>
			<path d='M3 12a9 9 0 1 0 3-6.7L3 8' />
			<path d='M3 3v5h5M12 7v5l3 2' />
		</>
	),
	settings: (
		<>
			<circle cx='12' cy='12' r='3' />
			<path d='M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' />
		</>
	),
	how: (
		<>
			<circle cx='12' cy='12' r='9' />
			<path d='M9.6 9.2a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.5M12 17h.01' />
		</>
	),
	moon: <path d='M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z' />,
	refresh: (
		<>
			<path d='M20 11a8 8 0 0 0-14.6-4.5M4 13a8 8 0 0 0 14.6 4.5' />
			<path d='M5 3v4h4M19 21v-4h-4' />
		</>
	),
	alert: (
		<>
			<path d='M12 4 2.8 19.5h18.4z' />
			<path d='M12 10v4M12 17h.01' />
		</>
	),
	check: <path d='m5 12 4.5 4.5L19 7' />,
	stop: <rect x='6' y='6' width='12' height='12' rx='2' />,
	key: (
		<>
			<circle cx='8' cy='15' r='4' />
			<path d='m11 12 9-9M17 6l3 3M14 9l2 2' />
		</>
	),
	file: (
		<>
			<path d='M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z' />
			<path d='M14 3v5h5' />
		</>
	),
	lock: (
		<>
			<rect x='5' y='10' width='14' height='10' rx='2' />
			<path d='M8 10V7a4 4 0 1 1 8 0v3' />
		</>
	),
	move: <path d='M5 12h14M13 6l6 6-6 6' />,
	back: <path d='M19 12H5M11 6l-6 6 6 6' />,
	search: (
		<>
			<circle cx='11' cy='11' r='6.5' />
			<path d='m20 20-4-4' />
		</>
	),
	eject: (
		<>
			<path d='M12 5 5 13h14z' />
			<path d='M5 18h14' />
		</>
	),
	close: <path d='M6 6l12 12M18 6 6 18' />,
	finder: (
		<>
			<rect x='3' y='3' width='18' height='18' rx='4' />
			<path d='M12 3v18M8 9v1M16 9v1M8 15c2 1.5 6 1.5 8 0' />
		</>
	),
	plus: <path d='M12 5v14M5 12h14' />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof P

export const Icon = ({
	name,
	size = 18,
}: {
	name: IconName
	size?: number
}) => (
	<svg
		viewBox='0 0 24 24'
		width={size}
		height={size}
		fill='none'
		stroke='currentColor'
		strokeWidth='1.75'
		strokeLinecap='round'
		strokeLinejoin='round'
		aria-hidden='true'>
		{P[name]}
	</svg>
)
