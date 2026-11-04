export type Stack =
	| 'flutter'
	| 'dotnet'
	| 'node'
	| 'rust'
	| 'gradle'
	| 'xcode'
	| 'python'

type Rule = { dir: string; markers: RegExp; stack: Stack; back: string }

export const STACK_MARKERS: [Stack, RegExp][] = [
	['flutter', /^pubspec\.yaml$/],
	['dotnet', /\.(csproj|fsproj|sln|slnx)$/],
	['node', /^package\.json$/],
	['rust', /^Cargo\.toml$/],
	['gradle', /^(build\.gradle(\.kts)?|settings\.gradle(\.kts)?)$/],
	['xcode', /\.(xcodeproj|xcworkspace)$|^Podfile$/],
	['python', /^(pyproject\.toml|requirements\.txt|setup\.py)$/],
]

export const RULES: Rule[] = [
	{
		dir: 'build',
		markers: /^pubspec\.yaml$/,
		stack: 'flutter',
		back: 'Vuelve con flutter run o flutter build.',
	},
	{
		dir: '.dart_tool',
		markers: /^pubspec\.yaml$/,
		stack: 'flutter',
		back: 'Vuelve con flutter pub get.',
	},
	{
		dir: 'build',
		markers: /^(Podfile|.*\.xcodeproj)$/,
		stack: 'xcode',
		back: 'Lo vuelve a crear Xcode al compilar.',
	},
	{
		dir: 'Pods',
		markers: /^Podfile$/,
		stack: 'xcode',
		back: 'Vuelve con pod install.',
	},
	{
		dir: 'bin',
		markers: /\.(csproj|fsproj)$/,
		stack: 'dotnet',
		back: 'Vuelve con dotnet build.',
	},
	{
		dir: 'obj',
		markers: /\.(csproj|fsproj)$/,
		stack: 'dotnet',
		back: 'Vuelve con dotnet restore.',
	},
	{
		dir: 'node_modules',
		markers: /^package\.json$/,
		stack: 'node',
		back: 'Vuelve con npm ci (o pnpm/yarn install).',
	},
	{
		dir: '.next',
		markers: /^package\.json$/,
		stack: 'node',
		back: 'Vuelve con next build.',
	},
	{
		dir: '.turbo',
		markers: /^package\.json$/,
		stack: 'node',
		back: 'Caché de Turborepo.',
	},
	{
		dir: '.vite',
		markers: /^package\.json$/,
		stack: 'node',
		back: 'Caché de Vite.',
	},
	{
		dir: '.parcel-cache',
		markers: /^package\.json$/,
		stack: 'node',
		back: 'Caché de Parcel.',
	},
	{
		dir: 'target',
		markers: /^Cargo\.toml$/,
		stack: 'rust',
		back: 'Vuelve con cargo build.',
	},
	{
		dir: 'build',
		markers: /^build\.gradle(\.kts)?$/,
		stack: 'gradle',
		back: 'Vuelve con ./gradlew build.',
	},
	{
		dir: '.gradle',
		markers: /^(build|settings)\.gradle(\.kts)?$/,
		stack: 'gradle',
		back: 'Caché local de Gradle.',
	},
	{
		dir: '.venv',
		markers: /^(pyproject\.toml|requirements\.txt|setup\.py)$/,
		stack: 'python',
		back: 'Vuelve con python -m venv y pip install.',
	},
	{
		dir: '__pycache__',
		markers: /\.py$/,
		stack: 'python',
		back: 'Python lo regenera solo.',
	},
]

export const SKIP = new Set([
	'.git',
	'.hg',
	'.svn',
	'.idea',
	'.vscode',
	'.cache',
	'.dart_tool',
	'node_modules',
	'Pods',
	'build',
	'bin',
	'obj',
	'target',
	'.gradle',
	'.next',
	'.venv',
	'__pycache__',
	'DerivedData',
])

export const ruleFor = (dir: string, siblings: string[]) =>
	RULES.find(r => r.dir === dir && siblings.some(s => r.markers.test(s))) ??
	null

export const stacksIn = (names: string[]) =>
	STACK_MARKERS.filter(([, re]) => names.some(n => re.test(n))).map(([s]) => s)
