/**
 * Derived state functionality for ReactFlow
 * 
 * This module provides utilities for creating and using derived (computed) state
 * with automatic dependency tracking and memoization.
 */

import { useCallback, useMemo } from 'react';
import { Store, Selector } from './types';
import { shallowEqual } from './selector';

/**
 * Options for creating derived state
 */
export interface DerivedOptions<T, R> {
  /**
   * Equality function to determine if the derived value has changed
   */
  equals?: (a: R, b: R) => boolean;
  
  /**
   * Selectors for dependencies
   * If provided, the derived value will only be recalculated when these dependencies change
   */
  deps?: Array<Selector<T, any>>;
}

/**
 * Creates a derived state selector with automatic dependency tracking
 * @param compute Function that computes the derived value
 * @param options Configuration options
 * @returns A selector function that returns the derived value
 */
export function derived<T, R>(
  compute: (state: T) => R,
  options: DerivedOptions<T, R> = {}
): Selector<T, R> {
  const { equals = shallowEqual, deps } = options;
  
  // If dependencies are provided, use them for memoization
  if (deps && deps.length > 0) {
    let lastResult: R | undefined;
    let lastDepsValues: any[] = [];
    
    return (state: T) => {
      // Extract dependency values
      const depsValues = deps.map(dep => dep(state));
      
      // Check if dependencies have changed
      const depsChanged = lastDepsValues.length === 0 || 
        depsValues.some((value, i) => !equals(value, lastDepsValues[i]));
      
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
  }
  
  // Without explicit dependencies, use simple memoization
  let lastState: T | undefined;
  let lastResult: R | undefined;
  
  return (state: T) => {
    // If state hasn't changed, return the cached result
    if (lastState === state && lastResult !== undefined) {
      return lastResult;
    }
    
    // Compute the new result
    const result = compute(state);
    
    // Cache the result and state
    lastResult = result;
    lastState = state;
    
    return result;
  };
}

/**
 * Creates a hook for using derived state in components
 * @param store The store to derive from
 * @returns A hook for creating and using derived state
 */
export function createUseDerived<T>(store: Store<T>) {
  /**
   * Hook for using derived state in components
   * @param compute Function that computes the derived value
   * @param options Configuration options
   * @returns The derived value
   */
  return function useDerived<R>(
    compute: (state: T) => R,
    options: DerivedOptions<T, R> = {}
  ): R {
    // Create the derived selector
    const selector = useMemo(
      () => derived(compute, options),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );
    
    // Use the selector to get the current value
    return store.use(selector);
  };
}

/**
 * Creates a hook for using derived state with dependencies in components
 * @param store The store to derive from
 * @returns A hook for creating and using derived state with dependencies
 */
export function createUseDerivedWithDeps<T>(store: Store<T>) {
  /**
   * Hook for using derived state with dependencies in components
   * @param compute Function that computes the derived value
   * @param deps Array of dependencies for the computation
   * @param options Configuration options
   * @returns The derived value
   */
  return function useDerivedWithDeps<R, D extends any[]>(
    compute: (state: T, ...deps: D) => R,
    deps: D,
    options: Omit<DerivedOptions<T, R>, 'deps'> = {}
  ): R {
    // Create a memoized compute function that includes the dependencies
    const memoizedCompute = useCallback(
      (state: T) => compute(state, ...deps),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      deps
    );
    
    // Create the derived selector
    const selector = useMemo(
      () => derived(memoizedCompute, options),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [memoizedCompute]
    );
    
    // Use the selector to get the current value
    return store.use(selector);
  };
}