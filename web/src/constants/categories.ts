import type { Stack } from '@/types/bodega_type'

export const CATEGORIES = [
	{
		id: 'build',
		label: 'Compilados',
		color: 'var(--build)',
		hint: 'build, bin, obj, .dart_tool, node_modules y DerivedData',
	},
	{
		id: 'sim',
		label: 'Simuladores iOS',
		color: 'var(--sim)',
		hint: 'CoreSimulator e iOS DeviceSupport',
	},
	{
		id: 'emu',
		label: 'Emuladores Android',
		color: 'var(--emu)',
		hint: 'AVDs y datos en ~/.android',
	},
	{
		id: 'cache',
		label: 'Cachés',
		color: 'var(--cache)',
		hint: 'npm, Gradle, NuGet, pub, CocoaPods y Homebrew',
	},
	{
		id: 'code',
		label: 'Código',
		color: 'var(--ink-2)',
		hint: 'Tus proyectos sin compilados',
	},
] as const

export const STACKS: Record<Stack, { label: string; color: string }> = {
	flutter: { label: 'Flutter', color: 'var(--sim)' },
	dotnet: { label: '.NET', color: 'var(--cache)' },
	node: { label: 'Node', color: 'var(--emu)' },
	rust: { label: 'Rust', color: 'var(--build)' },
	gradle: { label: 'Gradle', color: 'var(--emu)' },
	xcode: { label: 'Xcode', color: 'var(--sim)' },
	python: { label: 'Python', color: 'var(--build)' },
}
