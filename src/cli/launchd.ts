import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { userInfo } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { DIR, PORT } from '../core/config.ts'
import { run } from '../core/exec.ts'
import { HOME } from '../core/paths.ts'

const LABEL = 'dev.bodega.agent'
const PLIST = join(HOME, 'Library/LaunchAgents', `${LABEL}.plist`)
const MAIN = fileURLToPath(new URL('./main.ts', import.meta.url))

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

export const install = async () => {
	mkdirSync(join(HOME, 'Library/LaunchAgents'), { recursive: true })
	const path = [
		'/opt/homebrew/bin',
		'/usr/local/bin',
		'/usr/bin',
		'/bin',
		'/usr/sbin',
		'/sbin',
		join(HOME, 'flutter/bin'),
		join(HOME, '.dotnet/tools'),
	].join(':')
	writeFileSync(
		PLIST,
		`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key><string>${LABEL}</string>
	<key>ProgramArguments</key><array><string>${xml(process.execPath)}</string><string>${xml(MAIN)}</string><string>serve</string></array>
	<key>RunAtLoad</key><true/>
	<key>KeepAlive</key><true/>
	<key>EnvironmentVariables</key><dict><key>PATH</key><string>${xml(path)}</string></dict>
	<key>StandardOutPath</key><string>${xml(join(DIR, 'server.log'))}</string>
	<key>StandardErrorPath</key><string>${xml(join(DIR, 'server.log'))}</string>
</dict>
</plist>
`
	)
	const domain = `gui/${userInfo().uid}`
	await run('launchctl', ['bootout', `${domain}/${LABEL}`])
	const r = await run('launchctl', ['bootstrap', domain, PLIST])
	if (r.code !== 0) throw new Error(r.stderr.trim())
	return `http://localhost:${PORT}`
}

export const uninstall = async () => {
	await run('launchctl', ['bootout', `gui/${userInfo().uid}/${LABEL}`])
	if (existsSync(PLIST)) rmSync(PLIST)
}
