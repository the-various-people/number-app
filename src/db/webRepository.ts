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
  const visible = <T extends { deletedAt?: number | null }>(rows: T[]) => rows.filter((r) => !r.deletedAt);
  /** 그 아이(null이면 아이 없음)의 지우지 않은 회기 */
  const sessionsOf = (childId: string | null) =>
    visible(read<Session[]>(SESSIONS_KEY, [])).filter((s) => (s.childId ?? null) === childId);

  return {
    async listChildren() {
      return visible(read<Child[]>(CHILDREN_KEY, [])).sort((a, b) => a.createdAt - b.createdAt);
    },

    async saveChild(child) {
      // 고칠 때도 등록한 순서가 바뀌지 않게 제자리에 바꿔 넣는다
      const all = read<Child[]>(CHILDREN_KEY, []);
      const at = all.findIndex((c) => c.id === child.id);
      write(CHILDREN_KEY, at < 0 ? [...all, child] : all.map((c, i) => (i === at ? child : c)));
    },

    async deleteChild(id, deletedAt) {
      write(
        CHILDREN_KEY,
        read<Child[]>(CHILDREN_KEY, []).map((c) => (c.id === id ? { ...c, deletedAt, updatedAt: deletedAt } : c)),
      );
      write(
        SESSIONS_KEY,
        read<Session[]>(SESSIONS_KEY, []).map((s) => (s.childId === id && !s.deletedAt ? { ...s, deletedAt } : s)),
      );
    },

    async deleteSession(id, deletedAt) {
      write(SESSIONS_KEY, read<Session[]>(SESSIONS_KEY, []).map((s) => (s.id === id ? { ...s, deletedAt } : s)));
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
      return sessionsOf(childId).reduce<Session | null>(
        (latest, s) => (latest === null || s.startedAt > latest.startedAt ? s : latest),
        null,
      );
    },

    async listSessions(childId) {
      return sessionsOf(childId).sort((a, b) => b.startedAt - a.startedAt);
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
