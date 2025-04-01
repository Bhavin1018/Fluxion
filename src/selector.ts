import { Selector } from './types';

/**
 * Options for creating a selector
 */
export interface SelectorOptions<R> {
  /**
   * Equality function to determine if the selected value has changed
   * @param a Previous value
   * @param b New value
   * @returns True if the values are equal, false otherwise
   */
  equalityFn?: (a: R, b: R) => boolean;
  
  /**
   * Dependencies for the selector
   */
  deps?: any[];
}

/**
 * Default equality function that performs a shallow comparison
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null
  ) {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is((a as any)[key], (b as any)[key])
    ) {
      return false;
    }
  }
  
  return true;
}

/**
 * Creates a memoized selector
 * @param selectorFn The selector function
 * @param options Options for the selector
 * @returns A memoized selector function
 */
export function createSelector<T, R>(
  selectorFn: (state: T) => R,
  options: SelectorOptions<R> = {}
): (state: T) => R {
  const { equalityFn = shallowEqual, deps = [] } = options;
  
  let lastState: T | undefined;
  let lastResult: R | undefined;
  let lastDeps = deps;
  
  // Check if dependencies have changed
  const depsChanged = (newDeps: any[]) => {
    if (lastDeps.length !== newDeps.length) return true;
    
    for (let i = 0; i < newDeps.length; i++) {
      if (!Object.is(lastDeps[i], newDeps[i])) return true;
    }
    
    return false;
  };
  
  return (state: T) => {
    // If state or dependencies haven't changed, return the cached result
    if (
      lastState &&
      lastResult !== undefined &&
      (Object.is(state, lastState) || !depsChanged(deps))
    ) {
      return lastResult;
    }
    
    // Calculate the new result
    const result = selector(state);
    
    // If the result is the same according to the equality function, return the cached result
    if (
      lastResult !== undefined &&
      equalityFn(lastResult, result)
    ) {
      return lastResult;
    }
    
    // Update cached values
    lastState = state;
    lastResult = result;
    lastDeps = deps;
    
    return result;
  };
}

/**
 * Creates a selector that combines multiple selectors
 * @param selectors Array of selector functions
 * @param combiner Function to combine the results of the selectors
 * @param options Options for the selector
 * @returns A memoized selector function
 */
export function createCombinedSelector<T, R1, R>(
  selectors: Selector<T, R1>[],
  combiner: (results: R1[]) => R,
  options: SelectorOptions<T, R> = {}
): Selector<T, R> {
  return createSelector(
    (state: T) => {
      const results = selectors.map(selector => selector(state));
      return combiner(results);
    },
    options
  );
}

/**
 * Creates a factory for creating selectors with a specific state type
 * @returns A selector factory
 */
export function createSelectorFactory<T>() {
  return {
    /**
     * Creates a memoized selector for the state type
     * @param selector The selector function
     * @param options Options for the selector
     * @returns A memoized selector function
     */
    createSelector: <R>(
      selector: Selector<T, R>,
      options: SelectorOptions<R> = {}
    ) => createSelector(selector, options),
    
    /**
     * Creates a selector that combines multiple selectors for the state type
     * @param selectors Array of selector functions
     * @param combiner Function to combine the results of the selectors
     * @param options Options for the selector
     * @returns A memoized selector function
     */
    createCombinedSelector: <R1, R>(
      selectors: Selector<T, R1>[],
      combiner: (results: R1[]) => R,
      options: SelectorOptions<R> = {}
    ) => createCombinedSelector(selectors, combiner, options)
  };
}