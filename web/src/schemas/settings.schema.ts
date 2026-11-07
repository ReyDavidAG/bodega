import { z } from 'zod'

export const settingsSchema = z.object({
	roots: z
		.array(
			z
				.string()
				.trim()
				.regex(/^(~\/|\/)/, 'Cada carpeta empieza con ~/ o /')
		)
		.min(1, 'Agrega al menos una carpeta'),
	activeDays: z.coerce
		.number()
		.int('Días enteros')
		.min(1, 'Mínimo 1 día')
		.max(365, 'Máximo 365 días'),
	alertFreeGB: z.coerce
		.number()
		.int('GB enteros')
		.min(0, 'Usa 0 para no avisar')
		.max(1000, 'Máximo 1000 GB'),
})
