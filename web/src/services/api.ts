const meta = (name: string) =>
	document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ?? ''

const token = meta('bodega-token')

const headers = (): HeadersInit => ({
	'Content-Type': 'application/json',
	...(token ? { 'x-bodega-token': token } : {}),
})

const fail = async (res: Response) => {
	const body = await res.json().catch(() => null)
	throw new Error(body?.error ?? `Error ${res.status}`)
}

const send = async <T>(
	method: string,
	path: string,
	body?: unknown
): Promise<T> => {
	const res = await fetch(path, {
		method,
		headers: headers(),
		body: body === undefined ? undefined : JSON.stringify(body),
	})
	if (!res.ok) await fail(res)
	return res.json()
}

export const api = {
	get: <T>(path: string) => send<T>('GET', path),
	post: <T>(path: string, body: unknown = {}) => send<T>('POST', path, body),
	put: <T>(path: string, body: unknown) => send<T>('PUT', path, body),
	stream: async <E>(
		path: string,
		body: unknown,
		onEvent: (event: E) => void
	) => {
		const res = await fetch(path, {
			method: 'POST',
			headers: headers(),
			body: JSON.stringify(body),
		})
		if (!res.ok || !res.body) return fail(res)
		const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
		let buffer = ''
		for (;;) {
			const { done, value } = await reader.read()
			if (done) break
			buffer += value
			const lines = buffer.split('\n')
			buffer = lines.pop() ?? ''
			for (const line of lines) if (line.trim()) onEvent(JSON.parse(line))
		}
	},
}
