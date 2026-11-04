import { head } from '../ui.js'

const RULES = [
	['Nada se borra directo', 'Todo pasa por un plan que dice qué, por qué y cuánto. Lo que se quita va a la Papelera o al Kingston; nunca rm.'],
	['Comandos oficiales primero', 'flutter clean, dotnet clean, npm cache clean, dotnet nuget locals, xcrun simctl, gradle --stop. Lo que no tiene comando se mueve a la Papelera.'],
	['Los proyectos activos se respetan', 'Un proyecto con cambios en las últimas dos semanas no se marca por omisión: lo vas a volver a compilar.'],
	['Secretos sin mirar', 'La bóveda copia .env, llaves y certificados a una imagen cifrada en el Kingston con checksum. Bodega nunca lee ni muestra su contenido.'],
	['Todo local', 'Corre en tu Mac en localhost. No hay nube, ni cuenta, ni telemetría. El historial vive en SQLite.'],
	['Claude lo opera contigo', 'Las mismas funciones se exponen como herramientas MCP: "¿qué pesa?", "arma un plan", "detén lo de la tienda". Lo que modifica algo siempre pide tu confirmación.'],
]

export const howView = () => ({
	title: 'Cómo funciona',
	html: `
	<section class="page">
		${head('Cómo funciona', 'Un motor, tres caras', 'Un servicio local en TypeScript que escanea y ejecuta; esta pantalla en localhost; una CLI (bodega scan, bodega plan, bodega apply) y un servidor MCP para Claude Code.')}
		<ol class="steps">${RULES.map(([b, p], i) => `<li data-reveal style="--i:${i}"><b>${b}</b><p>${p}</p></li>`).join('')}</ol>
	</section>`,
})
