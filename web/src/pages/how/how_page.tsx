import { PageHead } from '@/components/ui/page_head'
import { Reveal } from '@/components/ui/reveal'

const RULES = [
	[
		'Lo regenerable se borra; lo tuyo, nunca',
		'build, bin, obj, .dart_tool, node_modules y las cachés vuelven solas. Tus proyectos, archivos y Archives de Xcode sólo se mueven o van a la Papelera.',
	],
	[
		'Una carpeta sólo es compilado si su ecosistema lo dice',
		'bin y obj sólo junto a un .csproj; node_modules junto a package.json; build junto a pubspec.yaml, build.gradle o Podfile. Un "build" de documentación no se toca.',
	],
	[
		'Comandos oficiales primero',
		'npm cache clean, dotnet nuget locals, dart pub cache clean, xcrun simctl delete unavailable, pod cache clean, brew cleanup.',
	],
	[
		'Los proyectos activos se respetan',
		'Si cambió en los últimos días (lo eliges en Ajustes) no se marca por omisión: lo vas a volver a compilar.',
	],
	[
		'Mover es copiar, verificar y luego quitar',
		'Entre discos se copia con ditto, se comparan archivos y tamaño, el original va a la Papelera y queda un acceso en su ruta.',
	],
	[
		'Secretos sin mirar',
		'La bóveda copia llaves, certificados y .env a una imagen cifrada AES-256 con SHA-256 por archivo. La contraseña nunca se guarda.',
	],
	[
		'Sólo local',
		'El servidor escucha en 127.0.0.1:2633 con un token por instalación y rechaza otros Host y Origin. Sin nube, cuentas ni telemetría.',
	],
	[
		'Claude con tu permiso',
		'El servidor MCP expone las mismas funciones; las que modifican algo exigen confirmed=true, que Claude sólo manda después de preguntarte.',
	],
]

const HowPage = () => (
	<section className='page'>
		<PageHead
			eyebrow='Cómo funciona'
			title='Un motor, tres caras'
			text='Un servicio local en TypeScript que escanea y ejecuta, este dashboard, la CLI bodega y un servidor MCP para Claude Code.'
		/>
		<ol className='steps'>
			{RULES.map(([b, p], i) => (
				<Reveal key={b} as='li' index={i}>
					<b>{b}</b>
					<p>{p}</p>
				</Reveal>
			))}
		</ol>
	</section>
)

export default HowPage
