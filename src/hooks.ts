import { useEffect, useState, useRef, useCallback } from 'react';
import { Store, Selector, Dispatch, HookFactory } from './types';

/**
 * Creates React hooks for a store
 * @param store The store to create hooks for
 * @returns An object containing React hooks for the store
 */
export function createHooks<T extends object>(store: Store<T>): HookFactory<T> {
  /**
   * Hook to access and update store state
   * @param selector Optional selector function to extract a slice of state
   * @returns A tuple containing the selected state and a dispatch function
   */
  const useStore = <U>(selector?: Selector<T, U>): [U extends undefined ? T : U, Dispatch<T>] => {
    const selectorFn = selector || (state => state as any);
    const [selectedState, setSelectedState] = useState<any>(() => selectorFn(store.getState()));
    const prevStateRef = useRef<any>(selectedState);
    
    useEffect(() => {
      // Get initial state
      setSelectedState(selectorFn(store.getState()));
      
      // Subscribe to state changes
      const subscription = store.subscribe((state) => {
        const newSelectedState = selectorFn(state);
        
        // Only update if the selected state has changed
        if (!shallowEqual(newSelectedState, prevStateRef.current)) {
          prevStateRef.current = newSelectedState;
          setSelectedState(newSelectedState);
        }
      });
      
      // Cleanup subscription
      return () => {
        subscription.unsubscribe();
      };
    }, []);
    
    return [selectedState, store.setState];
  };
  
  /**
   * Hook to select a slice of store state
   * @param selector Selector function to extract a slice of state
   * @returns The selected state
   */
  const useSelector = <U>(selector: Selector<T, U>): U => {
    const [state] = useStore(selector);
    return state;
  };
  
  /**
   * Hook to get the dispatch function
   * @returns The dispatch function
   */
  const useDispatch = (): Dispatch<T> => {
    return useCallback(store.setState, []);
  };
  
  return {
    useStore,
    useSelector,
    useDispatch
  };
}

/**
 * Performs a shallow equality check between two objects
 * @param objA First object
 * @param objB Second object
 * @returns True if the objects are shallowly equal, false otherwise
 */
function shallowEqual(objA: any, objB: any): boolean {
  if (Object.is(objA, objB)) {
    return true;
  }
  
  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is(objA[key], objB[key])
    ) {
      return false;
    }
  }
  
  return true;
}