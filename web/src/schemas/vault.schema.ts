import { z } from 'zod'

export const unlockSchema = z.object({
	password: z.string().min(1, 'Escribe la contraseña de la bóveda.'),
})

export const createSchema = z
	.object({
		password: z.string().min(8, 'Al menos 8 caracteres.').max(200),
		confirm: z.string(),
	})
	.refine(v => v.password === v.confirm, {
		message: 'Las contraseñas no coinciden.',
		path: ['confirm'],
	})
