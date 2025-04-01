/**
 * Storage adapters for ReactFlow persistence middleware
 * 
 * This module provides various storage adapters for the persistence middleware,
 * allowing state to be persisted to different storage mechanisms.
 */

import { StorageAdapter } from './persist';

/**
 * Creates a storage adapter for the given storage object
 * @param storage A storage object (localStorage, sessionStorage, etc.)
 * @returns A storage adapter
 */
export function createStorageAdapter<T = unknown>(storage: Storage): StorageAdapter<T> {
  return {
    getItem: (key: string) => {
      const value = storage.getItem(key);
      if (value === null) return null;
      try {
        return JSON.parse(value) as T;
      } catch (e) {
        console.error(`Failed to parse stored value for key "${key}":`, e);
        return null;
      }
    },
    setItem: (key: string, value: T) => {
      try {
        storage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error(`Failed to store value for key "${key}":`, e);
      }
    },
    removeItem: (key: string) => {
      storage.removeItem(key);
    }
  };
}

/**
 * Creates an in-memory storage adapter
 * Useful for testing or when persistence is not needed across page reloads
 * @returns A storage adapter that stores data in memory
 */
export function createMemoryStorageAdapter<T = unknown>(): StorageAdapter<T> {
  const storage = new Map<string, string>();
  
  return {
    getItem: (key: string) => {
      const value = storage.get(key);
      if (value === undefined) return null;
      try {
        return JSON.parse(value) as T;
      } catch (e) {
        console.error(`Failed to parse stored value for key "${key}":`, e);
        return null;
      }
    },
    setItem: (key: string, value: T) => {
      try {
        storage.set(key, JSON.stringify(value));
      } catch (e) {
        console.error(`Failed to store value for key "${key}":`, e);
      }
    },
    removeItem: (key: string) => {
      storage.delete(key);
    }
  };
}

/**
 * Creates an IndexedDB storage adapter
 * @param dbName The name of the IndexedDB database
 * @param storeName The name of the object store
 * @returns A storage adapter that uses IndexedDB
 */
export function createIndexedDBStorageAdapter<T = unknown>(
  dbName: string = 'reactflow-store',
  storeName: string = 'state'
): StorageAdapter<T> {
  let db: IDBDatabase | null = null;
  
  // Initialize the database
  const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      
      const request = indexedDB.open(dbName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      
      request.onsuccess = (event) => {
        db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  };
  
  return {
    getItem: async (key: string) => {
      try {
        const db = await initDB();
        return new Promise<T | null>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(key);
          
          request.onsuccess = () => {
            resolve(request.result || null);
          };
          
          request.onerror = () => {
            reject(request.error);
          };
        });
      } catch (e) {
        console.error(`Failed to get value for key "${key}" from IndexedDB:`, e);
        return null;
      }
    },
    
    setItem: async (key: string, value: T) => {
      try {
        const db = await initDB();
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.put(value, key);
          
          request.onsuccess = () => {
            resolve();
          };
          
          request.onerror = () => {
            reject(request.error);
          };
        });
      } catch (e) {
        console.error(`Failed to store value for key "${key}" in IndexedDB:`, e);
      }
    },
    
    removeItem: async (key: string) => {
      try {
        const db = await initDB();
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.delete(key);
          
          request.onsuccess = () => {
            resolve();
          };
          
          request.onerror = () => {
            reject(request.error);
          };
        });
      } catch (e) {
        console.error(`Failed to remove value for key "${key}" from IndexedDB:`, e);
      }
    }
  };
}

/**
 * Creates a storage adapter that uses cookies
 * Note: This has limitations on size and is not recommended for large state
 * @param options Configuration options for cookies
 * @returns A storage adapter that uses cookies
 */
export function createCookieStorageAdapter<T = unknown>(options: {
  path?: string;
  domain?: string;
  maxAge?: number;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
} = {}): StorageAdapter<T> {
  const { path = '/', domain, maxAge, secure, sameSite } = options;
  
  const setCookie = (name: string, value: string) => {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    
    if (path) cookie += `; path=${path}`;
    if (domain) cookie += `; domain=${domain}`;
    if (maxAge !== undefined) cookie += `; max-age=${maxAge}`;
    if (secure) cookie += '; secure';
    if (sameSite) cookie += `; samesite=${sameSite}`;
    
    document.cookie = cookie;
  };
  
  const getCookie = (name: string): string | null => {
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
      }
    }
    
    return null;
  };
  
  const removeCookie = (name: string) => {
    setCookie(name, '', { ...options, maxAge: -1 });
  };
  
  return {
    getItem: (key: string) => {
      const value = getCookie(key);
      if (value === null) return null;
      try {
        return JSON.parse(value) as T;
      } catch (e) {
        console.error(`Failed to parse stored value for key "${key}":`, e);
        return null;
      }
    },
    
    setItem: (key: string, value: T) => {
      try {
        setCookie(key, JSON.stringify(value));
      } catch (e) {
        console.error(`Failed to store value for key "${key}":`, e);
      }
    },
    
    removeItem: (key: string) => {
      removeCookie(key);
    }
  };
}

/**
 * Default storage adapters
 */
export const storageAdapters = {
  localStorage: typeof window !== 'undefined' && window.localStorage
    ? createStorageAdapter(window.localStorage)
    : null,
  sessionStorage: typeof window !== 'undefined' && window.sessionStorage
    ? createStorageAdapter(window.sessionStorage)
    : null,
  memory: createMemoryStorageAdapter(),
  // These are created on-demand to avoid unnecessary initialization
  indexedDB: (dbName?: string, storeName?: string) => 
    createIndexedDBStorageAdapter(dbName, storeName),
  cookie: (options?: Parameters<typeof createCookieStorageAdapter>[0]) => 
    createCookieStorageAdapter(options)
};