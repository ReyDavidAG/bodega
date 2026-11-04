import type { IncomingMessage, ServerResponse } from 'node:http'

export class HttpError extends Error {
	status: number
	constructor(status: number, message: string) {
		super(message)
		this.status = status
	}
}

export const readJson = async <T>(req: IncomingMessage): Promise<T> => {
	let size = 0
	const chunks: Buffer[] = []
	for await (const chunk of req) {
		size += chunk.length
		if (size > 64 * 1024) throw new HttpError(413, 'Cuerpo demasiado grande')
		chunks.push(chunk)
	}
	if (!chunks.length) return {} as T
	try {
		return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T
	} catch {
		throw new HttpError(400, 'JSON inválido')
	}
}

export const json = (res: ServerResponse, status: number, body: unknown) => {
	res.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Cache-Control': 'no-store',
	})
	res.end(JSON.stringify(body))
}

export const stream = (res: ServerResponse) => {
	res.writeHead(200, {
		'Content-Type': 'application/x-ndjson; charset=utf-8',
		'Cache-Control': 'no-store',
		'X-Accel-Buffering': 'no',
	})
	return (event: unknown) => res.write(`${JSON.stringify(event)}\n`)
}
