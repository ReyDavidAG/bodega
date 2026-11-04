import { DATA, fmt } from '../store.js'
import { esc, head, I } from '../ui.js'

export const historyView = () => ({
	title: 'Historial',
	html: `
	<section class="page">
		${head('Historial', 'Lo que se ha hecho', `${fmt.gb(DATA.history.reduce((s, h) => s + h.freed, 0))} recuperados en total. Cada acción guarda qué movió y a dónde, para poder deshacerla.`)}
		<article class="card" data-reveal><ol class="log">${DATA.history
			.map(h => `<li><span class="ic">${I.check}</span><span>${esc(h.what)}<br><span class="when">${new Date(h.at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span></span><span class="gb">${h.freed ? `+${fmt.gb(h.freed)}` : ''}</span></li>`)
			.join('')}</ol></article>
	</section>`,
})
