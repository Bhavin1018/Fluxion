import { Store, Dispatch, Selector } from './types';

/**
 * Interface for a slice of state
 */
export interface Slice<T, S> {
  /**
   * Gets the slice of state
   * @returns The slice of state
   */
  getSlice: () => S;
  
  /**
   * Updates the slice of state
   * @param updater Function or object to update the slice
   */
  setSlice: (updater: ((state: S) => void | Partial<S>) | Partial<S>) => void;
  
  /**
   * Selects a value from the slice
   * @param selector Selector function
   * @returns The selected value
   */
  select: <U>(selector: (slice: S) => U) => U;
  
  /**
   * Creates a sub-slice from this slice
   * @param path Path to the sub-slice
   * @returns A new slice for the sub-slice
   */
  slice: <K extends keyof S>(path: K) => Slice<T, S[K]>;
}

/**
 * Creates a slice of state from a store
 * @param store The store to slice
 * @param path Path to the slice in the state
 * @returns A slice object
 */
export function createSlice<T extends object, K extends keyof T>(
  store: Store<T>,
  path: K
): Slice<T, T[K]> {
  const getSlice = () => store.getState()[path];
  
  const setSlice = (updater: ((state: T[K]) => void | Partial<T[K]>) | Partial<T[K]>) => {
    store.setState((state) => {
      if (typeof updater === 'function') {
        const result = updater(state[path]);
        if (result !== undefined) {
          state[path] = { ...state[path], ...result } as any;
        }
      } else {
        state[path] = { ...state[path], ...updater } as any;
      }
    });
  };
  
  const select = <U>(selector: (slice: T[K]) => U): U => {
    return selector(getSlice());
  };
  
  const slice = <J extends keyof T[K]>(childPath: J): Slice<T, T[K][J]> => {
    return createNestedSlice(store, path, childPath);
  };
  
  return {
    getSlice,
    setSlice,
    select,
    slice
  };
}

/**
 * Creates a nested slice of state
 * @param store The store to slice
 * @param parentPath Path to the parent slice
 * @param childPath Path to the child slice
 * @returns A slice object for the nested slice
 */
function createNestedSlice<T extends object, K extends keyof T, J extends keyof T[K]>(
  store: Store<T>,
  parentPath: K,
  childPath: J
): Slice<T, T[K][J]> {
  const getSlice = () => store.getState()[parentPath][childPath];
  
  const setSlice = (updater: ((state: T[K][J]) => void | Partial<T[K][J]>) | Partial<T[K][J]>) => {
    store.setState((state) => {
      if (typeof updater === 'function') {
        const result = updater(state[parentPath][childPath]);
        if (result !== undefined) {
          state[parentPath][childPath] = { ...state[parentPath][childPath], ...result } as any;
        }
      } else {
        state[parentPath][childPath] = { ...state[parentPath][childPath], ...updater } as any;
      }
    });
  };
  
  const select = <U>(selector: (slice: T[K][J]) => U): U => {
    return selector(getSlice());
  };
  
  const slice = <L extends keyof T[K][J]>(subPath: L): Slice<T, T[K][J][L]> => {
    // This would require a more complex implementation for deeper nesting
    // For simplicity, we'll just throw an error for now
    throw new Error('Nesting slices beyond 2 levels is not supported');
  };
  
  return {
    getSlice,
    setSlice,
    select,
    slice
  };
}

/**
 * Creates a hook to use a slice of state
 * @param useStore The useStore hook from createHooks
 * @returns A hook to use a slice of state
 */
export function createUseSlice<T extends object>(
  useStore: <U>(selector?: Selector<T, U>) => [U, Dispatch<T>]
) {
  return function useSlice<K extends keyof T>(path: K): [T[K], (updater: ((state: T[K]) => void | Partial<T[K]>) | Partial<T[K]>) => void] {
    const [state, setState] = useStore();
    
    const sliceState = state[path];
    
    const setSliceState = (updater: ((state: T[K]) => void | Partial<T[K]>) | Partial<T[K]>) => {
      setState((currentState) => {
        if (typeof updater === 'function') {
          const result = updater(currentState[path]);
          if (result !== undefined) {
            currentState[path] = { ...currentState[path], ...result } as any;
          }
        } else {
          currentState[path] = { ...currentState[path], ...updater } as any;
        }
      });
    };
    
    return [sliceState, setSliceState];
  };
}