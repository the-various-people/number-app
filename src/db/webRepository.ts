import { DEFAULT_PREFERENCES, type Child, type ItemResponse, type Preferences, type Repository, type Session } from './types';

/** localStorage와 같은 모양. 테스트에서는 가짜를 넣는다. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SESSIONS_KEY = 'number-app:sessions';
const CHILDREN_KEY = 'number-app:children';
const PREFERENCES_KEY = 'number-app:preferences';
const responsesKey = (sessionId: string) => `number-app:responses:${sessionId}`;

/** 웹용 저장소. 기록은 그 기기의 브라우저 안에만 남는다. */
export function createWebRepository(storage: KeyValueStorage): Repository {
  const read = <T>(key: string, fallback: T): T => {
    try {
      const raw = storage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key: string, value: unknown) => storage.setItem(key, JSON.stringify(value));

  const responsesOf = (sessionId: string) => read<ItemResponse[]>(responsesKey(sessionId), []);

  return {
    async listChildren() {
      return read<Child[]>(CHILDREN_KEY, []);
    },

    async saveChild(child) {
      const others = read<Child[]>(CHILDREN_KEY, []).filter((c) => c.id !== child.id);
      write(CHILDREN_KEY, [...others, child]);
    },

    async loadPreferences() {
      return { ...DEFAULT_PREFERENCES, ...read<Partial<Preferences>>(PREFERENCES_KEY, {}) };
    },

    async savePreferences(preferences) {
      write(PREFERENCES_KEY, preferences);
    },

    async createSession(session) {
      write(SESSIONS_KEY, [...read<Session[]>(SESSIONS_KEY, []), session]);
    },

    async latestSession(childId) {
      const sessions = read<Session[]>(SESSIONS_KEY, []).filter((s) => (s.childId ?? null) === childId);
      return sessions.reduce<Session | null>(
        (latest, s) => (latest === null || s.startedAt > latest.startedAt ? s : latest),
        null,
      );
    },

    async listResponses(sessionId) {
      return responsesOf(sessionId);
    },

    async saveResponse(response) {
      const others = responsesOf(response.sessionId).filter((r) => r.id !== response.id);
      write(responsesKey(response.sessionId), [...others, response]);
    },

    async deleteResponse(id) {
      for (const session of read<Session[]>(SESSIONS_KEY, [])) {
        const responses = responsesOf(session.id);
        if (responses.some((r) => r.id === id)) {
          write(responsesKey(session.id), responses.filter((r) => r.id !== id));
        }
      }
    },
  };
}

/** 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 메모리에만 둔다. */
export function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}
