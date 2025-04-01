/**
 * Enhanced type definitions for ReactFlow stores
 * 
 * This module provides improved TypeScript type inference for store creation and usage.
 */

import { Middleware } from '../types';

/**
 * Represents a state creator function that initializes store actions
 */
export type StateCreator<T extends object, U extends object = T> = (
  setState: (updater: ((state: T) => void | Partial<T>) | Partial<T>) => void,
  getState: () => T,
  store: Store<T>
) => U;

/**
 * Options for creating a store
 */
export interface StoreOptions<T extends object> {
  /**
   * Middleware functions to apply to the store
   */
  middleware?: Middleware<T>[];
  
  /**
   * Whether to enable Redux DevTools integration
   */
  devtools?: boolean;
  
  /**
   * Name of the store for DevTools
   */
  name?: string;
  
  /**
   * Whether to skip the initial state validation
   */
  skipValidation?: boolean;
}

/**
 * Represents a store subscription
 */
export interface Subscription {
  /**
   * Unsubscribe from store updates
   */
  unsubscribe: () => void;
}

/**
 * Represents a listener function that is called when state changes
 */
export type Listener<T> = (state: T, prevState: T) => void;

/**
 * Represents a selector function that extracts a slice of state
 */
export type Selector<T, U> = (state: T) => U;

/**
 * Represents a state updater function
 */
export type StateUpdater<T> = (state: T) => T | Partial<T> | void;

/**
 * Represents a dispatch function for actions
 */
export type Dispatch<T> = (updater: StateUpdater<T>) => void;

/**
 * Represents the core store interface
 */
export interface Store<T extends object> {
  /**
   * Gets the current state
   */
  getState: () => T;
  
  /**
   * Updates the state
   */
  setState: Dispatch<T>;
  
  /**
   * Subscribes to state changes
   */
  subscribe: (listener: Listener<T>) => Subscription;
  
  /**
   * Selects a slice of state
   */
  use: <U>(selector: Selector<T, U>) => U;
  
  /**
   * Destroys the store and cleans up resources
   */
  destroy: () => void;
  
  /**
   * Resets the store to its initial state
   */
  reset?: () => void;
}

/**
 * Type helper for extracting the state type from a store
 */
export type StoreState<S> = S extends Store<infer T> ? T : never;

/**
 * Type helper for creating a store API with state and actions
 */
export type StoreApi<T extends object> = Store<T> & {
  /**
   * Initializes the store with actions
   */
  initialize: <U extends object>(initializer: StateCreator<T, U>) => StoreApi<T & U>;
};