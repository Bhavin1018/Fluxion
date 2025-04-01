/**
 * Enhanced middleware system for ReactFlow
 * 
 * This module provides a more composable middleware system with support for
 * various storage adapters and improved type safety.
 */

import { Middleware } from '../types';

// Re-export existing middleware creators for backward compatibility
export { 
  createLoggerMiddleware,
  createThrottleMiddleware 
} from './basic';

export { 
  createPersistMiddleware,
  PersistOptions,
  StorageAdapter,
  createStorageAdapter
} from './persist';

export { 
  storageAdapters,
  createMemoryStorageAdapter,
  createIndexedDBStorageAdapter,
  createCookieStorageAdapter
} from './storage-adapters';

/**
 * Combines multiple middleware functions into a single middleware
 * @param middlewares Array of middleware functions to combine
 * @returns A single middleware function that applies all middlewares in sequence
 */
export function combineMiddleware<T>(...middlewares: Middleware<T>[]): Middleware<T> {
  return (nextState, prevState, dispatch) => {
    return middlewares.reduce(
      (state, middleware) => {
        const result = middleware(state, prevState, dispatch);
        return result !== undefined ? result : state;
      },
      nextState
    );
  };
}

/**
 * Creates a middleware that only applies to specific parts of the state
 * @param paths Array of state paths to apply the middleware to
 * @param middleware The middleware to apply
 * @returns A middleware that only affects the specified paths
 */
export function createScopedMiddleware<T>(
  paths: (keyof T)[],
  middleware: Middleware<T>
): Middleware<T> {
  return (nextState, prevState, dispatch) => {
    // Check if any of the specified paths have changed
    const hasChanges = paths.some(path => 
      nextState[path] !== prevState[path]
    );
    
    // Only apply middleware if relevant paths have changed
    if (hasChanges) {
      return middleware(nextState, prevState, dispatch);
    }
    
    return nextState;
  };
}

/**
 * Creates a middleware that only runs when a condition is met
 * @param condition Function that determines whether to apply the middleware
 * @param middleware The middleware to conditionally apply
 * @returns A conditional middleware
 */
export function createConditionalMiddleware<T>(
  condition: (nextState: T, prevState: T) => boolean,
  middleware: Middleware<T>
): Middleware<T> {
  return (nextState, prevState, dispatch) => {
    if (condition(nextState, prevState)) {
      return middleware(nextState, prevState, dispatch);
    }
    return nextState;
  };
}

/**
 * Creates a middleware that runs asynchronously
 * @param middleware The middleware to run asynchronously
 * @returns An async middleware
 */
export function createAsyncMiddleware<T>(
  middleware: Middleware<T>
): Middleware<T> {
  return (nextState, prevState, dispatch) => {
    // Return the state immediately
    const result = middleware(nextState, prevState, dispatch);
    
    // If middleware returned a modified state, use that
    if (result !== undefined && result !== nextState) {
      return result;
    }
    
    // Otherwise, schedule an async update if needed
    setTimeout(() => {
      const asyncResult = middleware(nextState, prevState, dispatch);
      if (asyncResult !== undefined && asyncResult !== nextState) {
        dispatch(() => asyncResult);
      }
    }, 0);
    
    return nextState;
  };
}