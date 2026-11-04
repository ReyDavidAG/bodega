import { useState } from 'react'

import { EmptyState } from '@/components/ui/empty_state'
import { Icon } from '@/components/ui/icons'
import { PageHead } from '@/components/ui/page_head'
import { Reveal } from '@/components/ui/reveal'
import { Segment } from '@/components/ui/segment'
import { BackupForm } from '@/components/vault/backup_form'
import { useBodega } from '@/hooks/data/use_bodega'
import type { Secret } from '@/types/bodega_type'
import { date } from '@/utils/format'

const KINDS: Record<Secret['kind'], { label: string; crit?: boolean }> = {
	firma: { label: 'Llave de firma', crit: true },
	llaves: { label: 'Contraseñas de la llave', crit: true },
	firebase: { label: 'Firebase' },
	certificado: { label: 'Certificado' },
	licencia: { label: 'Licencia' },
	config: { label: 'Configuración local' },
	env: { label: '.env' },
}

const ORDER: Secret['kind'][] = [
	'firma',
	'llaves',
	'certificado',
	'firebase',
	'licencia',
	'config',
	'env',
]

const VaultPage = () => {
	const { data } = useBodega()
	const [filter, setFilter] = useState<'all' | 'crit' | 'git'>('all')
	if (!data?.scan)
		return (
			<section className='page'>
				<EmptyState title='Escanea primero' />
			</section>
		)
	const all = [...data.scan.secrets].sort(
		(a, b) =>
			ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) ||
			a.project.localeCompare(b.project)
	)
	const list = all.filter(
		s =>
			filter === 'all' || (filter === 'crit' ? KINDS[s.kind].crit : s.tracked)
	)
	const crit = all.filter(s => KINDS[s.kind].crit).length
	const tracked = all.filter(s => s.tracked).length
	return (
		<section className='page'>
			<PageHead
				eyebrow='Bóveda'
				title='Llaves, certificados y secretos'
				text={`${all.length} archivos en ${new Set(all.map(s => s.project)).size} proyectos. Se copian con su SHA-256 a una imagen cifrada; Bodega nunca muestra ni manda su contenido.`}
			/>
			<div className='grid wide'>
				<Reveal as='article' className='card'>
					<header className='card-head'>
						<div>
							<h2>Inventario</h2>
							<p className='cap'>
								{crit} críticos · {tracked} versionados en git
							</p>
						</div>
						<Segment
							label='Filtrar'
							options={[
								{ id: 'all', label: 'Todos' },
								{ id: 'crit', label: 'Críticos' },
								{ id: 'git', label: 'En git' },
							]}
							value={filter}
							onChange={setFilter}
						/>
					</header>
					<div className='table-wrap'>
						<table className='table cards vault-row'>
							<tbody>
								{list.map((s, i) => (
									<tr key={s.path} style={{ '--n': i }}>
										<td>
											<span
												className={`kind ${KINDS[s.kind].crit ? 'crit' : ''}`}>
												<Icon
													name={
														KINDS[s.kind].crit
															? 'key'
															: s.kind === 'env' || s.kind === 'config'
																? 'file'
																: 'lock'
													}
													size={16}
												/>
											</span>
										</td>
										<td>
											<div className='cell-main'>
												<b>
													{s.name}{' '}
													<span className='muted' style={{ fontWeight: 400 }}>
														· {KINDS[s.kind].label}
													</span>
												</b>
												<small className='path'>{s.path}</small>
											</div>
										</td>
										<td className='num' data-label='Modificado'>
											{date(s.mtime)}
										</td>
										<td data-label='Estado'>
											{s.tracked ? (
												<span className='badge warn'>en git</span>
											) : null}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Reveal>
				<Reveal as='article' className='card'>
					<header className='card-head'>
						<div>
							<h2>Respaldo cifrado</h2>
							<p className='cap'>
								{data.vaultImage
									? 'Ya hay una bóveda en el disco externo.'
									: 'Todavía no hay respaldo.'}
							</p>
						</div>
					</header>
					<BackupForm
						exists={data.vaultImage}
						external={data.config.external}
					/>
					{tracked > 0 && (
						<p className='cap' style={{ marginTop: 14 }}>
							Los marcados “en git” viven en el historial de su repo. Sácalos
							con <code>git rm --cached</code>, agrégalos al{' '}
							<code>.gitignore</code> y, si el repo es público, cambia esas
							llaves.
						</p>
					)}
				</Reveal>
			</div>
		</section>
	)
}

export default VaultPage
