/**
 * Vanilla JavaScript adapter for ReactFlow
 * 
 * This module provides utilities for using ReactFlow in non-React environments,
 * allowing the state management capabilities to be used with vanilla JavaScript
 * or other frameworks.
 */

import { Store, StateUpdater } from './types';

/**
 * Options for creating a vanilla store adapter
 */
export interface VanillaStoreOptions<T> {
  /**
   * Selector function to extract a slice of state
   * @param state The current state
   * @returns The selected state
   */
  selector?: (state: T) => any;
  
  /**
   * Function to run when state changes
   * @param state The current state
   * @param prevState The previous state
   */
  onChange?: (state: T, prevState: T) => void;
}

/**
 * Creates a vanilla JavaScript adapter for a ReactFlow store
 * @param store The ReactFlow store to adapt
 * @param options Configuration options
 * @returns An object with methods for interacting with the store
 */
export function createVanillaStore<T extends object>(
  store: Store<T>,
  options: VanillaStoreOptions<T> = {}
) {
  const { selector, onChange } = options;
  
  // Subscribe to store changes if onChange is provided
  if (onChange) {
    store.subscribe(onChange);
  }
  
  return {
    /**
     * Gets the current state or a selected slice of state
     * @returns The current state or selected slice
     */
    getState: () => {
      const state = store.getState();
      return selector ? selector(state) : state;
    },
    
    /**
     * Updates the state
     * @param updater Function or object to update the state
     */
    setState: (updater: StateUpdater<T> | Partial<T>) => {
      store.setState(updater as StateUpdater<T>);
    },
    
    /**
     * Subscribes to state changes
     * @param listener Function to call when state changes
     * @returns An object with an unsubscribe method
     */
    subscribe: (listener: (state: T, prevState: T) => void) => {
      return store.subscribe(listener);
    },
    
    /**
     * Selects a slice of state
     * @param selectorFn Function to select a slice of state
     * @returns The selected slice of state
     */
    select: <U>(selectorFn: (state: T) => U): U => {
      return selectorFn(store.getState());
    },
    
    /**
     * Destroys the store and cleans up resources
     */
    destroy: () => {
      store.destroy();
    }
  };
}

/**
 * Creates a computed value that updates when its dependencies change
 * @param store The vanilla store
 * @param compute Function to compute the value
 * @param deps Array of selectors for dependencies
 * @returns An object with a get method to get the current value
 */
export function computed<T extends object, R>(
  store: ReturnType<typeof createVanillaStore<T>>,
  compute: (state: T) => R,
  deps: Array<(state: T) => any> = []
) {
  let lastResult: R;
  let lastDepsValues: any[] = [];
  
  const calculate = () => {
    const state = store.getState();
    
    // If no explicit dependencies, recompute on every access
    if (deps.length === 0) {
      return compute(state);
    }
    
    // Extract dependency values
    const depsValues = deps.map(dep => dep(state));
    
    // Check if dependencies have changed
    const depsChanged = lastDepsValues.length === 0 || 
      depsValues.some((value, i) => value !== lastDepsValues[i]);
    
    // If dependencies haven't changed, return the cached result
    if (!depsChanged && lastResult !== undefined) {
      return lastResult;
    }
    
    // Compute the new result
    const result = compute(state);
    
    // Cache the result and dependency values
    lastResult = result;
    lastDepsValues = depsValues;
    
    return result;
  };
  
  return {
    /**
     * Gets the current computed value
     * @returns The computed value
     */
    get: () => calculate(),
    
    /**
     * Subscribes to changes in the computed value
     * @param listener Function to call when the computed value changes
     * @returns An object with an unsubscribe method
     */
    subscribe: (listener: (value: R) => void) => {
      let currentValue = calculate();
      
      const subscription = store.subscribe(() => {
        const newValue = calculate();
        if (newValue !== currentValue) {
          currentValue = newValue;
          listener(newValue);
        }
      });
      
      return subscription;
    }
  };
}

/**
 * Creates a store action that can be called directly
 * @param store The vanilla store
 * @param actionFn Function that defines the action
 * @returns A function that can be called to perform the action
 */
export function action<T extends object, Args extends any[]>(
  store: ReturnType<typeof createVanillaStore<T>>,
  actionFn: (state: T, ...args: Args) => void | Partial<T>
) {
  return (...args: Args) => {
    store.setState((state) => {
      return actionFn(state, ...args) || {};
    });
  };
}