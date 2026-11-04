import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import { DIR } from './config.ts'

export type Event = {
	id: number
	at: string
	kind: string
	title: string
	freed: number
	details: unknown
}

let db: DatabaseSync | null = null

const open = () => {
	if (db) return db
	db = new DatabaseSync(join(DIR, 'bodega.db'))
	db.exec(`create table if not exists events (
		id integer primary key autoincrement,
		at text not null,
		kind text not null,
		title text not null,
		freed integer not null default 0,
		details text
	)`)
	return db
}

export const record = (
	kind: string,
	title: string,
	freed = 0,
	details: unknown = null
) =>
	open()
		.prepare(
			'insert into events (at, kind, title, freed, details) values (?, ?, ?, ?, ?)'
		)
		.run(
			new Date().toISOString(),
			kind,
			title,
			Math.max(0, Math.round(freed)),
			JSON.stringify(details)
		)

export const events = (limit = 200): Event[] =>
	open()
		.prepare(
			'select id, at, kind, title, freed, details from events order by id desc limit ?'
		)
		.all(limit)
		.map(r => ({
			id: Number(r.id),
			at: String(r.at),
			kind: String(r.kind),
			title: String(r.title),
			freed: Number(r.freed),
			details: r.details ? JSON.parse(String(r.details)) : null,
		}))
