import { DATA, fmt } from '../store.js'
import { esc, head, I, sampleBanner, toast } from '../ui.js'
import { diskCard, internalParts } from './disk_card.js'

const RELOCATIONS = [
	{ label: 'Emuladores de Android', from: '~/.android/avd', to: 'KINGSTON/Android/avd', how: 'ANDROID_AVD_HOME', size: 'avd' },
	{ label: 'Caché de Gradle', from: '~/.gradle', to: 'KINGSTON/Caches/gradle', how: 'GRADLE_USER_HOME', size: 'gradle' },
	{ label: 'Paquetes de NuGet', from: '~/.nuget/packages', to: 'KINGSTON/Caches/nuget', how: 'NUGET_PACKAGES', size: 'nuget' },
	{ label: 'Caché de pub (Flutter)', from: '~/.pub-cache', to: 'KINGSTON/Caches/pub', how: 'PUB_CACHE', size: 'pub' },
	{ label: 'Archives de Xcode', from: '~/Library/Developer/Xcode/Archives', to: 'KINGSTON/Xcode/Archives', how: 'mover y dejar acceso', size: 'archives' },
]

export const disksView = () => {
	const k = DATA.disks.kingston
	return {
		title: 'Discos',
		html: `
		<section class="page">
			${sampleBanner(DATA.sample)}
			${head('Discos', 'Discos y reubicaciones', 'Lo que se puede vivir en el Kingston sin trucos: cada herramienta tiene una variable oficial para su carpeta.')}
			<div class="disks">
				${diskCard('Macintosh HD', 'Disco interno · APFS', DATA.disks.internal, internalParts())}
				${diskCard(
					'KINGSTON',
					k ? 'XS1000 · USB · APFS' : 'Desconectado',
					k,
					k ? [{ label: 'Usado', color: 'var(--ink-2)', value: k.used, text: fmt.gb(k.used) }] : [],
					`<dl class="kv">
						<div><dt>Formato</dt><dd>APFS ✓</dd></div>
						<div><dt>Cifrado</dt><dd><span class="badge warn">No</span></dd></div>
						<div><dt>Permisos</dt><dd><span class="badge warn">Ignorados</span></dd></div>
					</dl>
					<div class="toolbar"><button class="btn sm" type="button" data-encrypt>${I.lock}Cómo cifrarlo</button><button class="btn sm" type="button" data-eject>${I.eject}Expulsar con revisión</button></div>`
				)}
			</div>
			<article class="card" data-reveal>
				<header class="card-head"><div><h2>Reubicar al Kingston</h2><p class="cap">Se mueve con verificación y se fija la variable en tu ~/.zshrc. Si el Kingston no está conectado, Bodega te avisa antes de que algo falle.</p></div></header>
				<div class="table-wrap"><table class="table cards">
					<thead><tr><th>Qué</th><th>Hoy</th><th>Va a</th><th class="num">Tamaño</th><th class="num"></th></tr></thead>
					<tbody>${RELOCATIONS.map((r, i) => `<tr style="--n:${i}"><td><div class="cell-main"><b>${esc(r.label)}</b><small class="mono">${esc(r.how)}</small></div></td><td class="path" data-label="Hoy">${esc(r.from)}</td><td class="path" data-label="Va a">${esc(r.to)}</td><td class="num" data-label="Tamaño">${fmt.gb(DATA.extra[r.size])}</td><td class="num"><button class="btn sm" type="button" data-move ${k ? '' : 'disabled'}>${I.move}Mover</button></td></tr>`).join('')}</tbody>
				</table></div>
			</article>
		</section>`,
		mount: root => {
			root.querySelector('[data-encrypt]')?.addEventListener('click', () => toast('Finder › clic derecho en KINGSTON › Cifrar "KINGSTON"…'))
			root.querySelector('[data-eject]')?.addEventListener('click', () => toast('Revisa que nada esté usando el disco y luego lo expulsa'))
			root.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => toast('En la app real: copia, verifica, mueve y fija la variable')))
		},
	}
}
