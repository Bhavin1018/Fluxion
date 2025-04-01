/**
 * Simplified API for computed/derived state in ReactFlow
 * 
 * This module provides an easier way to create and use computed values
 * that automatically update when their dependencies change.
 */

import { Store, Selector } from './types';
import { derived, DerivedOptions } from './derived';

/**
 * Options for creating a computed value
 */
export interface ComputedOptions<T, R> extends DerivedOptions<T, R> {
  /**
   * Name for the computed value (useful for debugging)
   */
  name?: string;
}

/**
 * Creates a computed value that automatically updates when its dependencies change
 * @param compute Function that computes the value
 * @param options Configuration options
 * @returns A selector function that returns the computed value
 * 
 * @example
 * const totalPrice = computed(
 *   (state) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
 *   { name: 'totalPrice' }
 * );
 * 
 * // Use in a component
 * const price = useSelector(totalPrice);
 */
export function computed<T, R>(
  compute: (state: T) => R,
  options: ComputedOptions<T, R> = {}
): Selector<T, R> {
  return derived(compute, options);
}

/**
 * Creates a computed value with explicit dependencies
 * @param deps Array of selectors for dependencies
 * @param compute Function that computes the value using the dependencies
 * @param options Configuration options
 * @returns A selector function that returns the computed value
 * 
 * @example
 * const subtotal = state => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
 * const taxRate = state => state.taxRate;
 * 
 * const totalWithTax = computedWith(
 *   [subtotal, taxRate],
 *   (subtotalValue, taxRateValue) => subtotalValue * (1 + taxRateValue),
 *   { name: 'totalWithTax' }
 * );
 * 
 * // Use in a component
 * const total = useSelector(totalWithTax);
 */
export function computedWith<T, D extends any[], R>(
  deps: Array<Selector<T, any>>,
  compute: (...depValues: D) => R,
  options: Omit<ComputedOptions<T, R>, 'deps'> = {}
): Selector<T, R> {
  return derived(
    (state: T) => {
      const depValues = deps.map(dep => dep(state)) as D;
      return compute(...depValues);
    },
    { ...options, deps }
  );
}

/**
 * Creates a hook for using computed values in components
 * @param store The store to compute from
 * @returns A hook for creating and using computed values
 * 
 * @example
 * const useComputed = createUseComputed(store);
 * 
 * function PriceDisplay() {
 *   const totalPrice = useComputed(
 *     state => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
 *   );
 *   
 *   return <div>Total: ${totalPrice}</div>;
 * }
 */
export function createUseComputed<T>(store: Store<T>) {
  /**
   * Hook for using computed values in components
   * @param compute Function that computes the value
   * @param options Configuration options
   * @returns The computed value
   */
  return function useComputed<R>(
    compute: (state: T) => R,
    options: ComputedOptions<T, R> = {}
  ): R {
    const selector = computed(compute, options);
    return store.use(selector);
  };
}

/**
 * Creates a hook for using computed values with explicit dependencies in components
 * @param store The store to compute from
 * @returns A hook for creating and using computed values with dependencies
 * 
 * @example
 * const useComputedWith = createUseComputedWith(store);
 * 
 * function TaxDisplay() {
 *   const totalWithTax = useComputedWith(
 *     [state => state.subtotal, state => state.taxRate],
 *     (subtotal, taxRate) => subtotal * (1 + taxRate)
 *   );
 *   
 *   return <div>Total with tax: ${totalWithTax}</div>;
 * }
 */
export function createUseComputedWith<T>(store: Store<T>) {
  /**
   * Hook for using computed values with explicit dependencies in components
   * @param deps Array of selectors for dependencies
   * @param compute Function that computes the value using the dependencies
   * @param options Configuration options
   * @returns The computed value
   */
  return function useComputedWith<D extends any[], R>(
    deps: Array<Selector<T, any>>,
    compute: (...depValues: D) => R,
    options: Omit<ComputedOptions<T, R>, 'deps'> = {}
  ): R {
    const selector = computedWith(deps, compute, options);
    return store.use(selector);
  };
}