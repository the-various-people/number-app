import type { Repository } from './types';
import { createWebRepository, memoryStorage, type KeyValueStorage } from './webRepository';

/**
 * 웹용 진입점. 태블릿 앱에서는 Metro가 repository.native.ts(SQLite)를 대신 고른다.
 * GitHub Pages는 웹 SQLite에 필요한 보안 헤더를 설정할 수 없어 브라우저 저장소를 쓴다.
 */
function browserStorage(): KeyValueStorage {
  try {
    const storage = globalThis.localStorage;
    const probe = 'number-app:probe';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return memoryStorage();
  }
}

export const repository: Repository = createWebRepository(browserStorage());
