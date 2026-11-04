import { Icon } from '@/components/ui/icons'
import { useBodega, useScan, useScanProgress } from '@/hooks/data/use_bodega'
import { time } from '@/utils/format'

export const ScanButton = () => {
	const { data } = useBodega()
	const scan = useScan()
	const progress = useScanProgress()
	const busy = scan.isPending || progress !== null
	return (
		<>
			<span className='live' title={progress?.step ?? 'Último escaneo'}>
				<span
					className={`dot ${busy ? 'warn' : data?.scan ? 'ping' : 'off'}`}
				/>
				<span>
					{busy ? (
						<>
							<span className='long'>Escaneando </span>
							{progress
								? `${Math.round((progress.done / progress.total) * 100)} %`
								: '…'}
						</>
					) : data?.scan ? (
						<>
							<span className='long'>Escaneado · </span>
							{time(data.scan.scannedAt)}
						</>
					) : (
						'Sin escanear'
					)}
				</span>
			</span>
			<button
				className={`icon-btn ${busy ? 'busy' : ''}`}
				type='button'
				title='Volver a escanear'
				disabled={busy}
				onClick={() => scan.mutate()}>
				<span
					style={
						busy
							? { display: 'grid', animation: 'spin .9s linear infinite' }
							: { display: 'grid' }
					}>
					<Icon name='refresh' />
				</span>
				<span className='sr-only'>Volver a escanear</span>
			</button>
		</>
	)
}
