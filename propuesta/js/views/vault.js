import { DATA, fmt } from '../store.js'
import { esc, head, I, sampleBanner, toast } from '../ui.js'

const KINDS = {
	firma: { label: 'Llave de firma', crit: true, why: 'Sin ella no puedes publicar actualizaciones de la app.' },
	llaves: { label: 'Contraseñas de la llave', crit: true, why: 'key.properties: contraseñas del keystore.' },
	firebase: { label: 'Firebase', why: 'Se puede volver a bajar de la consola de Firebase.' },
	certificado: { label: 'Certificado .pem', why: 'Certificados de servidor o de subida.' },
	licencia: { label: 'Licencia', why: 'Licencia de una librería de pago.' },
	config: { label: 'appsettings.Development', why: 'Cadenas de conexión locales.' },
	env: { label: '.env', why: 'Variables locales del proyecto.' },
}

const ORDER = ['firma', 'llaves', 'certificado', 'firebase', 'licencia', 'config', 'env']

const state = { backed: false }

export const vaultView = () => {
	const items = [...DATA.vault].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.project.localeCompare(b.project))
	const crit = items.filter(v => KINDS[v.kind].crit)
	const tracked = items.filter(v => v.tracked)
	const kingston = Boolean(DATA.disks.kingston)
	return {
		title: 'Bóveda',
		html: `
		<section class="page">
			${sampleBanner(DATA.sample)}
			${head('Bóveda', 'Llaves, certificados y secretos', `${items.length} archivos en ${new Set(items.map(v => v.project)).size} proyectos. Se copian a una imagen cifrada en el Kingston; Bodega nunca muestra ni sube su contenido.`, `<button class="btn primary" type="button" data-backup ${kingston ? '' : 'disabled'}>${I.lock}${state.backed ? 'Respaldar otra vez' : 'Respaldar todo'}</button>`)}
			${
				state.backed
					? `<div class="alert" data-reveal style="border-color:var(--good)">${I.check}<div><b>Respaldo verificado</b>${items.length} archivos copiados a KINGSTON/Bodega/Boveda.sparsebundle con su checksum SHA-256.</div></div>`
					: `<div class="alert bad" data-reveal>${I.key}<div><b>${crit.length} archivos críticos sin respaldo</b>Las llaves de firma de Android (.jks, .keystore) y sus contraseñas (key.properties) no se pueden recuperar de ningún lado si se pierden.</div></div>`
			}
			${tracked.length ? `<div class="alert warn" data-reveal>${I.alert}<div><b>${tracked.length} secretos están dentro de git</b>Están versionados en su repo. Conviene sacarlos del historial y agregarlos al .gitignore.</div><a class="btn sm" href="#/boveda?git=1">Ver</a></div>` : ''}
			<article class="card" data-reveal>
				<div class="table-wrap"><table class="table cards vault-row">
					<thead><tr><th></th><th>Archivo</th><th>Proyecto</th><th class="num">Modificado</th><th>Estado</th></tr></thead>
					<tbody>${items
						.map(
							(v, i) => `<tr style="--n:${Math.min(i, 30)}">
								<td><span class="kind ${KINDS[v.kind].crit ? 'crit' : ''}">${v.kind === 'firma' || v.kind === 'llaves' ? I.key : v.kind === 'env' || v.kind === 'config' ? I.file : I.lock}</span></td>
								<td><div class="cell-main"><b>${esc(v.name)} <span class="muted" style="font-weight:400">· ${KINDS[v.kind].label}</span></b><small class="path">${esc(v.path)}</small></div></td>
								<td data-label="Proyecto">${esc(v.project)}</td>
								<td class="num" data-label="Modificado">${fmt.date(v.mtime)}</td>
								<td data-label="Estado">${state.backed ? '<span class="badge good">respaldado</span>' : KINDS[v.kind].crit ? '<span class="badge bad">sin respaldo</span>' : '<span class="badge">sin respaldo</span>'}${v.tracked ? ' <span class="badge warn">en git</span>' : ''}</td>
							</tr>`
						)
						.join('')}</tbody>
				</table></div>
			</article>
		</section>`,
		mount: root =>
			root.querySelector('[data-backup]')?.addEventListener('click', e => {
				const b = e.currentTarget
				b.disabled = true
				b.classList.add('busy')
				b.innerHTML = `${I.refresh}Copiando y verificando…`
				setTimeout(() => {
					state.backed = true
					DATA.history.unshift({ at: new Date().toISOString(), what: `Bóveda respaldada: ${items.length} archivos`, freed: 0 })
					toast('Bóveda respaldada en el Kingston')
					import('../app.js').then(m => m.render(false))
				}, 1800)
			}),
	}
}
