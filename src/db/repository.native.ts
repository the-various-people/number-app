import * as SQLite from 'expo-sqlite';

import { fromRows, fromSessionRow, toResponseRow, toSessionRow, toTouchRows } from './rows';
import type { ItemResponseRow, SessionRow, TouchEventRow } from './rows';
import { DEFAULT_PREFERENCES, type Child, type Preferences, type Repository } from './types';

/** 7절 데이터 모델. activity_run은 놀이를 만드는 4단계에서 추가한다. */
const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS child (
  id TEXT PRIMARY KEY NOT NULL,
  nickname TEXT NOT NULL,
  birth_month TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY NOT NULL,
  child_id TEXT,
  type TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  adult_role TEXT
);
CREATE TABLE IF NOT EXISTS item_response (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  item_code TEXT NOT NULL,
  answer TEXT NOT NULL,
  correct INTEGER NOT NULL,
  auto_strategy_code TEXT NOT NULL,
  strategy_override TEXT,
  strategy_code TEXT NOT NULL,
  score INTEGER NOT NULL,
  helped INTEGER NOT NULL,
  response_ms INTEGER NOT NULL,
  prompt_end_ms INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS touch_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  target_index INTEGER NOT NULL,
  t_ms INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS preference (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_child ON session (child_id, started_at);
CREATE INDEX IF NOT EXISTS idx_response_session ON item_response (session_id);
CREATE INDEX IF NOT EXISTS idx_touch_response ON touch_event (response_id);
`;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function db(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= SQLite.openDatabaseAsync('number-app.db').then(async (database) => {
    await database.execAsync(SCHEMA);
    return database;
  });
  return dbPromise;
}

/** 태블릿 앱용 저장소 (expo-sqlite) */
interface ChildRow {
  id: string;
  nickname: string;
  birth_month: string;
  created_at: number;
}

export const repository: Repository = {
  async listChildren() {
    const rows = await (await db()).getAllAsync<ChildRow>('SELECT * FROM child ORDER BY created_at');
    return rows.map((r): Child => ({ id: r.id, nickname: r.nickname, birthMonth: r.birth_month, createdAt: r.created_at }));
  },

  async saveChild(child) {
    await (await db()).runAsync(
      'INSERT OR REPLACE INTO child (id, nickname, birth_month, created_at) VALUES (?, ?, ?, ?)',
      child.id, child.nickname, child.birthMonth, child.createdAt,
    );
  },

  async loadPreferences() {
    const row = await (await db()).getFirstAsync<{ value: string }>(
      "SELECT value FROM preference WHERE key = 'preferences'",
    );
    if (!row) return DEFAULT_PREFERENCES;
    try {
      return { ...DEFAULT_PREFERENCES, ...(JSON.parse(row.value) as Partial<Preferences>) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  async savePreferences(preferences) {
    await (await db()).runAsync(
      "INSERT OR REPLACE INTO preference (key, value) VALUES ('preferences', ?)",
      JSON.stringify(preferences),
    );
  },

  async createSession(session) {
    const r = toSessionRow(session);
    await (await db()).runAsync(
      'INSERT INTO session (id, child_id, type, started_at, adult_role) VALUES (?, ?, ?, ?, ?)',
      r.id, r.child_id, r.type, r.started_at, r.adult_role,
    );
  },

  async latestSession(childId) {
    const row = await (await db()).getFirstAsync<SessionRow>(
      'SELECT * FROM session WHERE child_id IS ? ORDER BY started_at DESC LIMIT 1',
      childId,
    );
    return row ? fromSessionRow(row) : null;
  },

  async listSessions(childId) {
    const rows = await (await db()).getAllAsync<SessionRow>(
      'SELECT * FROM session WHERE child_id IS ? ORDER BY started_at DESC',
      childId,
    );
    return rows.map(fromSessionRow);
  },

  async listResponses(sessionId) {
    const database = await db();
    const rows = await database.getAllAsync<ItemResponseRow>(
      'SELECT * FROM item_response WHERE session_id = ?',
      sessionId,
    );
    const touches = await database.getAllAsync<TouchEventRow>(
      `SELECT t.response_id, t.seq, t.target_index, t.t_ms FROM touch_event t
       JOIN item_response r ON r.id = t.response_id WHERE r.session_id = ?`,
      sessionId,
    );
    return rows.map((row) => fromRows(row, touches.filter((t) => t.response_id === row.id)));
  },

  async saveResponse(response) {
    const database = await db();
    const r = toResponseRow(response);
    await database.withTransactionAsync(async () => {
      await database.runAsync(
        `INSERT OR REPLACE INTO item_response
         (id, session_id, item_code, answer, correct, auto_strategy_code, strategy_override,
          strategy_code, score, helped, response_ms, prompt_end_ms, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r.id, r.session_id, r.item_code, r.answer, r.correct, r.auto_strategy_code, r.strategy_override,
        r.strategy_code, r.score, r.helped, r.response_ms, r.prompt_end_ms, r.note,
      );
      await database.runAsync('DELETE FROM touch_event WHERE response_id = ?', r.id);
      for (const t of toTouchRows(response)) {
        await database.runAsync(
          'INSERT INTO touch_event (response_id, seq, target_index, t_ms) VALUES (?, ?, ?, ?)',
          t.response_id, t.seq, t.target_index, t.t_ms,
        );
      }
    });
  },

  async deleteResponse(id) {
    const database = await db();
    await database.withTransactionAsync(async () => {
      await database.runAsync('DELETE FROM touch_event WHERE response_id = ?', id);
      await database.runAsync('DELETE FROM item_response WHERE id = ?', id);
    });
  },
};
