/**
 * Enhanced persistence middleware for ReactFlow
 * 
 * This module provides a flexible persistence system with support for
 * different storage adapters and improved configuration options.
 */

import { Middleware } from '../types';

/**
 * Interface for a storage adapter
 */
export interface StorageAdapter<T = unknown> {
  /**
   * Get a value from storage
   * @param key The key to get
   * @returns The stored value, or null if not found
   */
  getItem: (key: string) => T | null | Promise<T | null>;
  
  /**
   * Set a value in storage
   * @param key The key to set
   * @param value The value to store
   */
  setItem: (key: string, value: T) => void | Promise<void>;
  
  /**
   * Remove a value from storage
   * @param key The key to remove
   */
  removeItem: (key: string) => void | Promise<void>;
}

/**
 * Options for the persist middleware
 */
export interface PersistOptions<T> {
  /**
   * The storage adapter to use
   * @default localStorage adapter
   */
  storage?: StorageAdapter;
  
  /**
   * Keys to exclude from persistence
   */
  blacklist?: (keyof T)[];
  
  /**
   * Keys to include in persistence (if specified, only these keys will be persisted)
   */
  whitelist?: (keyof T)[];
  
  /**
   * Function to serialize state before storing
   * @default JSON.stringify
   */
  serialize?: (state: any) => string;
  
  /**
   * Function to deserialize stored state
   * @default JSON.parse
   */
  deserialize?: (str: string) => any;
  
  /**
   * Function to merge the persisted state with the initial state
   * @default Object spread merge
   */
  merge?: (persistedState: Partial<T>, initialState: T) => T;
  
  /**
   * Whether to rehydrate the state on initialization
   * @default true
   */
  rehydrate?: boolean;
  
  /**
   * Version of the stored state schema
   * Used for migration between versions
   */
  version?: number;
  
  /**
   * Migration function to handle version changes
   */
  migrate?: (persistedState: any, version: number) => any;
  
  /**
   * Function to determine if state should be persisted
   */
  shouldPersist?: (state: T) => boolean;
  
  /**
   * Debug mode
   * @default false
   */
  debug?: boolean;
}

// Import storage adapters from dedicated module
import { storageAdapters } from './storage-adapters';


/**
 * Creates a persistence middleware that saves state to a storage adapter
 * @param key The key to use for storage
 * @param options Configuration options for persistence
 * @returns A middleware function
 */
export function createPersistMiddleware<T>(
  key: string,
  options: PersistOptions<T> = {}
): Middleware<T> {
  const {
    storage = storageAdapters.localStorage,
    blacklist = [],
    whitelist,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    merge = (persisted, initial) => ({ ...initial, ...persisted }),
    rehydrate = true,
    version,
    migrate,
    shouldPersist = () => true,
    debug = false
  } = options;
  
  // Check if storage is available
  if (!storage) {
    if (debug) {
      console.warn('ReactFlow: No storage adapter available for persistence middleware');
    }
    return nextState => nextState;
  }
  
  // Flag to track if we've rehydrated the state
  let hasRehydrated = false;
  
  // Function to filter state based on blacklist/whitelist
  const filterState = (state: T): Partial<T> => {
    if (whitelist && whitelist.length > 0) {
      const filtered: Partial<T> = {};
      whitelist.forEach(key => {
        filtered[key] = state[key];
      });
      return filtered;
    }
    
    if (blacklist.length > 0) {
      const filtered = { ...state };
      blacklist.forEach(key => {
        delete filtered[key];
      });
      return filtered;
    }
    
    return state;
  };
  
  // Function to persist state
  const persistState = async (state: T) => {
    if (!shouldPersist(state)) return;
    
    try {
      const filteredState = filterState(state);
      const persistData = version !== undefined ? { state: filteredState, version } : filteredState;
      const serialized = serialize(persistData);
      await storage.setItem(key, serialized as any);
      
      if (debug) {
        console.log('ReactFlow: State persisted', filteredState);
      }
    } catch (error) {
      console.error('ReactFlow: Failed to persist state:', error);
    }
  };
  
  // Function to rehydrate state
  const rehydrateState = async (initialState: T): Promise<T> => {
    try {
      const persisted = await storage.getItem(key);
      
      if (persisted === null) {
        if (debug) {
          console.log('ReactFlow: No persisted state found');
        }
        return initialState;
      }
      
      let parsedState: any;
      
      // Handle versioned state
      if (version !== undefined) {
        const { state, version: storedVersion } = persisted as { state: Partial<T>, version: number };
        
        // Apply migration if versions don't match and migrate function is provided
        if (storedVersion !== version && migrate) {
          parsedState = migrate(state, storedVersion);
          if (debug) {
            console.log(`ReactFlow: Migrated state from version ${storedVersion} to ${version}`);
          }
        } else {
          parsedState = state;
        }
      } else {
        parsedState = persisted;
      }
      
      // Merge with initial state
      const mergedState = merge(parsedState, initialState);
      
      if (debug) {
        console.log('ReactFlow: State rehydrated', mergedState);
      }
      
      return mergedState;
    } catch (error) {
      console.error('ReactFlow: Failed to rehydrate state:', error);
      return initialState;
    }
  };
  
  return async (nextState, prevState, dispatch) => {
    // Rehydrate on first run if enabled
    if (rehydrate && !hasRehydrated) {
      hasRehydrated = true;
      const rehydratedState = await rehydrateState(nextState);
      
      // Only dispatch if the rehydrated state is different
      if (rehydratedState !== nextState) {
        dispatch(() => rehydratedState);
        return rehydratedState;
      }
    }
    
    // Persist state changes
    persistState(nextState);
    
    return nextState;
  };
}