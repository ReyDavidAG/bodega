const invoke = cmd => window.__TAURI_INTERNALS__.invoke(cmd)
const $ = id => document.getElementById(id)
const status = $('status')
const start = $('start')

let waitingSince = 0

const check = async () => {
	if (await invoke('engine_status').catch(() => false)) return
	if (waitingSince && Date.now() - waitingSince > 15000) {
		waitingSince = 0
		start.disabled = false
		status.textContent =
			'El motor no respondió. Revisa ~/.bodega/server.log y vuelve a intentar.'
	}
}

start.addEventListener('click', async () => {
	start.disabled = true
	status.textContent = 'Arrancando el motor…'
	try {
		await invoke('start_engine')
		waitingSince = Date.now()
		status.textContent = 'Esperando a que responda…'
	} catch (error) {
		start.disabled = false
		if (error === 'not-installed') {
			$('install').hidden = false
			status.textContent = ''
		} else status.textContent = String(error)
	}
})

$('copy').addEventListener('click', async event => {
	try {
		await navigator.clipboard.writeText($('command').textContent)
		event.target.textContent = 'Copiado'
	} catch {
		getSelection().selectAllChildren($('command'))
	}
})

setInterval(check, 2000)
