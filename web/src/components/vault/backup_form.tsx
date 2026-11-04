import { type FormEvent, useState } from 'react'

import { Icon } from '@/components/ui/icons'
import { useAction } from '@/hooks/data/use_bodega'
import { createSchema, unlockSchema } from '@/schemas/vault.schema'

export const BackupForm = ({
	exists,
	external,
}: {
	exists: boolean
	external: string | null
}) => {
	const [password, setPassword] = useState('')
	const [confirm, setConfirm] = useState('')
	const [error, setError] = useState('')
	const backup = useAction<{ password: string }>(
		'/api/vault/backup',
		d => `Respaldo verificado: ${String(d.files)} archivos`
	)

	const submit = (e: FormEvent) => {
		e.preventDefault()
		const parsed = exists
			? unlockSchema.safeParse({ password })
			: createSchema.safeParse({ password, confirm })
		if (!parsed.success)
			return setError(
				parsed.error.issues[0]?.message ?? 'Revisa la contraseña.'
			)
		setError('')
		backup.mutate(
			{ password },
			{ onSettled: () => (setPassword(''), setConfirm('')) }
		)
	}

	if (!external)
		return (
			<p className='cap'>
				Conecta un disco externo y elígelo en Ajustes para guardar la bóveda.
			</p>
		)
	return (
		<form className='move-form' onSubmit={submit} autoComplete='off'>
			<p className='cap'>
				{exists
					? 'La bóveda ya existe en el disco externo. Escribe su contraseña para abrirla, copiar y cerrarla.'
					: 'Se crea una imagen cifrada AES-256 en el disco externo. La contraseña no se guarda: si la olvidas, nadie puede abrirla.'}
			</p>
			<label className='field-row'>
				<span>Contraseña</span>
				<input
					className='input'
					type='password'
					value={password}
					onChange={e => setPassword(e.target.value)}
					autoComplete={exists ? 'current-password' : 'new-password'}
				/>
			</label>
			{!exists && (
				<label className='field-row'>
					<span>Confírmala</span>
					<input
						className='input'
						type='password'
						value={confirm}
						onChange={e => setConfirm(e.target.value)}
						autoComplete='new-password'
					/>
				</label>
			)}
			{error && (
				<span className='error-text' role='alert'>
					{error}
				</span>
			)}
			<button
				className={`btn primary ${backup.isPending ? 'busy' : ''}`}
				type='submit'
				disabled={backup.isPending}>
				<Icon name={backup.isPending ? 'refresh' : 'lock'} />
				{backup.isPending
					? 'Copiando y verificando…'
					: exists
						? 'Respaldar ahora'
						: 'Crear bóveda y respaldar'}
			</button>
		</form>
	)
}
