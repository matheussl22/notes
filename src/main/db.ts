import { mkdirSync } from 'fs'
import { join } from 'path'
import { DatabaseSync } from 'node:sqlite'
import type { Attachment, MemoryHit, Note, Project, ProjectTree } from '../shared/types'
import { EMPTY_DOC } from '../shared/types'
import { extractPlainText, extractTasks, parseDoc } from './content'

type DbProject = {
  id: number
  name: string
  description: string
  position: number
  created_at: string
  updated_at: string
}

type DbNote = {
  id: number
  project_id: number
  title: string
  body_json: string
  body_text: string
  completed: number
  created_at: string
  updated_at: string
}

type DbAttachment = {
  id: number
  project_id: number
  note_id: number | null
  filename: string
  stored_name: string
  mime: string
  size: number
  created_at: string
}

let db: DatabaseSync

export function openDatabase(userData: string): DatabaseSync {
  mkdirSync(userData, { recursive: true })
  db = new DatabaseSync(join(userData, 'notes.db'))
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  migrate()
  return db
}

export function getDb(): DatabaseSync {
  return db
}

export function closeDatabase(): void {
  if (db?.isOpen) {
    db.close()
  }
}

function now(): string {
  return new Date().toISOString()
}

function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body_json TEXT NOT NULL DEFAULT '{}',
      body_text TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime TEXT NOT NULL DEFAULT '',
      size INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memory_docs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      ref_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      UNIQUE(kind, ref_id)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
      title,
      body,
      content='memory_docs',
      content_rowid='id',
      tokenize='unicode61'
    );

    CREATE TRIGGER IF NOT EXISTS memory_docs_ai AFTER INSERT ON memory_docs BEGIN
      INSERT INTO memory_fts(rowid, title, body) VALUES (new.id, new.title, new.body);
    END;

    CREATE TRIGGER IF NOT EXISTS memory_docs_ad AFTER DELETE ON memory_docs BEGIN
      INSERT INTO memory_fts(memory_fts, rowid, title, body)
      VALUES ('delete', old.id, old.title, old.body);
    END;

    CREATE TRIGGER IF NOT EXISTS memory_docs_au AFTER UPDATE ON memory_docs BEGIN
      INSERT INTO memory_fts(memory_fts, rowid, title, body)
      VALUES ('delete', old.id, old.title, old.body);
      INSERT INTO memory_fts(rowid, title, body) VALUES (new.id, new.title, new.body);
    END;
  `)

  const columns = db.prepare('PRAGMA table_info(projects)').all() as { name: string }[]
  if (!columns.some((column) => column.name === 'position')) {
    db.exec('ALTER TABLE projects ADD COLUMN position INTEGER NOT NULL DEFAULT 0')
    const existing = db
      .prepare('SELECT id FROM projects ORDER BY name COLLATE NOCASE')
      .all() as { id: number }[]
    const update = db.prepare('UPDATE projects SET position = ? WHERE id = ?')
    existing.forEach((row, index) => update.run(index, row.id))
  }
}

function mapProject(row: DbProject): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    position: row.position ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapNote(row: DbNote): Note {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    bodyJson: row.body_json,
    bodyText: row.body_text,
    completed: row.completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapAttachment(row: DbAttachment): Attachment {
  return {
    id: row.id,
    projectId: row.project_id,
    noteId: row.note_id,
    filename: row.filename,
    mime: row.mime,
    size: row.size,
    createdAt: row.created_at
  }
}

function upsertMemory(kind: string, refId: number, projectId: number, title: string, body: string): void {
  db.prepare(
    `INSERT INTO memory_docs (kind, ref_id, project_id, title, body)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(kind, ref_id) DO UPDATE SET
       project_id = excluded.project_id,
       title = excluded.title,
       body = excluded.body`
  ).run(kind, refId, projectId, title, body)
}

function deleteMemory(kind: string, refId: number): void {
  db.prepare('DELETE FROM memory_docs WHERE kind = ? AND ref_id = ?').run(kind, refId)
}

function indexProject(project: Project): void {
  upsertMemory('project', project.id, project.id, project.name, project.description)
}

function indexNote(note: Note): void {
  upsertMemory('note', note.id, note.projectId, note.title, note.bodyText)
}

function reindexNoteTasks(note: Note): void {
  const oldTasks = db
    .prepare('SELECT id FROM tasks WHERE note_id = ?')
    .all(note.id) as { id: number }[]
  for (const task of oldTasks) deleteMemory('task', task.id)
  db.prepare('DELETE FROM tasks WHERE note_id = ?').run(note.id)

  const tasks = extractTasks(parseDoc(note.bodyJson))
  const insert = db.prepare(
    'INSERT INTO tasks (project_id, note_id, text, done, position) VALUES (?, ?, ?, ?, ?)'
  )
  for (const task of tasks) {
    const result = insert.run(note.projectId, note.id, task.text, task.done ? 1 : 0, task.position)
    upsertMemory('task', Number(result.lastInsertRowid), note.projectId, note.title, task.text)
  }
}

export function listTree(): ProjectTree[] {
  const projects = db
    .prepare('SELECT * FROM projects ORDER BY position ASC, name COLLATE NOCASE')
    .all() as DbProject[]
  const notes = db
    .prepare(
      'SELECT id, project_id, title, completed FROM notes ORDER BY completed ASC, updated_at DESC'
    )
    .all() as Pick<DbNote, 'id' | 'project_id' | 'title' | 'completed'>[]

  return projects.map((project) => ({
    ...mapProject(project),
    notes: notes
      .filter((note) => note.project_id === project.id)
      .map((note) => ({
        id: note.id,
        title: note.title,
        completed: note.completed === 1
      }))
  }))
}

export function createProject(name: string): Project {
  const ts = now()
  const next =
    (db.prepare('SELECT COALESCE(MAX(position), -1) AS max FROM projects').get() as { max: number })
      .max + 1
  const result = db
    .prepare(
      'INSERT INTO projects (name, description, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    )
    .run(name.trim(), '', next, ts, ts)
  const project = getProject(Number(result.lastInsertRowid))
  indexProject(project)
  return project
}

export function getProject(id: number): Project {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as DbProject
  return mapProject(row)
}

export function updateProject(id: number, patch: { name?: string; description?: string }): Project {
  const current = getProject(id)
  const ts = now()
  db.prepare('UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?').run(
    patch.name ?? current.name,
    patch.description ?? current.description,
    ts,
    id
  )
  const project = getProject(id)
  indexProject(project)
  return project
}

export function reorderProjects(ids: number[]): void {
  const update = db.prepare('UPDATE projects SET position = ? WHERE id = ?')
  db.exec('BEGIN')
  try {
    ids.forEach((id, index) => update.run(index, id))
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

export function deleteProject(id: number): void {
  const notes = db.prepare('SELECT id FROM notes WHERE project_id = ?').all(id) as { id: number }[]
  const attachments = db
    .prepare('SELECT id FROM attachments WHERE project_id = ?')
    .all(id) as { id: number }[]
  const tasks = db.prepare('SELECT id FROM tasks WHERE project_id = ?').all(id) as { id: number }[]

  db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  deleteMemory('project', id)
  for (const note of notes) deleteMemory('note', note.id)
  for (const attachment of attachments) deleteMemory('attachment', attachment.id)
  for (const task of tasks) deleteMemory('task', task.id)
}

export function createNote(projectId: number, title: string): Note {
  const ts = now()
  const result = db
    .prepare(
      `INSERT INTO notes (project_id, title, body_json, body_text, completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`
    )
    .run(projectId, title.trim(), EMPTY_DOC, '', ts, ts)
  const note = getNote(Number(result.lastInsertRowid))
  indexNote(note)
  return note
}

export function getNote(id: number): Note {
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as DbNote
  return mapNote(row)
}

export function updateNote(
  id: number,
  patch: { title?: string; bodyJson?: string; completed?: boolean }
): Note {
  const current = getNote(id)
  const ts = now()
  const bodyJson = patch.bodyJson ?? current.bodyJson
  const bodyText = patch.bodyJson ? extractPlainText(parseDoc(patch.bodyJson)) : current.bodyText
  const completed = patch.completed ?? current.completed

  db.prepare(
    `UPDATE notes
     SET title = ?, body_json = ?, body_text = ?, completed = ?, updated_at = ?
     WHERE id = ?`
  ).run(patch.title ?? current.title, bodyJson, bodyText, completed ? 1 : 0, ts, id)

  const note = getNote(id)
  indexNote(note)
  if (patch.bodyJson !== undefined) reindexNoteTasks(note)
  return note
}

export function deleteNote(id: number): void {
  const tasks = db.prepare('SELECT id FROM tasks WHERE note_id = ?').all(id) as { id: number }[]
  const attachments = db
    .prepare('SELECT id FROM attachments WHERE note_id = ?')
    .all(id) as { id: number }[]
  db.prepare('DELETE FROM notes WHERE id = ?').run(id)
  deleteMemory('note', id)
  for (const task of tasks) deleteMemory('task', task.id)
  for (const attachment of attachments) deleteMemory('attachment', attachment.id)
}

export function listAttachments(projectId: number, noteId?: number | null): Attachment[] {
  const rows =
    noteId === undefined
      ? (db
          .prepare('SELECT * FROM attachments WHERE project_id = ? ORDER BY created_at DESC')
          .all(projectId) as DbAttachment[])
      : noteId === null
        ? (db
            .prepare(
              'SELECT * FROM attachments WHERE project_id = ? AND note_id IS NULL ORDER BY created_at DESC'
            )
            .all(projectId) as DbAttachment[])
        : (db
            .prepare(
              'SELECT * FROM attachments WHERE project_id = ? AND note_id = ? ORDER BY created_at DESC'
            )
            .all(projectId, noteId) as DbAttachment[])

  return rows.map(mapAttachment)
}

export function addAttachment(input: {
  projectId: number
  noteId: number | null
  filename: string
  storedName: string
  mime: string
  size: number
}): Attachment {
  const ts = now()
  const result = db
    .prepare(
      `INSERT INTO attachments (project_id, note_id, filename, stored_name, mime, size, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(input.projectId, input.noteId, input.filename, input.storedName, input.mime, input.size, ts)
  const row = db
    .prepare('SELECT * FROM attachments WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as DbAttachment
  upsertMemory('attachment', row.id, row.project_id, row.filename, row.filename)
  return mapAttachment(row)
}

export function getAttachmentRow(id: number): DbAttachment {
  return db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as DbAttachment
}

export function deleteAttachment(id: number): DbAttachment | undefined {
  const row = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as DbAttachment | undefined
  if (!row) return undefined
  db.prepare('DELETE FROM attachments WHERE id = ?').run(id)
  deleteMemory('attachment', id)
  return row
}

export function searchMemory(query: string): MemoryHit[] {
  const trimmed = query.trim()
  if (!trimmed) return []
  const escaped = trimmed
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => `"${token}"`)
    .join(' AND ')
  if (!escaped) return []

  const rows = db
    .prepare(
      `SELECT d.kind, d.ref_id, d.project_id, d.title, d.body
       FROM memory_fts f
       JOIN memory_docs d ON d.id = f.rowid
       WHERE memory_fts MATCH ?
       ORDER BY rank
       LIMIT 40`
    )
    .all(escaped) as {
    kind: MemoryHit['kind']
    ref_id: number
    project_id: number
    title: string
    body: string
  }[]

  return rows.map((row) => ({
    kind: row.kind,
    refId: row.ref_id,
    projectId: row.project_id,
    title: row.title,
    body: row.body
  }))
}
