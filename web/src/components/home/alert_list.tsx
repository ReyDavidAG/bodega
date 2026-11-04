import { Link } from 'react-router'

import { Icon } from '@/components/ui/icons'
import { Reveal } from '@/components/ui/reveal'
import type { Alert } from '@/utils/insights'

export const AlertList = ({ alerts }: { alerts: Alert[] }) =>
	alerts.length ? (
		<Reveal as='section' className='alerts' label='Avisos'>
			{alerts.map(a => (
				<div key={a.title} className={`alert ${a.tone}`}>
					<Icon name='alert' />
					<div>
						<b>{a.title}</b>
						{a.text}
					</div>
					<Link className='btn sm' to={a.to} viewTransition>
						{a.action}
					</Link>
				</div>
			))}
		</Reveal>
	) : null
